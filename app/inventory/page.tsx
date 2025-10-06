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
  DollarSign,
  RefreshCw,
  Loader2,
  Tag,
  Warehouse,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface ProductCategory {
  id: string
  name: string
}

interface ProductStock {
  warehouseId: string
  quantity: number
  reservedQty: number
  warehouse: {
    id: string
    name: string
    code: string
  }
}

interface Product {
  id: string
  productCode: string
  name: string
  description?: string
  type: 'PRODUCT' | 'SERVICE'
  categoryId?: string
  unit: string
  costPrice?: number
  sellingPrice: number
  minStock?: number
  maxStock?: number
  reorderLevel?: number
  isActive: boolean
  isTaxable: boolean
  taxRate: number
  barcode?: string
  sku?: string
  weight?: number
  dimensions?: string
  notes?: string
  createdAt: string
  updatedAt: string
  totalStock: number
  totalReserved: number
  availableStock: number
  lowStock: boolean
  stocks: ProductStock[]
  category?: ProductCategory
}

export default function InventoryPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterActive, setFilterActive] = useState<string>('true')
  const [showLowStock, setShowLowStock] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout>()

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

  // Initial fetch
  useEffect(() => {
    const fetchProducts = async (params: {
      query?: string
      category?: string
      type?: string
      isActive?: string
      lowStock?: boolean
      page?: number
      limit?: number
    } = {}) => {
      try {
        setLoading(true)
        setError('')

        // Build query string
        const queryParams = new URLSearchParams()
        if (params.query) queryParams.set('query', params.query)
        if (params.category) queryParams.set('category', params.category)
        if (params.type) queryParams.set('type', params.type)
        if (params.isActive) queryParams.set('isActive', params.isActive)
        if (params.lowStock) queryParams.set('lowStock', 'true')
        queryParams.set('page', (params.page || 1).toString())
        queryParams.set('limit', (params.limit || 10).toString())

        const response = await fetch(`/api/inventory/products?${queryParams}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch products')
        }

        const result = await response.json()

        if (result.success) {
          setProducts(result.data || [])
          setPagination(result.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
        } else {
          throw new Error(result.error || 'Failed to fetch products')
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/inventory/categories')
        if (response.ok) {
          const result = await response.json()
          setCategories(result.success ? result.data || [] : [])
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }

    fetchProducts({
      page: 1,
      limit: pagination.limit,
      isActive: filterActive,
      lowStock: showLowStock
    })
    fetchCategories()
  }, [filterActive, showLowStock, pagination.limit])

  // Search with debounce
  useEffect(() => {
    if (searchDebounce) clearTimeout(searchDebounce)

    const timeout = setTimeout(async () => {
      try {
        setLoading(true)
        setError('')

        const queryParams = new URLSearchParams()
        if (searchTerm) queryParams.set('query', searchTerm)
        if (filterCategory) queryParams.set('category', filterCategory)
        if (filterType) queryParams.set('type', filterType)
        if (filterActive) queryParams.set('isActive', filterActive)
        if (showLowStock) queryParams.set('lowStock', 'true')
        queryParams.set('page', '1')
        queryParams.set('limit', pagination.limit.toString())

        const response = await fetch(`/api/inventory/products?${queryParams}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch products')
        }

        const result = await response.json()

        if (result.success) {
          setProducts(result.data || [])
          setPagination(result.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
        } else {
          throw new Error(result.error || 'Failed to fetch products')
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }, 500)

    setSearchDebounce(timeout)

    return () => clearTimeout(timeout)
  }, [searchTerm, filterCategory, filterType, pagination.limit])

  const handlePageChange = async (newPage: number) => {
    try {
      setLoading(true)
      setError('')

      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.set('query', searchTerm)
      if (filterCategory) queryParams.set('category', filterCategory)
      if (filterType) queryParams.set('type', filterType)
      if (filterActive) queryParams.set('isActive', filterActive)
      if (showLowStock) queryParams.set('lowStock', 'true')
      queryParams.set('page', newPage.toString())
      queryParams.set('limit', pagination.limit.toString())

      const response = await fetch(`/api/inventory/products?${queryParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch products')
      }

      const result = await response.json()

      if (result.success) {
        setProducts(result.data || [])
        setPagination(result.pagination || { page: newPage, limit: pagination.limit, total: 0, pages: 0 })
      } else {
        throw new Error(result.error || 'Failed to fetch products')
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      setError('')

      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.set('query', searchTerm)
      if (filterCategory) queryParams.set('category', filterCategory)
      if (filterType) queryParams.set('type', filterType)
      if (filterActive) queryParams.set('isActive', filterActive)
      if (showLowStock) queryParams.set('lowStock', 'true')
      queryParams.set('page', pagination.page.toString())
      queryParams.set('limit', pagination.limit.toString())

      const response = await fetch(`/api/inventory/products?${queryParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch products')
      }

      const result = await response.json()

      if (result.success) {
        setProducts(result.data || [])
        setPagination(result.pagination || pagination)
      } else {
        throw new Error(result.error || 'Failed to fetch products')
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (product: Product) => {
    if (!product.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (product.lowStock) {
      return <Badge variant="destructive">Low Stock</Badge>
    }
    if (product.availableStock <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    return <Badge variant="default">In Stock</Badge>
  }

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'PRODUCT' ? 'default' : 'secondary'}>
        {type}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Link href="/inventory/stock">
                  <Button variant="outline">
                    <Warehouse className="w-4 h-4 mr-2" />
                    Stock Tracking
                  </Button>
                </Link>
                <Link href="/inventory/warehouses">
                  <Button variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Warehouses
                  </Button>
                </Link>
                {canManage && (
                  <Link href="/inventory/products/create">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </Link>
                )}
              </div>
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products by name, code, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="PRODUCT">Product</SelectItem>
                      <SelectItem value="SERVICE">Service</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterActive} onValueChange={setFilterActive}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showLowStock ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowLowStock(!showLowStock)}
                    className="whitespace-nowrap"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Low Stock Only
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

          {/* Products Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Products</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Showing {products.length} of {pagination.total} products
                  </p>
                </div>
                {canManage && (
                  <Button asChild>
                    <Link href="/inventory/products/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading products...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center p-8">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterCategory || filterType || showLowStock
                      ? 'No products match your current filters. Try adjusting your search criteria.'
                      : 'Get started by creating your first product.'}
                  </p>
                  {canManage && (
                    <Button asChild>
                      <Link href="/inventory/products/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.productCode}
                              </div>
                              {product.description && (
                                <div className="text-sm text-gray-400 truncate max-w-xs">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.category?.name || 'Uncategorized'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getTypeBadge(product.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">
                                {product.availableStock} {product.unit}
                              </div>
                              <div className="text-xs text-gray-500">
                                Total: {product.totalStock}
                                {product.totalReserved > 0 && ` (${product.totalReserved} reserved)`}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">
                                ${product.sellingPrice.toFixed(2)}
                              </div>
                              {product.costPrice && (
                                <div className="text-xs text-gray-500">
                                  Cost: ${product.costPrice.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(product)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/inventory/products/${product.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              {canManage && (
                                <>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/inventory/products/${product.id}/edit`}>
                                      <Edit className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!loading && products.length > 0 && pagination.pages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}