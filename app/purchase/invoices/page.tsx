'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, Calendar, CheckCircle, Clock, AlertCircle, Filter, Download, Eye } from 'lucide-react'
import Link from 'next/link'

export default function PurchaseInvoicesPage() {
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
                <h1 className="text-3xl font-bold text-gray-900">Purchase Invoices</h1>
                <p className="text-gray-600 mt-2">Manage supplier invoices and payment processing</p>
              </div>
              {hasFullAccess('purchase') && (
                <Link href="/purchase/invoices/create">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Invoice
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
                  <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">245</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                  <p className="text-2xl font-bold text-gray-900">18</p>
                  <p className="text-xs text-gray-500">$45,200</p>
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
                  <p className="text-2xl font-bold text-gray-900">$127K</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                  <p className="text-xs text-gray-500">$8,750</p>
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
                  placeholder="Search invoices, suppliers..."
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Status</option>
                  <option>Draft</option>
                  <option>Pending Payment</option>
                  <option>Paid</option>
                  <option>Overdue</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Dates</option>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Quarter</option>
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
                  <option>Industrial Parts Inc</option>
                </select>
              </div>
            </EnhancedCard>
          </div>

          {/* Recent Activity Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-red-50 border-2 border-red-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-900">Overdue Invoices</h3>
                <Badge className="bg-red-100 text-red-800">5 Items</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">INV-2024-1567</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-800">$3,200</p>
                    <p className="text-xs text-red-600">15 days overdue</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">INV-2024-1523</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-800">$1,850</p>
                    <p className="text-xs text-red-600">8 days overdue</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 border-red-300 text-red-600">
                View All Overdue
              </Button>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-yellow-50 border-2 border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-yellow-900">Due This Week</h3>
                <Badge className="bg-yellow-100 text-yellow-800">12 Items</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-700">INV-2025-0018</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-800">$5,400</p>
                    <p className="text-xs text-yellow-600">Due Jan 25</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-700">INV-2025-0019</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-800">$2,150</p>
                    <p className="text-xs text-yellow-600">Due Jan 27</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 border-yellow-300 text-yellow-600">
                View Due This Week
              </Button>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-green-50 border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-900">Recently Paid</h3>
                <Badge className="bg-green-100 text-green-800">8 Items</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">INV-2025-0015</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-800">$4,200</p>
                    <p className="text-xs text-green-600">Paid Jan 20</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">INV-2025-0014</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-800">$1,950</p>
                    <p className="text-xs text-green-600">Paid Jan 19</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 border-green-300 text-green-600">
                View Recent Payments
              </Button>
            </EnhancedCard>
          </div>

          {/* Purchase Invoices Table */}
          <EnhancedCard className="bg-white border-2 border-orange-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Purchase Invoices</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filter
                  </Button>
                </div>
              </div>

              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice #</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Supplier</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sample Data - Replace with real data from Supabase */}
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-orange-600 mr-2" />
                          INV-2025-0021
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">ABC Supplies Co</p>
                          <p className="text-sm text-gray-500">Office Equipment</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">$8,450.00</td>
                      <td className="py-3 px-4">Jan 15, 2025</td>
                      <td className="py-3 px-4">Feb 14, 2025</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-yellow-100 text-yellow-800">Pending Payment</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">Pay</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-orange-600 mr-2" />
                          INV-2025-0020
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">Tech Equipment Ltd</p>
                          <p className="text-sm text-gray-500">IT Hardware</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">$12,750.00</td>
                      <td className="py-3 px-4">Jan 12, 2025</td>
                      <td className="py-3 px-4">Feb 11, 2025</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Paid</Badge>
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
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                          INV-2024-1567
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">Office Pro Supplies</p>
                          <p className="text-sm text-gray-500">Stationery</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">$3,200.00</td>
                      <td className="py-3 px-4">Dec 15, 2024</td>
                      <td className="py-3 px-4 text-red-600">Jan 14, 2025</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="border-red-300 text-red-600">Urgent Pay</Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empty State for when no data */}
              <div className="text-center py-12 hidden">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No purchase invoices found</p>
                <p className="text-gray-400 mt-2">Record your first supplier invoice to get started</p>
                {hasFullAccess('purchase') && (
                  <Link href="/purchase/invoices/create" className="mt-4 inline-block">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Record First Invoice
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