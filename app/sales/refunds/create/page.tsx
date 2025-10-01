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
  FileText,
  Save,
  User,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  Search,
  RotateCcw
} from 'lucide-react'

interface Client {
  id: string
  companyName: string
  contactPerson: string
  email: string
}

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  status: string
}

interface RefundFormData {
  receiptNumber: string
  clientId: string
  invoiceId: string
  refundAmount: number
  refundDate: string
  refundMethod: string
  reason: string
  notes: string
  status: string
}

export default function CreateRefundPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const [formData, setFormData] = useState<RefundFormData>({
    receiptNumber: '',
    clientId: '',
    invoiceId: '',
    refundAmount: 0,
    refundDate: new Date().toISOString().split('T')[0],
    refundMethod: 'BANK_TRANSFER',
    reason: '',
    notes: '',
    status: 'DRAFT'
  })

  const canManage = hasFullAccess('sales')

  // Generate receipt number on mount
  useEffect(() => {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    setFormData(prev => ({ ...prev, receiptNumber: `REF-${dateStr}-${randomNum}` }))
  }, [])

  // Fetch clients for dropdown
  useEffect(() => {
    fetchClients()
  }, [])

  // Fetch invoices when client is selected
  useEffect(() => {
    if (formData.clientId) {
      fetchInvoices(formData.clientId)
    } else {
      setInvoices([])
      setSelectedInvoice(null)
    }
  }, [formData.clientId])

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

  const fetchInvoices = async (clientId: string) => {
    try {
      setInvoicesLoading(true)
      const response = await fetch(`/api/sales/invoices?clientId=${clientId}&status=PAID`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch invoices')
      }

      if (result.success) {
        setInvoices(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setInvoicesLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.contactPerson.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.receiptNumber.trim()) {
      newErrors.receiptNumber = 'Receipt number is required'
    }

    if (!formData.clientId) {
      newErrors.clientId = 'Please select a client'
    }

    if (!formData.invoiceId) {
      newErrors.invoiceId = 'Please select an invoice'
    }

    if (formData.refundAmount <= 0) {
      newErrors.refundAmount = 'Refund amount must be greater than 0'
    }

    if (selectedInvoice && formData.refundAmount > (selectedInvoice.total_amount || 0)) {
      newErrors.refundAmount = `Refund amount cannot exceed invoice total (${(selectedInvoice.total_amount || 0).toFixed(2)})`
    }

    if (!formData.refundDate) {
      newErrors.refundDate = 'Refund date is required'
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason for refund is required'
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
        clientId: formData.clientId,
        invoiceId: formData.invoiceId,
        issueDate: new Date(formData.refundDate).toISOString().split('T')[0],
        amount: formData.refundAmount,
        reason: formData.reason,
        status: formData.status
      }

      const response = await fetch('/api/sales/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to create refunds')
        } else if (response.status === 403) {
          throw new Error('You don\'t have permission to create refunds')
        } else {
          throw new Error(result.error || 'Failed to create refund')
        }
      }

      if (result.success) {
        router.push('/sales/refunds')
      } else {
        throw new Error(result.error || 'Failed to create refund')
      }
    } catch (error) {
      console.error('Error creating refund:', error)
      setError(error instanceof Error ? error.message : 'Failed to create refund')
    } finally {
      setLoading(false)
    }
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <RotateCcw className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to create refunds.</p>
            <Link href="/sales/refunds" className="mt-4 inline-block">
              <Button variant="outline">← Back to Refunds</Button>
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
              <Link href="/sales/refunds">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Refunds
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Refund Receipt</h1>
                <p className="text-sm text-gray-600">Issue a refund to a client</p>
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

                {/* Receipt Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Receipt Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="receiptNumber">Receipt Number *</Label>
                        <Input
                          id="receiptNumber"
                          value={formData.receiptNumber}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))
                            if (errors.receiptNumber) {
                              setErrors(prev => ({ ...prev, receiptNumber: '' }))
                            }
                          }}
                          className={errors.receiptNumber ? 'border-red-300' : ''}
                        />
                        {errors.receiptNumber && (
                          <p className="mt-1 text-sm text-red-600">{errors.receiptNumber}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="refundDate">Refund Date *</Label>
                        <Input
                          id="refundDate"
                          type="date"
                          value={formData.refundDate}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, refundDate: e.target.value }))
                            if (errors.refundDate) {
                              setErrors(prev => ({ ...prev, refundDate: '' }))
                            }
                          }}
                          className={errors.refundDate ? 'border-red-300' : ''}
                        />
                        {errors.refundDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.refundDate}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="ISSUED">Issued</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Client & Invoice Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Client & Invoice
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
                                  setFormData(prev => ({ ...prev, clientId: client.id, invoiceId: '' }))
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
                                setFormData(prev => ({ ...prev, clientId: '', invoiceId: '' }))
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

                    {/* Invoice Selection */}
                    {formData.clientId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Original Invoice *
                        </label>
                        <select
                          value={formData.invoiceId}
                          onChange={(e) => {
                            const invoiceId = e.target.value
                            const invoice = invoices.find(inv => inv.id === invoiceId)
                            setSelectedInvoice(invoice || null)
                            setFormData(prev => ({
                              ...prev,
                              invoiceId,
                              refundAmount: invoice ? (invoice.total_amount || 0) : 0
                            }))
                            if (errors.invoiceId) {
                              setErrors(prev => ({ ...prev, invoiceId: '' }))
                            }
                          }}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.invoiceId ? 'border-red-300' : ''}`}
                          disabled={invoicesLoading}
                        >
                          <option value="">
                            {invoicesLoading ? 'Loading invoices...' : 'Select an invoice...'}
                          </option>
                          {invoices.map(invoice => (
                            <option key={invoice.id} value={invoice.id}>
                              {invoice.invoice_number} - ${(invoice.total_amount || 0).toFixed(2)}
                            </option>
                          ))}
                        </select>
                        {errors.invoiceId && (
                          <p className="mt-1 text-sm text-red-600">{errors.invoiceId}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Refund Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Refund Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="refundAmount">Refund Amount *</Label>
                        <Input
                          id="refundAmount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={formData.refundAmount || ''}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, refundAmount: parseFloat(e.target.value) || 0 }))
                            if (errors.refundAmount) {
                              setErrors(prev => ({ ...prev, refundAmount: '' }))
                            }
                          }}
                          className={errors.refundAmount ? 'border-red-300' : ''}
                        />
                        {errors.refundAmount && (
                          <p className="mt-1 text-sm text-red-600">{errors.refundAmount}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="refundMethod">Refund Method</Label>
                        <select
                          id="refundMethod"
                          value={formData.refundMethod}
                          onChange={(e) => setFormData(prev => ({ ...prev, refundMethod: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="CASH">Cash</option>
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                          <option value="CREDIT_CARD">Credit Card Reversal</option>
                          <option value="CHEQUE">Cheque</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="reason">Reason for Refund *</Label>
                      <Textarea
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, reason: e.target.value }))
                          if (errors.reason) {
                            setErrors(prev => ({ ...prev, reason: '' }))
                          }
                        }}
                        placeholder="Describe the reason for this refund"
                        rows={3}
                        className={errors.reason ? 'border-red-300' : ''}
                      />
                      {errors.reason && (
                        <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add any additional notes"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Sidebar */}
              <div className="space-y-6">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Refund Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedClient && (
                      <div>
                        <span className="text-sm text-gray-600">Client:</span>
                        <p className="font-medium">{selectedClient.companyName}</p>
                      </div>
                    )}

                    {selectedInvoice && (
                      <>
                        <div>
                          <span className="text-sm text-gray-600">Invoice:</span>
                          <p className="font-medium">{selectedInvoice.invoice_number}</p>
                        </div>

                        <div>
                          <span className="text-sm text-gray-600">Invoice Total:</span>
                          <p className="font-medium">${(selectedInvoice.total_amount || 0).toFixed(2)}</p>
                        </div>
                      </>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Refund Amount:</span>
                        <span className="text-lg font-bold text-orange-600">${formData.refundAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={formData.status === 'ISSUED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                        {formData.status}
                      </Badge>
                    </div>

                    <div className="pt-6">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading || !selectedInvoice}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Refund...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Create Refund Receipt
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-center">
                      <Link href="/sales/refunds">
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
