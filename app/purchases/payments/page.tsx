'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, CreditCard, Calendar, CheckCircle, Clock, AlertCircle, Filter, Download, Eye, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function PurchasePaymentsPage() {
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
                  <p className="text-2xl font-bold text-gray-900">156</p>
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
                  <p className="text-2xl font-bold text-gray-900">12</p>
                  <p className="text-xs text-gray-500">$34,200</p>
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
                  <p className="text-2xl font-bold text-gray-900">$142K</p>
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
                  <p className="text-2xl font-bold text-gray-900">3</p>
                  <p className="text-xs text-gray-500">$7,150</p>
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
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Processing</option>
                  <option>Completed</option>
                  <option>Failed</option>
                  <option>Cancelled</option>
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
                    {/* Sample Data - Replace with real data from Supabase */}
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 text-orange-600 mr-2" />
                          PAY-2025-045
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">ABC Supplies Co</p>
                          <p className="text-sm text-gray-500">Office Equipment</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">INV-2025-0021</td>
                      <td className="py-3 px-4 font-medium">$8,450.00</td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">Bank Transfer</span>
                      </td>
                      <td className="py-3 px-4">Jan 20, 2025</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
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
                          <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                          PAY-2025-044
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">Tech Equipment Ltd</p>
                          <p className="text-sm text-gray-500">IT Hardware</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">INV-2025-0020</td>
                      <td className="py-3 px-4 font-medium">$12,750.00</td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">Wire Transfer</span>
                      </td>
                      <td className="py-3 px-4">Jan 22, 2025</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">Track</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                          PAY-2024-398
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">Office Pro Supplies</p>
                          <p className="text-sm text-gray-500">Stationery</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">INV-2024-1567</td>
                      <td className="py-3 px-4 font-medium">$3,200.00</td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">Check</span>
                      </td>
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
                          <Button variant="outline" size="sm" className="border-red-300 text-red-600">Pay Now</Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empty State for when no data */}
              <div className="text-center py-12 hidden">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No payments found</p>
                <p className="text-gray-400 mt-2">Make your first supplier payment to get started</p>
                {hasFullAccess('purchase') && (
                  <Link href="/purchases/payments/create" className="mt-4 inline-block">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Make First Payment
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