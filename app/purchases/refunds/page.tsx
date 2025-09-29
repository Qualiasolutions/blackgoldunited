'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, RefreshCw, FileText, TrendingDown, DollarSign, Calendar, Filter, Download, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function PurchaseRefundsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()
  const [refunds, setRefunds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  useEffect(() => {
    fetchRefunds()
  }, [])

  const fetchRefunds = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/purchases/refunds')
      if (response.ok) {
        const result = await response.json()
        setRefunds(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching refunds:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = refund.refundNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         refund.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || refund.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalRefunds = refunds.length
  const pendingCount = refunds.filter(r => r.status === 'PENDING' || r.status === 'REQUESTED').length
  const pendingAmount = refunds.filter(r => r.status === 'PENDING' || r.status === 'REQUESTED').reduce((sum, r) => sum + (r.amount || 0), 0)
  const totalAmount = refunds.reduce((sum, r) => sum + (r.amount || 0), 0)

  return (
    <MainLayout user={{ name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role }}>
      <div className="bg-gradient-to-br from-white via-orange-50 to-white min-h-full">
        <div className="py-8 px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Purchase Refunds</h1>
                <p className="text-gray-600 mt-2">Manage supplier refunds and return processing</p>
              </div>
              {hasFullAccess('purchase') && (
                <Link href="/purchases/refunds/create">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Request Refund
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
                  <p className="text-sm font-medium text-gray-600">Total Refunds</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{totalRefunds}</p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <RefreshCw className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Refunds</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                      <p className="text-xs text-gray-500">${(pendingAmount / 1000).toFixed(1)}K</p>
                    </>
                  )}
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Refunded Amount</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">${(totalAmount / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-gray-500">This Year</p>
                    </>
                  )}
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{refunds.filter(r => r.status === 'COMPLETED').length}</p>
                      <p className="text-xs text-gray-500">Approved</p>
                    </>
                  )}
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <TrendingDown className="h-6 w-6 text-purple-600" />
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
                  placeholder="Search refunds, suppliers..."
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
                  <option value="REQUESTED">Requested</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Periods</option>
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Quarter</option>
                  <option>This Year</option>
                </select>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Suppliers</option>
                  <option>ABC Supplies Co</option>
                  <option>Tech Equipment Ltd</option>
                  <option>Office Pro Supplies</option>
                </select>
              </div>
            </EnhancedCard>
          </div>

          {/* Refunds Table */}
          <EnhancedCard className="bg-white border-2 border-orange-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Purchase Refunds</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Refund #</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Original Invoice</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Supplier</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Refund Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date Requested</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
                          <p className="text-gray-500">Loading refunds...</p>
                        </td>
                      </tr>
                    ) : filteredRefunds.length > 0 ? (
                      filteredRefunds.map((refund) => (
                        <tr key={refund.id} className="border-b border-gray-100 hover:bg-orange-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <ArrowLeft className="h-4 w-4 text-orange-600 mr-2" />
                              {refund.refundNumber}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 text-gray-400 mr-2" />
                              {refund.originalInvoice || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4">{refund.supplierName}</td>
                          <td className="py-3 px-4 font-medium">${refund.amount?.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">{refund.reason || 'N/A'}</span>
                          </td>
                          <td className="py-3 px-4">{new Date(refund.dateRequested).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="py-3 px-4">
                            <Badge className={
                              refund.status === 'COMPLETED' || refund.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              refund.status === 'PROCESSING' || refund.status === 'REQUESTED' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {refund.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">View</Button>
                              <Button variant="outline" size="sm">Track</Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No refund requests found</p>
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