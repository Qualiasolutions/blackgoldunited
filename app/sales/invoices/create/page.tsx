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
import {
  ArrowLeft,
  FileText,
  Save,
  Plus,
  Trash2,
  User,
  Building,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  Search
} from 'lucide-react'

interface Client {
  id: string
  companyName: string
  contactPerson: string
  email: string
}

interface InvoiceItem {
  id: string
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  lineTotal: number
}

interface InvoiceFormData {
  clientId: string
  issueDate: string
  dueDate: string
  status: 'DRAFT' | 'SENT'
  discountAmount: number
  notes: string
  terms: string
  items: InvoiceItem[]
}

export default function CreateInvoicePage() {
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

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    status: 'DRAFT',
    discountAmount: 0,
    notes: '',
    terms: '',
    items: [{
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      lineTotal: 0
    }]
  })

  const canManage = hasFullAccess('sales')

  // Fetch clients for dropdown
  useEffect(() => {
    fetchClients()
  }, [])

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
        // Transform snake_case to camelCase
        const transformedClients = (result.data || []).map((client: any) => ({
          id: client.id,
          companyName: client.company_name,
          contactPerson: client.contact_person,
          email: client.email
        }))
        setClients(transformedClients)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setClientsLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.companyName?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.contactPerson?.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const calculateItemTotal = (quantity: number, unitPrice: number, taxRate: number) => {
    const subtotal = quantity * unitPrice
    const tax = subtotal * (taxRate / 100)
    return subtotal + tax
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalculate line total
    const item = updatedItems[index]
    item.lineTotal = calculateItemTotal(item.quantity, item.unitPrice, item.taxRate)

    setFormData(prev => ({ ...prev, items: updatedItems }))
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      lineTotal: 0
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice
      return sum + (itemSubtotal * (item.taxRate / 100))
    }, 0)
    const total = subtotal + taxAmount - formData.discountAmount

    return { subtotal, taxAmount, total }
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.clientId) {
      newErrors.clientId = 'Please select a client'
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required'
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required'
    }

    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'Description is required'
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0'
      }
      if (item.unitPrice < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price cannot be negative'
      }
    })

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
        clientId: formData.clientId,
        issueDate: new Date(formData.issueDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status,
        discountAmount: formData.discountAmount,
        notes: formData.notes,
        terms: formData.terms,
        items: formData.items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate
        }))
      }

      const response = await fetch('/api/sales/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to create invoices')
        } else if (response.status === 403) {
          throw new Error('You don\'t have permission to create invoices')
        } else if (result.details) {
          // Zod validation errors
          throw new Error('Please check the form for errors: ' + result.details.map((d: any) => d.message).join(', '))
        } else {
          throw new Error(result.error || 'Failed to create invoice')
        }
      }

      if (result.success) {
        router.push(`/sales/invoices/${result.data.id}`)
      } else {
        throw new Error(result.error || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      setError(error instanceof Error ? error.message : 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to create invoices.</p>
            <Link href="/sales/invoices" className="mt-4 inline-block">
              <Button variant="outline">← Back to Invoices</Button>
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
              <Link href="/sales/invoices">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Invoices
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
                <p className="text-sm text-gray-600">Create a new customer invoice</p>
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

              {/* Main Invoice Form */}
              <div className="lg:col-span-2 space-y-6">

                {/* Client Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Client Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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

                {/* Invoice Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Issue Date
                        </label>
                        <Input
                          type="date"
                          value={formData.issueDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Due Date *
                        </label>
                        <Input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                          className={errors.dueDate ? 'border-red-300' : ''}
                        />
                        {errors.dueDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'DRAFT' | 'SENT' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="SENT">Send to Client</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount Amount
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.discountAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Items */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Invoice Items
                      </CardTitle>
                      <Button type="button" variant="outline" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {errors.items && (
                      <p className="mb-4 text-sm text-red-600">{errors.items}</p>
                    )}

                    <div className="space-y-4">
                      {formData.items.map((item, index) => (
                        <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Item {index + 1}</h4>
                            {formData.items.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description *
                              </label>
                              <Input
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                placeholder="Enter item description"
                                className={errors[`item_${index}_description`] ? 'border-red-300' : ''}
                              />
                              {errors[`item_${index}_description`] && (
                                <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_description`]}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity *
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className={errors[`item_${index}_quantity`] ? 'border-red-300' : ''}
                              />
                              {errors[`item_${index}_quantity`] && (
                                <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit Price *
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className={errors[`item_${index}_unitPrice`] ? 'border-red-300' : ''}
                              />
                              {errors[`item_${index}_unitPrice`] && (
                                <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_unitPrice`]}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tax Rate (%)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={item.taxRate}
                                onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Line Total
                              </label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                                ${item.lineTotal.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes and Terms */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add any additional notes for this invoice"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Terms & Conditions
                      </label>
                      <Textarea
                        value={formData.terms}
                        onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                        placeholder="Enter payment terms and conditions"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Invoice Summary Sidebar */}
              <div className="space-y-6">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Invoice Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">${taxAmount.toFixed(2)}</span>
                    </div>

                    {formData.discountAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-red-600">-${formData.discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-lg font-bold">${total.toFixed(2)}</span>
                      </div>
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
                            Creating Invoice...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Create Invoice
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-center">
                      <Link href="/sales/invoices">
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