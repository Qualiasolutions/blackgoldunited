'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  ArrowLeft,
  DollarSign,
  RefreshCw,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

interface InvoiceClient {
  id: string
  companyName: string
  contactPerson: string
  email: string
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
  clientId: string
  issueDate: string
  dueDate: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
  paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  notes?: string
  terms?: string
  createdAt: string
  updatedAt: string
  client: InvoiceClient
  items: InvoiceItem[]
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout>()
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; invoiceId: string; invoiceNumber: string }>({
    show: false,
    invoiceId: '',
    invoiceNumber: ''
  })
  const [deleting, setDeleting] = useState(false)

  const canManage = hasFullAccess('sales')
  const canRead = hasModuleAccess('sales')

  const fetchInvoices = useCallback(async (params: {
    query?: string
    status?: string
    paymentStatus?: string
    page?: number
    limit?: number
  } = {}) => {
    try {
      setLoading(true)
      setError('')

      // Build query string
      const queryParams = new URLSearchParams()
      if (params.query) queryParams.set('query', params.query)
      if (params.status) queryParams.set('status', params.status)
      if (params.paymentStatus) queryParams.set('paymentStatus', params.paymentStatus)
      if (params.page) queryParams.set('page', params.page.toString())
      if (params.limit) queryParams.set('limit', params.limit.toString())
      queryParams.set('sortBy', 'createdAt')
      queryParams.set('sortOrder', 'desc')

      const response = await fetch(`/api/sales/invoices?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view invoices')
        } else if (response.status === 403) {
          throw new Error('You don\'t have permission to view invoices')
        } else {
          throw new Error(result.error || 'Failed to fetch invoices')
        }
      }

      if (result.success) {
        setInvoices(result.data || [])
        setPagination(result.pagination)
      } else {
        throw new Error(result.error || 'Failed to fetch invoices')
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    if (canRead) {
      fetchInvoices()
    }
  }, [canRead, fetchInvoices])

  // Debounced search
  useEffect(() => {
    if (!canRead) return

    if (searchDebounce) {
      clearTimeout(searchDebounce)
    }

    const timeout = setTimeout(() => {
      fetchInvoices({
        query: searchTerm || undefined,
        status: filterStatus || undefined,
        paymentStatus: filterPaymentStatus || undefined,
        page: 1,
        limit: pagination.limit
      })
    }, 300)

    setSearchDebounce(timeout)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [searchTerm, filterStatus, filterPaymentStatus, pagination.limit, fetchInvoices, canRead])

  const handleRefresh = () => {
    fetchInvoices({
      query: searchTerm || undefined,
      status: filterStatus || undefined,
      paymentStatus: filterPaymentStatus || undefined,
      page: pagination.page,
      limit: pagination.limit
    })
  }

  const handleDeleteClick = (invoiceId: string, invoiceNumber: string) => {
    setDeleteConfirm({
      show: true,
      invoiceId,
      invoiceNumber
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true)
      setError('')

      const response = await fetch(`/api/sales/invoices/${deleteConfirm.invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete invoice')
      }

      // Close confirmation modal
      setDeleteConfirm({ show: false, invoiceId: '', invoiceNumber: '' })

      // Refresh the list
      fetchInvoices({
        query: searchTerm || undefined,
        status: filterStatus || undefined,
        paymentStatus: filterPaymentStatus || undefined,
        page: pagination.page,
        limit: pagination.limit
      })
    } catch (error) {
      console.error('Error deleting invoice:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete invoice')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, invoiceId: '', invoiceNumber: '' })
  }

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
      <Badge className={`${config.color} text-xs flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const paidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE').length
  const outstandingAmount = totalAmount - paidAmount

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access invoices.</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button variant="outline">← Back to Dashboard</Button>
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
              <Link href="/sales">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Sales
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                <p className="text-sm text-gray-600">Manage customer invoices and payments</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {canManage ? 'Full Access' : 'Read Only'}
              </Badge>
              {canManage && (
                <Link href="/sales/invoices/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Invoice
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

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Total Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{(pagination.total ?? 0).toLocaleString()}</div>
                <p className="text-xs text-green-600">All time invoices</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">${(outstandingAmount ?? 0).toLocaleString()}</div>
                <p className="text-xs text-blue-600">Unpaid amount</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-emerald-800 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Paid Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900">${(paidAmount ?? 0).toLocaleString()}</div>
                <p className="text-xs text-emerald-600">Collected payments</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-800 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">{overdueInvoices}</div>
                <p className="text-xs text-red-600">Requires attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search invoices by number, client name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>

                  <select
                    value={filterPaymentStatus}
                    onChange={(e) => setFilterPaymentStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Payments</option>
                    <option value="PENDING">Pending</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error:</span>
                  <span>{error}</span>
                  <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoices</CardTitle>
                <div className="text-sm text-gray-500">
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {(pagination.total ?? 0).toLocaleString()}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading invoices...</span>
                  </div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus || filterPaymentStatus
                      ? 'No invoices match your search criteria.'
                      : 'Create your first invoice to get started.'}
                  </p>
                  {canManage && !searchTerm && !filterStatus && !filterPaymentStatus && (
                    <Link href="/sales/invoices/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Invoice
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                            {getStatusBadge(invoice.status)}
                            <Badge variant="outline" className="text-xs">
                              ${(invoice.totalAmount ?? 0).toLocaleString()}
                            </Badge>
                            {invoice.paymentStatus !== 'PENDING' && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  invoice.paymentStatus === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                                  invoice.paymentStatus === 'PARTIAL' ? 'bg-yellow-50 text-yellow-700' :
                                  invoice.paymentStatus === 'FAILED' ? 'bg-red-50 text-red-700' :
                                  'bg-gray-50 text-gray-700'
                                }`}
                              >
                                {invoice.paymentStatus}
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">{invoice.client?.companyName || 'N/A'}</span>
                            <span className="text-gray-500 ml-2">({invoice.client?.contactPerson || 'N/A'})</span>
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due: {new Date(invoice.dueDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              Created: {new Date(invoice.createdAt).toLocaleDateString()}
                            </span>
                            {invoice.paidAmount > 0 && (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid: ${(invoice.paidAmount ?? 0).toLocaleString()}
                              </span>
                            )}
                            <span className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              Items: {invoice.items?.length || 0}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Link href={`/sales/invoices/${invoice.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>

                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>

                          {canManage && (
                            <>
                              <Link href={`/sales/invoices/${invoice.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>

                              {(invoice.status === 'DRAFT' || invoice.status === 'SENT') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteClick(invoice.id, invoice.invoiceNumber)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Confirm Delete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete invoice <strong>{deleteConfirm.invoiceNumber}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone. The invoice will be permanently deleted.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Invoice
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}