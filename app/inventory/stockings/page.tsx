'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Package, TrendingUp, TrendingDown, ArrowUpDown, Filter, Download, AlertTriangle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function InventoryStockingsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAdjustments()
  }, [])

  const fetchAdjustments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory/stock-adjustments')
      if (response.ok) {
        const result = await response.json()
        setAdjustments(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching stock adjustments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const filteredAdjustments = adjustments.filter(adj =>
    adj.adjustmentReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalAdjustments = adjustments.length
  const recentAdjustments = adjustments.filter(a => {
    const date = new Date(a.adjustmentDate)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return date >= weekAgo
  }).length

  return (
    <MainLayout user={{ name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role }}>
      <div className="bg-gradient-to-br from-white via-orange-50 to-white min-h-full">
        <div className="py-8 px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Stock Levels</h1>
                <p className="text-gray-600 mt-2">Monitor inventory levels, track movements, and manage stock alerts</p>
              </div>
              {hasFullAccess('inventory') && (
                <div className="flex space-x-3">
                  <Button variant="outline" className="border-orange-300 text-orange-600">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Stock Transfer
                  </Button>
                  <Link href="/inventory/stockings/adjustment">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Stock Adjustment
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
                  <p className="text-sm font-medium text-gray-600">Total Adjustments</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{totalAdjustments}</p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{recentAdjustments}</p>
                  )}
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Increases</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{adjustments.filter(a => (a.quantityChange || 0) > 0).length}</p>
                  )}
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Decreases</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{adjustments.filter(a => (a.quantityChange || 0) < 0).length}</p>
                  )}
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingDown className="h-6 w-6 text-orange-600" />
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
                  placeholder="Search products, SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Stock Levels</option>
                  <option>Low Stock</option>
                  <option>Out of Stock</option>
                  <option>Overstocked</option>
                  <option>Normal</option>
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
                  <option>Software</option>
                  <option>Services</option>
                </select>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <ArrowUpDown className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Warehouses</option>
                  <option>Main Warehouse</option>
                  <option>West Coast Hub</option>
                  <option>South Distribution</option>
                </select>
              </div>
            </EnhancedCard>
          </div>

          {/* Stock Alert Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-red-50 border-2 border-red-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-900">Critical Stock Alerts</h3>
                <Badge className="bg-red-100 text-red-800">8 Items</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Dell Laptop XPS 15</span>
                  <Badge className="bg-red-200 text-red-800 text-xs">0 units</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Office Chair Pro</span>
                  <Badge className="bg-red-200 text-red-800 text-xs">2 units</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Wireless Mouse</span>
                  <Badge className="bg-red-200 text-red-800 text-xs">1 unit</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 border-red-300 text-red-600">
                View All Critical
              </Button>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-yellow-50 border-2 border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-yellow-900">Low Stock Warnings</h3>
                <Badge className="bg-yellow-100 text-yellow-800">15 Items</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-700">Monitor 24" LED</span>
                  <Badge className="bg-yellow-200 text-yellow-800 text-xs">5 units</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-700">Keyboard Mechanical</span>
                  <Badge className="bg-yellow-200 text-yellow-800 text-xs">8 units</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-700">Printer Paper A4</span>
                  <Badge className="bg-yellow-200 text-yellow-800 text-xs">12 units</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 border-yellow-300 text-yellow-600">
                View All Low Stock
              </Button>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-green-50 border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-900">Recent Restocks</h3>
                <Badge className="bg-green-100 text-green-800">12 Items</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">HP Laser Printer</span>
                  <Badge className="bg-green-200 text-green-800 text-xs">+50 units</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">USB Cable Type-C</span>
                  <Badge className="bg-green-200 text-green-800 text-xs">+100 units</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Desk Lamp LED</span>
                  <Badge className="bg-green-200 text-green-800 text-xs">+25 units</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 border-green-300 text-green-600">
                View All Recent
              </Button>
            </EnhancedCard>
          </div>

          {/* Stock Levels Table */}
          <EnhancedCard className="bg-white border-2 border-orange-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Current Stock Levels</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Bulk Update
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Warehouse</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Stock</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Min Level</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Max Level</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Value</th>
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
                      <td className="py-3 px-4">Main Warehouse</td>
                      <td className="py-3 px-4">
                        <span className="text-lg font-bold text-red-600">0</span>
                      </td>
                      <td className="py-3 px-4">5</td>
                      <td className="py-3 px-4">50</td>
                      <td className="py-3 px-4 font-medium">$0.00</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Restock</Button>
                          <Button variant="outline" size="sm">Adjust</Button>
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
                      <td className="py-3 px-4">Main Warehouse</td>
                      <td className="py-3 px-4">
                        <span className="text-lg font-bold text-yellow-600">8</span>
                      </td>
                      <td className="py-3 px-4">10</td>
                      <td className="py-3 px-4">100</td>
                      <td className="py-3 px-4 font-medium">$2,392.00</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Restock</Button>
                          <Button variant="outline" size="sm">Adjust</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-lg mr-3"></div>
                          <div>
                            <p className="font-medium text-gray-900">Monitor 24" LED</p>
                            <p className="text-sm text-gray-500">Full HD display</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">MON-24-001</td>
                      <td className="py-3 px-4">West Coast Hub</td>
                      <td className="py-3 px-4">
                        <span className="text-lg font-bold text-green-600">45</span>
                      </td>
                      <td className="py-3 px-4">15</td>
                      <td className="py-3 px-4">75</td>
                      <td className="py-3 px-4 font-medium">$8,955.00</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Transfer</Button>
                          <Button variant="outline" size="sm">Adjust</Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empty State for when no data */}
              <div className="text-center py-12 hidden">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No stock data found</p>
                <p className="text-gray-400 mt-2">Add products to your inventory to track stock levels</p>
                {hasFullAccess('inventory') && (
                  <Link href="/inventory/products/create" className="mt-4 inline-block">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Products
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