'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, RefreshCw, FileText, TrendingDown, DollarSign, Calendar, Filter, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PurchaseRefundsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()

  if (!user) {
    return null
  }

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
                  <p className="text-2xl font-bold text-gray-900">28</p>
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
                  <p className="text-2xl font-bold text-gray-900">5</p>
                  <p className="text-xs text-gray-500">$12,400</p>
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
                  <p className="text-2xl font-bold text-gray-900">$45.2K</p>
                  <p className="text-xs text-gray-500">This Year</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Processing</p>
                  <p className="text-2xl font-bold text-gray-900">7</p>
                  <p className="text-xs text-gray-500">Days</p>
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
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Status</option>
                  <option>Requested</option>
                  <option>Approved</option>
                  <option>Processing</option>
                  <option>Completed</option>
                  <option>Rejected</option>
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
                    {/* Sample Data - Replace with real data from Supabase */}
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <ArrowLeft className="h-4 w-4 text-orange-600 mr-2" />
                          REF-2025-003
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          INV-2025-0018
                        </div>
                      </td>
                      <td className="py-3 px-4">ABC Supplies Co</td>
                      <td className="py-3 px-4 font-medium">$2,400.00</td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">Defective Products</span>
                      </td>
                      <td className="py-3 px-4">Jan 18, 2025</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Track</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <ArrowLeft className="h-4 w-4 text-orange-600 mr-2" />
                          REF-2025-002
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          INV-2025-0015
                        </div>
                      </td>
                      <td className="py-3 px-4">Tech Equipment Ltd</td>
                      <td className="py-3 px-4 font-medium">$1,800.00</td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">Wrong Specification</span>
                      </td>
                      <td className="py-3 px-4">Jan 15, 2025</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Receipt</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <ArrowLeft className="h-4 w-4 text-orange-600 mr-2" />
                          REF-2025-001
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          INV-2025-0012
                        </div>
                      </td>
                      <td className="py-3 px-4">Office Pro Supplies</td>
                      <td className="py-3 px-4 font-medium">$650.00</td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">Partial Delivery</span>
                      </td>
                      <td className="py-3 px-4">Jan 10, 2025</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Appeal</Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empty State for when no data */}
              <div className="text-center py-12 hidden">
                <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No refund requests found</p>
                <p className="text-gray-400 mt-2">Request your first supplier refund to get started</p>
                {hasFullAccess('purchase') && (
                  <Link href="/purchases/refunds/create" className="mt-4 inline-block">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Request First Refund
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </EnhancedCard>
        </div>
      </div>
    </MainLayout>
  )
}