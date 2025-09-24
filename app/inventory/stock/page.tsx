'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Search,
  Filter,
  Package,
  Download,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Warehouse,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  Calendar,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

interface ProductCategory {
  id: string
  name: string
}

interface Warehouse {
  id: string
  name: string
  code: string
  location: string
}

interface StockMovement {
  id: string
  productId: string
  warehouseId: string
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  referenceId?: string
  referenceType?: string
  notes?: string
  createdAt: string
  createdBy: string
  product: {
    id: string
    name: string
    productCode: string
    unit: string
  }
  warehouse: Warehouse
  user: {
    id: string
    email: string
    fullName?: string
  }
}

interface ProductStock {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  reservedQty: number
  minStock?: number
  maxStock?: number
  reorderLevel?: number
  lastMovement?: string
  product: {
    id: string
    name: string
    productCode: string
    unit: string
    category?: ProductCategory
    sellingPrice: number
    costPrice?: number
  }
  warehouse: Warehouse
  lowStock: boolean
  outOfStock: boolean
}

export default function StockTrackingPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'alerts'>('overview')
  const [stocks, setStocks] = useState<ProductStock[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterWarehouse, setFilterWarehouse] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterMovementType, setFilterMovementType] = useState<string>('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showOutOfStock, setShowOutOfStock] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const canManage = hasFullAccess('inventory')
  const canRead = hasModuleAccess('inventory')

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the Inventory module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fetchStocks = useCallback(async (params: {
    query?: string
    warehouse?: string
    category?: string
    lowStock?: boolean
    outOfStock?: boolean
    page?: number
    limit?: number
  } = {}) => {
    try {
      setLoading(true)
      setError('')

      const queryParams = new URLSearchParams()
      if (params.query) queryParams.set('query', params.query)
      if (params.warehouse) queryParams.set('warehouse', params.warehouse)
      if (params.category) queryParams.set('category', params.category)
      if (params.lowStock) queryParams.set('lowStock', 'true')
      if (params.outOfStock) queryParams.set('outOfStock', 'true')
      queryParams.set('page', (params.page || 1).toString())
      queryParams.set('limit', (params.limit || 20).toString())

      const response = await fetch(`/api/inventory/stock?${queryParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch stock data')
      }

      const result = await response.json()

      if (result.success) {
        setStocks(result.data || [])
        setPagination(result.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
      } else {
        throw new Error(result.error || 'Failed to fetch stock data')
      }
    } catch (err) {
      console.error('Error fetching stock data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data')
      setStocks([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMovements = useCallback(async (params: {
    query?: string
    warehouse?: string
    type?: string
    page?: number
    limit?: number
  } = {}) => {
    try {
      const queryParams = new URLSearchParams()
      if (params.query) queryParams.set('query', params.query)
      if (params.warehouse) queryParams.set('warehouse', params.warehouse)
      if (params.type) queryParams.set('type', params.type)
      queryParams.set('page', (params.page || 1).toString())
      queryParams.set('limit', (params.limit || 20).toString())

      const response = await fetch(`/api/inventory/movements?${queryParams}`)

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setMovements(result.data || [])
        }
      }
    } catch (err) {
      console.error('Error fetching movements:', err)
    }
  }, [])

  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory/warehouses')
      if (response.ok) {
        const result = await response.json()
        setWarehouses(result.success ? result.data || [] : [])
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory/categories')
      if (response.ok) {
        const result = await response.json()
        setCategories(result.success ? result.data || [] : [])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchStocks({
      lowStock: showLowStock,
      outOfStock: showOutOfStock,
      page: 1,
      limit: pagination.limit
    })
    fetchMovements({ page: 1, limit: 10 })
    fetchWarehouses()
    fetchCategories()
  }, [fetchStocks, fetchMovements, fetchWarehouses, fetchCategories, showLowStock, showOutOfStock])

  const handleRefresh = () => {
    fetchStocks({
      query: searchTerm,
      warehouse: filterWarehouse,
      category: filterCategory,
      lowStock: showLowStock,
      outOfStock: showOutOfStock,
      page: pagination.page,
      limit: pagination.limit
    })
    fetchMovements({
      query: searchTerm,
      warehouse: filterWarehouse,
      type: filterMovementType,
      page: 1,
      limit: 10
    })
  }

  const getStockBadge = (stock: ProductStock) => {
    if (stock.outOfStock) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (stock.lowStock) {
      return <Badge variant="destructive">Low Stock</Badge>
    }
    if (stock.quantity >= (stock.maxStock || 1000)) {
      return <Badge variant="secondary">Overstock</Badge>
    }
    return <Badge variant="default">In Stock</Badge>
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'OUT':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'TRANSFER':
        return <ArrowUpDown className="w-4 h-4 text-blue-500" />
      case 'ADJUSTMENT':
        return <Edit className="w-4 h-4 text-orange-500" />
      default:
        return <Package className="w-4 h-4 text-gray-500" />
    }
  }

  const getMovementBadge = (type: string) => {
    const variants = {
      IN: 'default',
      OUT: 'destructive',
      TRANSFER: 'secondary',
      ADJUSTMENT: 'outline'
    } as const

    return <Badge variant={variants[type as keyof typeof variants] || 'default'}>{type}</Badge>
  }

  // Calculate summary stats
  const totalProducts = stocks.length
  const lowStockCount = stocks.filter(s => s.lowStock).length
  const outOfStockCount = stocks.filter(s => s.outOfStock).length
  const totalValue = stocks.reduce((sum, stock) => {
    const price = stock.product.costPrice || stock.product.sellingPrice
    return sum + (stock.quantity * price)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Stock Tracking</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canManage && (
                <Link href="/inventory/stock/adjust">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Stock Adjustment
                  </Button>
                </Link>
              )}
              <Link href="/inventory">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Inventory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalProducts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Low Stock</p>
                    <p className="text-2xl font-semibold text-gray-900">{lowStockCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Minus className="w-8 h-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                    <p className="text-2xl font-semibold text-gray-900">{outOfStockCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-2xl font-semibold text-gray-900">${totalValue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              {[
                { key: 'overview', label: 'Stock Overview', icon: Package },
                { key: 'movements', label: 'Stock Movements', icon: ArrowUpDown },
                { key: 'alerts', label: 'Alerts & Reports', icon: AlertTriangle }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="mb-6 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stock Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Warehouses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Warehouses</SelectItem>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant={showLowStock ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowLowStock(!showLowStock)}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Low Stock
                      </Button>

                      <Button
                        variant={showOutOfStock ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowOutOfStock(!showOutOfStock)}
                      >
                        <Minus className="w-4 h-4 mr-2" />
                        Out of Stock
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>Loading stock data...</span>
                    </div>
                  ) : stocks.length === 0 ? (
                    <div className="text-center p-8">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No stock data found</h3>
                      <p className="text-gray-600">No products match your current filters.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Warehouse
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Available
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Reserved
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Reorder Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stocks.map((stock) => (
                            <tr key={stock.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {stock.product.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {stock.product.productCode}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {stock.warehouse.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {stock.warehouse.location}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {stock.quantity} {stock.product.unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {stock.reservedQty} {stock.product.unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {stock.reorderLevel || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStockBadge(stock)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  ${((stock.product.costPrice || stock.product.sellingPrice) * stock.quantity).toFixed(2)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Stock Movements Tab */}
          {activeTab === 'movements' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Stock Movements</CardTitle>
                  <div className="flex gap-2">
                    <Select value={filterMovementType} onValueChange={setFilterMovementType}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="IN">Stock In</SelectItem>
                        <SelectItem value="OUT">Stock Out</SelectItem>
                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                        <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {movements.length === 0 ? (
                  <div className="text-center p-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No movements found</h3>
                    <p className="text-gray-600">No stock movements to display.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {movements.map((movement) => (
                      <div key={movement.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getMovementIcon(movement.type)}
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {movement.product.name}
                                </h4>
                                {getMovementBadge(movement.type)}
                              </div>
                              <p className="text-sm text-gray-600">
                                {movement.product.productCode} • {movement.warehouse.name}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {movement.reason}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {movement.type === 'OUT' ? '-' : '+'}
                              {movement.quantity} {movement.product.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(movement.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Stock: {movement.previousStock} → {movement.newStock}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              {/* Low Stock Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Low Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stocks.filter(s => s.lowStock).length === 0 ? (
                    <p className="text-gray-600">No low stock alerts</p>
                  ) : (
                    <div className="space-y-3">
                      {stocks.filter(s => s.lowStock).map((stock) => (
                        <div key={stock.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{stock.product.name}</h4>
                            <p className="text-sm text-gray-600">
                              {stock.warehouse.name} • {stock.quantity} {stock.product.unit} remaining
                            </p>
                          </div>
                          <Badge variant="destructive">Low Stock</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Out of Stock Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Minus className="w-5 h-5 text-red-500" />
                    Out of Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stocks.filter(s => s.outOfStock).length === 0 ? (
                    <p className="text-gray-600">No out of stock items</p>
                  ) : (
                    <div className="space-y-3">
                      {stocks.filter(s => s.outOfStock).map((stock) => (
                        <div key={stock.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{stock.product.name}</h4>
                            <p className="text-sm text-gray-600">
                              {stock.warehouse.name} • Out of stock
                            </p>
                          </div>
                          <Badge variant="destructive">Out of Stock</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}