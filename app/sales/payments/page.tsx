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
  DollarSign,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  ArrowLeft,
  Download,
  FileText,
  TrendingUp,
  Banknote
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Payment {
  id: string
  paymentNumber: string
  invoiceId: string
  invoiceNumber: string
  clientId: string
  clientName: string
  amount: number
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD' | 'OTHER'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  paymentDate: string
  reference: string
  notes: string
  createdAt: string
  updatedAt: string
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterMethod, setFilterMethod] = useState<string>('')

  const canCreate = hasFullAccess('sales')
  const canRead = hasModuleAccess('sales')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('invoice_payments')
        .select(`
          id,
          invoiceId,
          amount,
          paymentMethod,
          status,
          paymentDate,
          reference,
          notes,
          createdAt,
          updatedAt,
          invoices:invoiceId (
            invoiceNumber,
            clientId,
            clients:clientId (
              companyName
            )
          )
        `)
        .eq('deletedAt', null)
        .order('createdAt', { ascending: false })

      if (error) throw error

      const formattedPayments = (data || []).map(item => ({
        id: item.id,
        paymentNumber: `PAY-${item.id.slice(-6)}`,
        invoiceId: item.invoiceId,
        invoiceNumber: item.invoices?.invoiceNumber || 'Unknown',
        clientId: item.invoices?.clientId || '',
        clientName: item.invoices?.clients?.companyName || 'Unknown Client',
        amount: Number(item.amount) || 0,
        paymentMethod: item.paymentMethod || 'OTHER',
        status: item.status || 'PENDING',
        paymentDate: item.paymentDate || '',
        reference: item.reference || '',
        notes: item.notes || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))

      setPayments(formattedPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      COMPLETED: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      FAILED: { color: 'bg-red-100 text-red-700', icon: XCircle },
      REFUNDED: { color: 'bg-orange-100 text-orange-700', icon: CreditCard }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const IconComponent = config.icon

    return (
      <Badge className={`${config.color} text-xs flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      CASH: { color: 'bg-green-100 text-green-700', icon: '💵' },
      BANK_TRANSFER: { color: 'bg-blue-100 text-blue-700', icon: '🏦' },
      CHECK: { color: 'bg-purple-100 text-purple-700', icon: '📄' },
      CREDIT_CARD: { color: 'bg-orange-100 text-orange-700', icon: '💳' },
      OTHER: { color: 'bg-gray-100 text-gray-700', icon: '💰' }
    }

    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.OTHER

    return (
      <Badge className={`${config.color} text-xs`}>
        {config.icon} {method.replace('_', ' ')}
      </Badge>
    )
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === '' || payment.status === filterStatus
    const matchesMethod = filterMethod === '' || payment.paymentMethod === filterMethod

    return matchesSearch && matchesStatus && matchesMethod
  })

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const completedAmount = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0)

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <DollarSign className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access Payments.</p>
            <Link href="/sales" className="mt-4 inline-block">
              <Button variant="outline">← Back to Sales</Button>
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
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                <p className="text-sm text-gray-600">Track and reconcile customer payments</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {canCreate ? '🟢 Full Access' : '🟡 Read Only'}
              </Badge>
              {canCreate && (
                <Link href="/sales/payments/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
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
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-emerald-800 flex items-center">
                  <Banknote className="h-4 w-4 mr-2" />
                  Total Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900">{payments.length}</div>
                <p className="text-xs text-emerald-600">${totalAmount.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {payments.filter(p => p.status === 'COMPLETED').length}
                </div>
                <p className="text-xs text-green-600">${completedAmount.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-800 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">
                  {payments.filter(p => p.status === 'PENDING').length}
                </div>
                <p className="text-xs text-yellow-600">${pendingAmount.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {payments.length > 0 ? Math.round((payments.filter(p => p.status === 'COMPLETED').length / payments.length) * 100) : 0}%
                </div>
                <p className="text-xs text-blue-600">Payment success rate</p>
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
                      placeholder="Search payments by number, invoice, client, or reference..."
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
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>

                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Methods</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHECK">Check</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="OTHER">Other</option>
                  </select>

                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          <Card>
            <CardHeader>
              <CardTitle>Payments ({filteredPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-gray-500">Loading payments...</div>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus || filterMethod ? 'No payments match your search criteria.' : 'Start by recording your first payment.'}
                  </p>
                  {canCreate && !searchTerm && !filterStatus && !filterMethod && (
                    <Link href="/sales/payments/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Record First Payment
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{payment.paymentNumber}</h3>
                            {getStatusBadge(payment.status)}
                            {getPaymentMethodBadge(payment.paymentMethod)}
                            <div className="text-lg font-bold text-green-600">
                              ${payment.amount.toLocaleString()}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                            <div>
                              <strong>Invoice:</strong> {payment.invoiceNumber}
                            </div>
                            <div>
                              <strong>Client:</strong> {payment.clientName}
                            </div>
                            {payment.reference && (
                              <div>
                                <strong>Reference:</strong> {payment.reference}
                              </div>
                            )}
                          </div>

                          {payment.notes && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Notes:</strong> {payment.notes}
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Recorded: {new Date(payment.createdAt).toLocaleDateString()}</span>
                            {payment.paymentDate && (
                              <span>Payment Date: {new Date(payment.paymentDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Link href={`/sales/payments/${payment.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>

                          {canCreate && (
                            <>
                              <Link href={`/sales/payments/${payment.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>

                              <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                                <Download className="h-4 w-4 mr-1" />
                                Receipt
                              </Button>
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
    </div>
  )
}