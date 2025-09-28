"use client"

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Eye, Edit, Trash, Plus, AlertTriangle, Package } from 'lucide-react'
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
import { Product } from '@/lib/types/bgu'
import { formatCurrency } from '@/lib/utils'

interface ProductListProps {
  products?: Product[]
}

const getStatusBadge = (status: Product['status']) => {
  const variants = {
    ACTIVE: 'success',
    INACTIVE: 'secondary',
    DISCONTINUED: 'destructive'
  } as const

  return (
    <Badge variant={variants[status]}>
      {status.toLowerCase()}
    </Badge>
  )
}

const getStockStatus = (stock: number, minStock: number) => {
  if (stock === 0) {
    return <Badge variant="destructive">Out of Stock</Badge>
  } else if (stock <= minStock) {
    return <Badge variant="warning">Low Stock</Badge>
  } else {
    return <Badge variant="success">In Stock</Badge>
  }
}

export function ProductList({ products = [] }: ProductListProps) {
  const data = products

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("sku")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.category}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = row.getValue("stock") as number
        const minStock = row.original.minStock
        const unit = row.original.unit
        
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Package className="h-3 w-3" />
              <span className="text-sm font-medium">{stock} {unit}</span>
            </div>
            {getStockStatus(stock, minStock)}
          </div>
        )
      },
    },
    {
      accessorKey: "unitPrice",
      header: "Price",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">
            {formatCurrency(row.getValue("unitPrice"))}
          </div>
          <div className="text-xs text-muted-foreground">
            Cost: {formatCurrency(row.original.cost)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "alerts",
      header: "Alerts",
      cell: ({ row }) => {
        const stock = row.original.stock
        const minStock = row.original.minStock
        
        if (stock === 0) {
          return (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Out of Stock</span>
            </div>
          )
        } else if (stock <= minStock) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products & Services</h2>
          <p className="text-muted-foreground">
            Manage your inventory and track stock levels.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stock Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded-lg bg-red-50 border-red-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Out of Stock</p>
              <p className="text-xs text-red-600">
                {data.filter(p => p.stock === 0).length} items
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Low Stock</p>
              <p className="text-xs text-yellow-600">
                {data.filter(p => p.stock > 0 && p.stock <= p.minStock).length} items
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">In Stock</p>
              <p className="text-xs text-green-600">
                {data.filter(p => p.stock > p.minStock).length} items
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search products..."
      />
    </div>
  )
}