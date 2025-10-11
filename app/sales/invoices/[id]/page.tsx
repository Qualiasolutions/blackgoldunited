'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  FileText,
  Edit,
  Download,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Building,
  Mail,
  DollarSign,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface InvoiceClient {
  id: string
  companyName: string
  contactPerson: string | null
  email: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
  taxRate: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string | null
  issueDate: string | null
  dueDate: string | null
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
  paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  notes?: string | null
  terms?: string | null
  createdAt: string | null
  updatedAt: string | null
  client: InvoiceClient | null
  items: InvoiceItem[]
}

export default function InvoiceViewPage() {
  const params = useParams()
  const { hasModuleAccess, hasFullAccess } = usePermissions()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const canManage = hasFullAccess('sales')
  const canRead = hasModuleAccess('sales')
  const invoiceId = params?.id as string

  // Validate UUID format before making API call
  const isValidUUID = (id: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  }

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/sales/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view this invoice')
        } else if (response.status === 403) {
          throw new Error('You don\'t have permission to view this invoice')
        } else if (response.status === 404) {
          throw new Error('Invoice not found')
        } else {
          throw new Error(result.error || 'Failed to fetch invoice')
        }
      }

      if (result.success) {
        setInvoice(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch invoice')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch invoice')
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    if (canRead && invoiceId) {
      // Check if invoiceId is a valid UUID
      if (!isValidUUID(invoiceId)) {
        setError('Invalid invoice ID format')
        setLoading(false)
        return
      }
      fetchInvoice()
    }
  }, [canRead, invoiceId, fetchInvoice])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-700', icon: Clock },
      SENT: { color: 'bg-blue-100 text-blue-700', icon: Send },
      PAID: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      OVERDUE: { color: 'bg-red-100 text-red-700', icon: AlertCircle },
      CANCELLED: { color: 'bg-gray-100 text-gray-700', icon: XCircle },
      REFUNDED: { color: 'bg-purple-100 text-purple-700', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
    const IconComponent = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-gray-100 text-gray-700' },
      PARTIAL: { color: 'bg-yellow-100 text-yellow-700' },
      COMPLETED: { color: 'bg-green-100 text-green-700' },
      FAILED: { color: 'bg-red-100 text-red-700' },
      REFUNDED: { color: 'bg-purple-100 text-purple-700' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

    return (
      <Badge className={`${config.color}`}>
        {status}
      </Badge>
    )
  }

  const handleDownloadPdf = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/sales/invoices/${invoice.id}/pdf`)
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error ?? 'Failed to download invoice PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoice.invoiceNumber || 'invoice'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (downloadError) {
      console.error('Error downloading invoice PDF:', downloadError)
      alert(downloadError instanceof Error ? downloadError.message : 'Unable to download invoice PDF. Please try again.')
    }
  }

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view invoices.</p>
            <Link href="/sales/invoices" className="mt-4 inline-block">
              <Button variant="outline">← Back to Invoices</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading invoice...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-2">
              <Button variant="outline" onClick={fetchInvoice}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Link href="/sales/invoices">
                <Button variant="ghost">← Back to Invoices</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invoice Not Found</h1>
            <p className="text-gray-600">The requested invoice could not be found.</p>
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
                <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
                <p className="text-sm text-gray-600">Invoice Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(invoice.status)}
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {canManage ? 'Full Access' : 'Read Only'}
              </Badge>

              <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>

              {canManage && (
                <Link href={`/sales/invoices/${invoice.id}/edit`}>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Invoice
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Invoice Details */}
            <div className="lg:col-span-2 space-y-6">

              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invoice.client ? (
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{invoice.client.companyName}</h3>
                        {invoice.client.contactPerson && (
                          <p className="text-gray-600">{invoice.client.contactPerson}</p>
                        )}
                      </div>

                      {invoice.client.email && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{invoice.client.email}</span>
                        </div>
                      )}

                      {(invoice.client.address || invoice.client.city) && (
                        <div className="text-gray-600">
                          {invoice.client.address && <div>{invoice.client.address}</div>}
                          <div>
                            {[invoice.client.city, invoice.client.state, invoice.client.country]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">Client information unavailable.</p>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Invoice Items ({invoice.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoice.items.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{item.description}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="block font-medium">Quantity</span>
                                <span>{item.quantity}</span>
                              </div>
                              <div>
                                <span className="block font-medium">Unit Price</span>
                                <span>${item.unitPrice.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="block font-medium">Tax Rate</span>
                                <span>{item.taxRate.toFixed(2)}%</span>
                              </div>
                              <div>
                                <span className="block font-medium">Line Total</span>
                                <span className="font-semibold">${item.lineTotal.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notes and Terms */}
              {(invoice.notes || invoice.terms) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {invoice.notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                        <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                      </div>
                    )}

                    {invoice.terms && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                        <p className="text-gray-600 whitespace-pre-wrap">{invoice.terms}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Invoice Summary Sidebar */}
            <div className="space-y-6">

              {/* Invoice Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Invoice Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
                  </div>

                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-red-600">-${invoice.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-lg font-bold">${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {invoice.paidAmount > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Paid:</span>
                        <span className="font-medium text-green-600">${invoice.paidAmount.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Outstanding:</span>
                        <span className="font-medium text-red-600">
                          ${(invoice.totalAmount - invoice.paidAmount).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Invoice Status:</span>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      {getPaymentStatusBadge(invoice.paymentStatus)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Issue Date:</span>
                    <span className="font-medium">
                      {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Due Date:</span>
                    <span className={`font-medium ${
                      invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID'
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}>
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">
                      {invoice.updatedAt ? new Date(invoice.updatedAt).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
