'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, CreditCard, Calendar, CheckCircle, Clock, AlertCircle, Filter, Download, Eye, DollarSign, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function PurchasePaymentsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/purchases/payments')
      if (response.ok) {
        const result = await response.json()
        setPayments(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || payment.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalPayments = payments.length
  const pendingPayments = payments.filter(p => p.status === 'PENDING').length
  const pendingAmount = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + (p.amount || 0), 0)
  const paidThisMonth = payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.amount || 0), 0)
  const overduePayments = payments.filter(p => p.status === 'OVERDUE').length
  const overdueAmount = payments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <MainLayout user={{ name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role }}>
      <div className="bg-gradient-to-br from-white via-orange-50 to-white min-h-full">
        <div className="py-8 px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Supplier Payments</h1>
                <p className="text-gray-600 mt-2">Manage payments to suppliers and track payment schedules</p>
              </div>
              {hasFullAccess('purchase') && (
                <Link href="/purchases/payments/create">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Make Payment
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{totalPayments}</p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{pendingPayments}</p>
                      <p className="text-xs text-gray-500">${(pendingAmount / 1000).toFixed(1)}K</p>
                    </>
                  )}
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid This Month</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">${(paidThisMonth / 1000).toFixed(0)}K</p>
                  )}
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue Payments</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{overduePayments}</p>
                      <p className="text-xs text-gray-500">${(overdueAmount / 1000).toFixed(1)}K</p>
                    </>
                  )}
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Search and Filter Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-orange-600" />
                <Input
                  placeholder="Search payments, suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-orange-600" />
                <select
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Periods</option>
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Quarter</option>
                </select>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Methods</option>
                  <option>Bank Transfer</option>
                  <option>Check</option>
                  <option>Credit Card</option>
                  <option>Wire Transfer</option>
                </select>
              </div>
            </EnhancedCard>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-yellow-50 border-2 border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-yellow-900">Due This Week</h3>
                <Badge className="bg-yellow-100 text-yellow-800">5 Payments</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-700">ABC Supplies Co</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-800">$8,400</p>
                    <p className="text-xs text-yellow-600">Due Jan 25</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-700">Tech Equipment Ltd</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-800">$12,750</p>
                    <p className="text-xs text-yellow-600">Due Jan 27</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 border-yellow-300 text-yellow-600">
                View All Due
              </Button>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-red-50 border-2 border-red-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-900">Overdue Payments</h3>
                <Badge className="bg-red-100 text-red-800">3 Payments</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Office Pro Supplies</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-800">$3,200</p>
                    <p className="text-xs text-red-600">5 days overdue</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Industrial Parts Inc</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-800">$1,950</p>
                    <p className="text-xs text-red-600">2 days overdue</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 border-red-300 text-red-600">
                Pay Overdue
              </Button>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-green-50 border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-900">Recent Payments</h3>
                <Badge className="bg-green-100 text-green-800">8 Payments</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">ABC Supplies Co</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-800">$5,600</p>
                    <p className="text-xs text-green-600">Paid Jan 20</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Tech Equipment Ltd</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-800">$9,200</p>
                    <p className="text-xs text-green-600">Paid Jan 19</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 border-green-300 text-green-600">
                View Recent
              </Button>
            </EnhancedCard>
          </div>

          {/* Payments Table */}
          <EnhancedCard className="bg-white border-2 border-orange-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                    Batch Payment
                  </Button>
                </div>
              </div>

              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment #</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Supplier</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
                          <p className="text-gray-500">Loading payments...</p>
                        </td>
                      </tr>
                    ) : filteredPayments.length > 0 ? (
                      filteredPayments.map((payment) => (
                        <tr key={payment.id} className="border-b border-gray-100 hover:bg-orange-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <CreditCard className="h-4 w-4 text-orange-600 mr-2" />
                              {payment.paymentNumber}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{payment.supplierName}</p>
                              <p className="text-sm text-gray-500">{payment.category || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">{payment.invoiceNumber || 'N/A'}</td>
                          <td className="py-3 px-4 font-medium">${payment.amount?.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">{payment.paymentMethod || 'N/A'}</span>
                          </td>
                          <td className="py-3 px-4">{new Date(payment.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="py-3 px-4">
                            <Badge className={
                              payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              payment.status === 'PROCESSING' || payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">Receipt</Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No payments found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </EnhancedCard>
        </div>
      </div>
    </MainLayout>
  )
}