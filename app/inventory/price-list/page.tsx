'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, Edit, Filter, Download, Package } from 'lucide-react'
import Link from 'next/link'

export default function InventoryPriceListPage() {
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
                <h1 className="text-3xl font-bold text-gray-900">Price Lists</h1>
                <p className="text-gray-600 mt-2">Manage product and service pricing across different customer groups</p>
              </div>
              {hasFullAccess('inventory') && (
                <div className="flex space-x-3">
                  <Button variant="outline" className="border-orange-300 text-orange-600">
                    <Edit className="h-4 w-4 mr-2" />
                    Bulk Update
                  </Button>
                  <Link href="/inventory/price-list/create">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Price List
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Price Lists</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">247</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Price Increases</p>
                  <p className="text-2xl font-bold text-gray-900">18</p>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Price Decreases</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <TrendingDown className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Search and Filter Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-orange-600" />
                <Input
                  placeholder="Search products, SKU, or descriptions..."
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Price Lists</option>
                  <option>Standard Pricing</option>
                  <option>Premium Customers</option>
                  <option>Wholesale</option>
                  <option>Retail</option>
                </select>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Categories</option>
                  <option>Electronics</option>
                  <option>Office Supplies</option>
                  <option>Services</option>
                  <option>Software</option>
                </select>
              </div>
            </EnhancedCard>
          </div>

          {/* Price Lists Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-green-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Standard Pricing</h3>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Products:</span>
                  <span className="text-sm font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <span className="text-sm font-medium">Jan 15, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Currency:</span>
                  <span className="text-sm font-medium">USD</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">View</Button>
                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-blue-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Premium Customers</h3>
                <Badge className="bg-blue-100 text-blue-800">Active</Badge>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Products:</span>
                  <span className="text-sm font-medium">89</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Discount:</span>
                  <span className="text-sm font-medium text-green-600">15%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Currency:</span>
                  <span className="text-sm font-medium">USD</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">View</Button>
                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-purple-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Wholesale</h3>
                <Badge className="bg-purple-100 text-purple-800">Active</Badge>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Products:</span>
                  <span className="text-sm font-medium">203</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Discount:</span>
                  <span className="text-sm font-medium text-green-600">25%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Min. Quantity:</span>
                  <span className="text-sm font-medium">100</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">View</Button>
                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
              </div>
            </EnhancedCard>
          </div>

          {/* Products Pricing Table */}
          <EnhancedCard className="bg-white border-2 border-orange-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Product Pricing (Standard List)</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                    <Edit className="h-4 w-4 mr-2" />
                    Bulk Edit
                  </Button>
                </div>
              </div>

              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Cost Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Selling Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Margin</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sample Data - Replace with real data from Supabase */}
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-lg mr-3"></div>
                          <div>
                            <p className="font-medium text-gray-900">Dell Laptop XPS 15</p>
                            <p className="text-sm text-gray-500">High-performance laptop</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">DL-XPS15-001</td>
                      <td className="py-3 px-4">Electronics</td>
                      <td className="py-3 px-4 font-medium">$1,200.00</td>
                      <td className="py-3 px-4 font-medium text-green-600">$1,599.00</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">33.3%</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">History</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-lg mr-3"></div>
                          <div>
                            <p className="font-medium text-gray-900">Office Chair Pro</p>
                            <p className="text-sm text-gray-500">Ergonomic office chair</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">OC-PRO-001</td>
                      <td className="py-3 px-4">Office Supplies</td>
                      <td className="py-3 px-4 font-medium">$200.00</td>
                      <td className="py-3 px-4 font-medium text-green-600">$299.00</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">49.5%</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">History</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-lg mr-3"></div>
                          <div>
                            <p className="font-medium text-gray-900">Software License - MS Office</p>
                            <p className="text-sm text-gray-500">Annual license</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">SW-MSO-001</td>
                      <td className="py-3 px-4">Software</td>
                      <td className="py-3 px-4 font-medium">$150.00</td>
                      <td className="py-3 px-4 font-medium text-green-600">$199.00</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-orange-100 text-orange-800">32.7%</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">History</Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empty State for when no data */}
              <div className="text-center py-12 hidden">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No pricing data found</p>
                <p className="text-gray-400 mt-2">Create your first price list to get started</p>
                {hasFullAccess('inventory') && (
                  <Link href="/inventory/price-list/create" className="mt-4 inline-block">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Price List
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