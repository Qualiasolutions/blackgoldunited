'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  Tag,
  Scale,
  Barcode,
  AlertCircle,
  Loader2,
  Eye,
  Warehouse,
  History,
  ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

interface ProductCategory {
  id: string
  name: string
  description?: string
}

interface ProductStock {
  id: string
  warehouseId: string
  quantity: number
  reservedQty: number
  updatedAt: string
  warehouse: {
    id: string
    name: string
    code: string
    location?: string
  }
}

interface StockMovement {
  id: string
  type: string
  quantity: number
  referencetype?: string
  referenceid?: string
  notes?: string
  createdat: string
  createdby?: {
    full_name: string
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
  stock_movements: StockMovement[]
  category?: ProductCategory
}

export default function ProductViewPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const params = useParams()
  const productId = params?.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const canRead = hasModuleAccess('inventory')
  const canManage = hasFullAccess('inventory')

  const fetchProduct = useCallback(async () => {
    if (!productId) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/inventory/products/${productId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Product not found')
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch product')
      }

      const result = await response.json()

      if (result.success) {
        setProduct(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch product')
      }
    } catch (err) {
      console.error('Error fetching product:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch product')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view products.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading product...</span>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Product Not Found'}
            </h1>
            <p className="text-gray-600 mb-4">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/inventory">Back to Inventory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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

  const formatMovementType = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      'IN': { label: 'Stock In', color: 'text-green-600' },
      'OUT': { label: 'Stock Out', color: 'text-red-600' },
      'TRANSFER': { label: 'Transfer', color: 'text-blue-600' },
      'ADJUSTMENT': { label: 'Adjustment', color: 'text-yellow-600' },
      'RETURN': { label: 'Return', color: 'text-purple-600' }
    }

    return types[type] || { label: type, color: 'text-gray-600' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canManage && (
                <Button asChild>
                  <Link href={`/inventory/products/${product.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Product
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/inventory">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Inventory
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Product Info */}
            <div className="lg:col-span-2 space-y-6">

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{product.name}</CardTitle>
                      <p className="text-gray-500 mt-1">{product.productCode}</p>
                      <div className="flex gap-2 mt-2">
                        {getStatusBadge(product)}
                        {getTypeBadge(product.type)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.description && (
                    <div>
                      <h3 className="font-medium text-gray-900">Description</h3>
                      <p className="text-gray-600 mt-1">{product.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Category</h3>
                      <p className="text-gray-600">
                        {product.category?.name || 'Uncategorized'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Unit</h3>
                      <p className="text-gray-600">{product.unit}</p>
                    </div>
                  </div>

                  {(product.barcode || product.sku) && (
                    <div className="grid grid-cols-2 gap-4">
                      {product.barcode && (
                        <div>
                          <h3 className="font-medium text-gray-900">Barcode</h3>
                          <p className="text-gray-600 font-mono">{product.barcode}</p>
                        </div>
                      )}
                      {product.sku && (
                        <div>
                          <h3 className="font-medium text-gray-900">SKU</h3>
                          <p className="text-gray-600 font-mono">{product.sku}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {(product.weight || product.dimensions) && (
                    <div className="grid grid-cols-2 gap-4">
                      {product.weight && (
                        <div>
                          <h3 className="font-medium text-gray-900">Weight</h3>
                          <p className="text-gray-600">{product.weight}</p>
                        </div>
                      )}
                      {product.dimensions && (
                        <div>
                          <h3 className="font-medium text-gray-900">Dimensions</h3>
                          <p className="text-gray-600">{product.dimensions}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {product.notes && (
                    <div>
                      <h3 className="font-medium text-gray-900">Notes</h3>
                      <p className="text-gray-600 mt-1">{product.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stock Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5" />
                    Stock Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {product.totalStock}
                      </div>
                      <div className="text-sm text-blue-600">Total Stock</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {product.totalReserved}
                      </div>
                      <div className="text-sm text-yellow-600">Reserved</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {product.availableStock}
                      </div>
                      <div className="text-sm text-green-600">Available</div>
                    </div>
                  </div>

                  {product.stocks && product.stocks.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Stock by Warehouse</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Warehouse
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Total Quantity
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Reserved
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Available
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Location
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {product.stocks.map((stock) => (
                              <tr key={stock.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {stock.warehouse.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {stock.warehouse.code}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {stock.quantity} {product.unit}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {stock.reservedQty} {product.unit}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {stock.quantity - stock.reservedQty} {product.unit}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {stock.warehouse.location || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column - Sidebar Info */}
            <div className="space-y-6">

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Selling Price</div>
                    <div className="text-xl font-bold text-gray-900">
                      ${product.sellingPrice.toFixed(2)}
                    </div>
                  </div>

                  {product.costPrice && (
                    <div>
                      <div className="text-sm text-gray-500">Cost Price</div>
                      <div className="text-lg text-gray-900">
                        ${product.costPrice.toFixed(2)}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm text-gray-500">Tax Rate</div>
                    <div className="text-lg text-gray-900">
                      {product.taxRate}%
                      {!product.isTaxable && (
                        <span className="text-sm text-gray-500 ml-1">(Not Taxable)</span>
                      )}
                    </div>
                  </div>

                  {product.costPrice && (
                    <div>
                      <div className="text-sm text-gray-500">Margin</div>
                      <div className="text-lg text-gray-900">
                        ${(product.sellingPrice - product.costPrice).toFixed(2)}
                        <span className="text-sm text-gray-500 ml-1">
                          ({(((product.sellingPrice - product.costPrice) / product.costPrice) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stock Levels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Stock Levels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.minStock && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Minimum Stock:</span>
                      <span className="text-sm text-gray-900">{product.minStock} {product.unit}</span>
                    </div>
                  )}

                  {product.maxStock && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Maximum Stock:</span>
                      <span className="text-sm text-gray-900">{product.maxStock} {product.unit}</span>
                    </div>
                  )}

                  {product.reorderLevel && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Reorder Level:</span>
                      <span className="text-sm text-gray-900">{product.reorderLevel} {product.unit}</span>
                    </div>
                  )}

                  {product.lowStock && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Low Stock Alert</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">
                        Stock is below the reorder level. Consider restocking soon.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Stock Movements */}
              {product.stock_movements && product.stock_movements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Recent Movements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {product.stock_movements.slice(0, 5).map((movement) => {
                        const typeInfo = formatMovementType(movement.type)
                        return (
                          <div key={movement.id} className="flex justify-between items-start text-sm">
                            <div>
                              <div className={`font-medium ${typeInfo.color}`}>
                                {typeInfo.label}
                              </div>
                              <div className="text-gray-500">
                                {new Date(movement.createdat).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                              </div>
                              {movement.notes && (
                                <div className="text-gray-500 text-xs max-w-24 truncate">
                                  {movement.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {product.stock_movements.length > 5 && (
                        <div className="text-center">
                          <Button variant="ghost" size="sm">
                            View All Movements
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  )
}