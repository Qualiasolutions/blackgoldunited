'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Repeat,
  Save,
  User,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  Search,
  FileText
} from 'lucide-react'

interface Client {
  id: string
  companyName: string
  contactPerson: string
  email: string
}

interface RecurringFormData {
  templateName: string
  clientId: string
  frequency: string
  startDate: string
  endDate: string
  nextGenerationDate: string
  amount: number
  description: string
  isActive: boolean
  autoSend: boolean
}

export default function CreateRecurringInvoicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const [formData, setFormData] = useState<RecurringFormData>({
    templateName: '',
    clientId: '',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    nextGenerationDate: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    isActive: true,
    autoSend: false
  })

  const canManage = hasFullAccess('sales')

  // Fetch clients for dropdown
  useEffect(() => {
    fetchClients()
  }, [])

  // Auto-calculate next generation date when frequency or start date changes
  useEffect(() => {
    if (formData.startDate && formData.frequency) {
      const startDate = new Date(formData.startDate)
      let nextDate = new Date(startDate)

      switch (formData.frequency) {
        case 'WEEKLY':
          nextDate.setDate(nextDate.getDate() + 7)
          break
        case 'MONTHLY':
          nextDate.setMonth(nextDate.getMonth() + 1)
          break
        case 'QUARTERLY':
          nextDate.setMonth(nextDate.getMonth() + 3)
          break
        case 'YEARLY':
          nextDate.setFullYear(nextDate.getFullYear() + 1)
          break
      }

      setFormData(prev => ({
        ...prev,
        nextGenerationDate: nextDate.toISOString().split('T')[0]
      }))
    }
  }, [formData.startDate, formData.frequency])

  const fetchClients = async () => {
    try {
      setClientsLoading(true)
      const response = await fetch('/api/clients?limit=50', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch clients')
      }

      if (result.success) {
        // Map snake_case from API to camelCase
        const mappedClients = (result.data || []).map((client: any) => ({
          id: client.id,
          companyName: client.company_name,
          contactPerson: client.contact_person,
          email: client.email
        }))
        setClients(mappedClients)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setClientsLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.contactPerson.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.templateName.trim()) {
      newErrors.templateName = 'Template name is required'
    }

    if (!formData.clientId) {
      newErrors.clientId = 'Please select a client'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const submitData = {
        templateName: formData.templateName,
        clientId: formData.clientId,
        frequency: formData.frequency,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        nextGenerationDate: new Date(formData.nextGenerationDate).toISOString(),
        templateData: {
          total_amount: formData.amount,
          description: formData.description,
          auto_send: formData.autoSend
        },
        isActive: formData.isActive
      }

      const response = await fetch('/api/sales/recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to create recurring invoices')
        } else if (response.status === 403) {
          throw new Error('You don\'t have permission to create recurring invoices')
        } else {
          throw new Error(result.error || 'Failed to create recurring invoice')
        }
      }

      if (result.success) {
        router.push('/sales/recurring')
      } else {
        throw new Error(result.error || 'Failed to create recurring invoice')
      }
    } catch (error) {
      console.error('Error creating recurring invoice:', error)
      setError(error instanceof Error ? error.message : 'Failed to create recurring invoice')
    } finally {
      setLoading(false)
    }
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Repeat className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to create recurring invoices.</p>
            <Link href="/sales/recurring" className="mt-4 inline-block">
              <Button variant="outline">← Back to Recurring Invoices</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/sales/recurring">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Recurring Invoices
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Repeat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Recurring Invoice</h1>
                <p className="text-sm text-gray-600">Set up automatic invoice generation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Full Access
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">

          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error:</span>
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">

                {/* Template Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Template Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="templateName">Template Name *</Label>
                      <Input
                        id="templateName"
                        value={formData.templateName}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, templateName: e.target.value }))
                          if (errors.templateName) {
                            setErrors(prev => ({ ...prev, templateName: '' }))
                          }
                        }}
                        placeholder="e.g., Monthly Retainer - Client Name"
                        className={errors.templateName ? 'border-red-300' : ''}
                      />
                      {errors.templateName && (
                        <p className="mt-1 text-sm text-red-600">{errors.templateName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, description: e.target.value }))
                          if (errors.description) {
                            setErrors(prev => ({ ...prev, description: '' }))
                          }
                        }}
                        placeholder="Describe the recurring service or product"
                        rows={3}
                        className={errors.description ? 'border-red-300' : ''}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Client Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Client Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Client *
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder={selectedClient ? selectedClient.companyName : "Search clients..."}
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value)
                            setShowClientDropdown(true)
                          }}
                          onFocus={() => setShowClientDropdown(true)}
                          className={`pl-10 ${errors.clientId ? 'border-red-300' : ''}`}
                        />
                      </div>

                      {showClientDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                          {clientsLoading ? (
                            <div className="px-4 py-2 text-gray-500">Loading clients...</div>
                          ) : filteredClients.length === 0 ? (
                            <div className="px-4 py-2 text-gray-500">No clients found</div>
                          ) : (
                            filteredClients.map((client) => (
                              <button
                                key={client.id}
                                type="button"
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100"
                                onClick={() => {
                                  setSelectedClient(client)
                                  setFormData(prev => ({ ...prev, clientId: client.id }))
                                  setClientSearch('')
                                  setShowClientDropdown(false)
                                  if (errors.clientId) {
                                    setErrors(prev => ({ ...prev, clientId: '' }))
                                  }
                                }}
                              >
                                <div className="font-medium">{client.companyName}</div>
                                <div className="text-sm text-gray-500">{client.contactPerson} • {client.email}</div>
                              </button>
                            ))
                          )}
                        </div>
                      )}

                      {selectedClient && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-blue-900">{selectedClient.companyName}</div>
                              <div className="text-sm text-blue-700">{selectedClient.contactPerson}</div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedClient(null)
                                setFormData(prev => ({ ...prev, clientId: '' }))
                              }}
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                      )}

                      {errors.clientId && (
                        <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Schedule Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="frequency">Frequency *</Label>
                        <select
                          id="frequency"
                          value={formData.frequency}
                          onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="WEEKLY">Weekly</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="QUARTERLY">Quarterly</option>
                          <option value="YEARLY">Yearly</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="amount">Amount *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={formData.amount || ''}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                            if (errors.amount) {
                              setErrors(prev => ({ ...prev, amount: '' }))
                            }
                          }}
                          className={errors.amount ? 'border-red-300' : ''}
                        />
                        {errors.amount && (
                          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, startDate: e.target.value }))
                            if (errors.startDate) {
                              setErrors(prev => ({ ...prev, startDate: '' }))
                            }
                          }}
                          className={errors.startDate ? 'border-red-300' : ''}
                        />
                        {errors.startDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="endDate">End Date (Optional)</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          min={formData.startDate}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="nextGenerationDate">Next Billing Date</Label>
                      <Input
                        id="nextGenerationDate"
                        type="date"
                        value={formData.nextGenerationDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, nextGenerationDate: e.target.value }))}
                        min={formData.startDate}
                      />
                      <p className="mt-1 text-sm text-gray-500">Auto-calculated based on frequency</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="isActive" className="cursor-pointer">
                        Active (start generating invoices immediately)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoSend"
                        checked={formData.autoSend}
                        onChange={(e) => setFormData(prev => ({ ...prev, autoSend: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="autoSend" className="cursor-pointer">
                        Auto-send invoices to client
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Sidebar */}
              <div className="space-y-6">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedClient && (
                      <div>
                        <span className="text-sm text-gray-600">Client:</span>
                        <p className="font-medium">{selectedClient.companyName}</p>
                      </div>
                    )}

                    <div>
                      <span className="text-sm text-gray-600">Frequency:</span>
                      <p className="font-medium capitalize">{formData.frequency.toLowerCase()}</p>
                    </div>

                    <div>
                      <span className="text-sm text-gray-600">Amount per Invoice:</span>
                      <p className="text-lg font-bold text-green-600">${formData.amount.toFixed(2)}</p>
                    </div>

                    {formData.nextGenerationDate && (
                      <div>
                        <span className="text-sm text-gray-600">Next Invoice:</span>
                        <p className="font-medium">
                          {new Date(formData.nextGenerationDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={formData.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {formData.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </div>

                    <div className="pt-6">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Template...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Create Recurring Invoice
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-center">
                      <Link href="/sales/recurring">
                        <Button variant="ghost" size="sm">
                          Cancel
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
