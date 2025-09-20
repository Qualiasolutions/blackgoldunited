"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Eye, Edit, Trash, Plus, AlertTriangle, Package, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/data-table/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Product {
  id: string
  productCode: string
  name: string
  description?: string
  categoryId?: string
  sellingPrice: number
  costPrice?: number
  reorderLevel?: number
  unit?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  category?: {
    id: string
    name: string
  }
  stocks?: Array<{
    id: string
    quantity: number
    reservedQty: number
    warehouse: {
      id: string
      name: string
    }
  }>
}

const getStatusBadge = (isActive: boolean) => {
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  )
}

const getStockStatus = (totalStock: number, reorderLevel: number) => {
  if (totalStock === 0) {
    return <Badge variant="destructive">Out of Stock</Badge>
  } else if (reorderLevel && totalStock <= reorderLevel) {
    return <Badge variant="secondary">Low Stock</Badge>
  } else {
    return <Badge variant="default">In Stock</Badge>
  }
}

export function RealtimeProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory/products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      setProducts(data.products || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()

    // Set up real-time subscriptions for products and stocks
    const supabase = createClient()

    const productSubscription = supabase
      .channel('products_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Product change detected:', payload)
          fetchProducts()
        }
      )
      .subscribe()

    const stockSubscription = supabase
      .channel('stocks_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stocks' },
        (payload) => {
          console.log('Stock change detected:', payload)
          fetchProducts()
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(productSubscription)
      supabase.removeChannel(stockSubscription)
    }
  }, [])

  // Calculate stock statistics
  const enrichedProducts = products.map(product => {
    const totalStock = product.stocks?.reduce((sum, stock) => sum + (stock.quantity || 0), 0) || 0
    const reservedStock = product.stocks?.reduce((sum, stock) => sum + (stock.reservedQty || 0), 0) || 0
    const availableStock = totalStock - reservedStock

    return {
      ...product,
      totalStock,
      availableStock,
      warehouses: product.stocks?.length || 0
    }
  })

  const outOfStock = enrichedProducts.filter(p => p.totalStock === 0).length
  const lowStock = enrichedProducts.filter(p => p.totalStock > 0 && p.reorderLevel && p.totalStock <= p.reorderLevel).length
  const inStock = enrichedProducts.filter(p => !p.reorderLevel || p.totalStock > p.reorderLevel).length

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "productCode",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("productCode")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.category?.name || 'No category'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "totalStock",
      header: "Stock",
      cell: ({ row }) => {
        const totalStock = row.original.totalStock
        const availableStock = row.original.availableStock
        const unit = row.original.unit || 'units'
        const reorderLevel = row.original.reorderLevel

        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Package className="h-3 w-3" />
              <span className="text-sm font-medium">{availableStock} {unit}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Total: {totalStock} • Warehouses: {row.original.warehouses}
            </div>
            {getStockStatus(availableStock, reorderLevel || 0)}
          </div>
        )
      },
    },
    {
      accessorKey: "sellingPrice",
      header: "Price",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">
            ${Number(row.getValue("sellingPrice")).toLocaleString()}
          </div>
          {row.original.costPrice && (
            <div className="text-xs text-muted-foreground">
              Cost: ${Number(row.original.costPrice).toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("isActive")),
    },
    {
      id: "alerts",
      header: "Alerts",
      cell: ({ row }) => {
        const availableStock = row.original.availableStock
        const reorderLevel = row.original.reorderLevel

        if (availableStock === 0) {
          return (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Out of Stock</span>
            </div>
          )
        } else if (reorderLevel && availableStock <= reorderLevel) {
          return (
            <div className="flex items-center space-x-1 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Low Stock</span>
            </div>
          )
        }
        return null
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Package className="mr-2 h-4 w-4" />
                Adjust Stock
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading products...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
        <p>Error loading products: {error}</p>
        <Button onClick={fetchProducts} className="mt-2">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products & Services</h2>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-muted-foreground text-sm">
              Live inventory tracking - updates in real-time
            </p>
          </div>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stock Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStock}</div>
            <div className="text-sm text-gray-500 mt-1">
              Requires immediate attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStock}</div>
            <div className="text-sm text-gray-500 mt-1">
              Below reorder level
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Package className="h-4 w-4 text-green-600 mr-2" />
              In Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inStock}</div>
            <div className="text-sm text-gray-500 mt-1">
              Adequate inventory levels
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory ({enrichedProducts.length} products)</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={enrichedProducts}
            searchKey="name"
            searchPlaceholder="Search products..."
          />
        </CardContent>
      </Card>
    </div>
  )
}