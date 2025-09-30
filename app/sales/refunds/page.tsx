'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, Download, Filter, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

export default function RefundReceiptsPage() {
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
      const response = await fetch('/api/sales/refunds')
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
    const matchesSearch = refund.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         refund.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || refund.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <MainLayout user={{ name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role }}>
      <div className="bg-gradient-to-br from-white via-orange-50 to-white min-h-full">
        <div className="py-8 px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Refund Receipts</h1>
                <p className="text-gray-600 mt-2">Manage and track all customer refund receipts</p>
              </div>
              {hasFullAccess('sales') && (
                <Link href="/sales/refunds/create">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Refund Receipt
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-orange-600" />
                <Input
                  placeholder="Search refund receipts..."
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
                  <option value="">All Refunds</option>
                  <option value="ISSUED">Processed</option>
                  <option value="DRAFT">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total Refunds</span>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <Badge className="bg-orange-100 text-orange-800">{refunds.length}</Badge>
                )}
              </div>
            </EnhancedCard>
          </div>

          {/* Refunds Table */}
          <EnhancedCard className="bg-white border-2 border-orange-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Refund Receipts</h2>
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Receipt #</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                          <p className="text-gray-500 mt-2">Loading refund receipts...</p>
                        </td>
                      </tr>
                    ) : filteredRefunds.length > 0 ? (
                      filteredRefunds.map((refund) => (
                        <tr key={refund.id} className="border-b border-gray-100 hover:bg-orange-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 text-orange-600 mr-2" />
                              {refund.receiptNumber}
                            </div>
                          </td>
                          <td className="py-3 px-4">{refund.clientName}</td>
                          <td className="py-3 px-4 font-medium">{formatCurrency(refund.amount)}</td>
                          <td className="py-3 px-4">{refund.date}</td>
                          <td className="py-3 px-4">
                            <Badge className={
                              refund.status === 'ISSUED' ? 'bg-green-100 text-green-800' :
                              refund.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {refund.status === 'ISSUED' ? 'Processed' : refund.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">View</Button>
                              <Button variant="outline" size="sm">Print</Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No refund receipts found</p>
                          <p className="text-gray-400 mt-2">
                            {searchTerm || filterStatus ? 'Try adjusting your filters' : 'Create your first refund receipt to get started'}
                          </p>
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