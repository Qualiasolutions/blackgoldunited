'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Package,
  Loader2,
  AlertTriangle,
  Plus,
  Minus,
  ArrowUpDown,
  Save
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect} from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  productCode: string
  unit: string
  category?: {
    id: string
    name: string
  }
}

interface Warehouse {
  id: string
  name: string
  code: string
  location: string
}

interface ProductStock {
  quantity: number
  reservedQty: number
  availableStock: number
}

export default function StockAdjustmentPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [currentStock, setCurrentStock] = useState<ProductStock | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStock, setLoadingStock] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    adjustmentType: 'IN', // 'IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'
    quantity: '',
    reason: '',
    notes: '',
    targetWarehouseId: '' // For transfers
  })

  const canManage = hasFullAccess('inventory')
  const canRead = hasModuleAccess('inventory')

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory/products?limit=1000&isActive=true')
      if (response.ok) {
        const result = await response.json()
        setProducts(result.success ? result.data || [] : [])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/inventory/warehouses?limit=1000&isActive=true')
      if (response.ok) {
        const result = await response.json()
        setWarehouses(result.success ? result.data || [] : [])
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err)
    }
  }

  // Fetch current stock when product and warehouse are selected
  const fetchCurrentStock = async () => {
    if (!formData.productId || !formData.warehouseId) {
      setCurrentStock(null)
      return
    }

    try {
      setLoadingStock(true)
      const response = await fetch(
        `/api/inventory/stock?productId=${formData.productId}&warehouse=${formData.warehouseId}&limit=1`
      )

      if (response.ok) {
        const result = await response.json()
        const stockData = result.data?.[0]
        if (stockData) {
          setCurrentStock({
            quantity: stockData.quantity,
            reservedQty: stockData.reservedQty,
            availableStock: stockData.quantity - stockData.reservedQty
          })
        } else {
          setCurrentStock({
            quantity: 0,
            reservedQty: 0,
            availableStock: 0
          })
        }
      }
    } catch (err) {
      console.error('Error fetching stock:', err)
      setCurrentStock(null)
    } finally {
      setLoadingStock(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (!canManage) return
    fetchProducts()
    fetchWarehouses()
  }, [canManage])

  // Fetch stock when product/warehouse changes
  useEffect(() => {
    if (!canManage) return
    fetchCurrentStock()
  }, [canManage, formData.productId, formData.warehouseId])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  const validateForm = (): boolean => {
    const errors: string[] = []

    if (!formData.productId) errors.push('Product is required')
    if (!formData.warehouseId) errors.push('Warehouse is required')
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      errors.push('Quantity must be greater than 0')
    }
    if (!formData.reason.trim()) errors.push('Reason is required')

    if (formData.adjustmentType === 'TRANSFER' && !formData.targetWarehouseId) {
      errors.push('Target warehouse is required for transfers')
    }

    if (formData.adjustmentType === 'TRANSFER' && formData.warehouseId === formData.targetWarehouseId) {
      errors.push('Source and target warehouses must be different')
    }

    // Check sufficient stock for OUT operations
    if (formData.adjustmentType === 'OUT' && currentStock) {
      const quantity = parseFloat(formData.quantity)
      if (quantity > currentStock.availableStock) {
        errors.push(`Insufficient stock. Available: ${currentStock.availableStock}`)
      }
    }

    if (errors.length > 0) {
      setError(errors.join(', '))
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)
      setError('')

      const payload = {
        productId: formData.productId,
        warehouseId: formData.warehouseId,
        type: formData.adjustmentType,
        quantity: parseFloat(formData.quantity),
        reason: formData.reason,
        notes: formData.notes || undefined,
        targetWarehouseId: formData.adjustmentType === 'TRANSFER' ? formData.targetWarehouseId : undefined,
        referenceType: 'MANUAL'
      }

      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to adjust stock')
      }

      setSuccess('Stock adjustment completed successfully!')

      // Reset form
      setFormData({
        productId: '',
        warehouseId: '',
        adjustmentType: 'IN',
        quantity: '',
        reason: '',
        notes: '',
        targetWarehouseId: ''
      })

      setCurrentStock(null)

      // Redirect after success
      setTimeout(() => {
        router.push('/inventory/stock')
      }, 2000)

    } catch (err) {
      console.error('Error adjusting stock:', err)
      setError(err instanceof Error ? err.message : 'Failed to adjust stock')
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find(p => p.id === formData.productId)
  const selectedWarehouse = warehouses.find(w => w.id === formData.warehouseId)
  const selectedTargetWarehouse = warehouses.find(w => w.id === formData.targetWarehouseId)

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <Plus className="w-4 h-4 text-green-500" />
      case 'OUT':
        return <Minus className="w-4 h-4 text-red-500" />
      case 'TRANSFER':
        return <ArrowUpDown className="w-4 h-4 text-blue-500" />
      case 'ADJUSTMENT':
        return <Package className="w-4 h-4 text-orange-500" />
      default:
        return <Package className="w-4 h-4 text-gray-500" />
    }
  }

  // Check permissions AFTER all hooks
  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to adjust stock.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Stock Adjustment</h1>
            </div>
            <div className="flex items-center">
              <Link href="/inventory/stock">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Stock
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Success Message */}
          {success && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Package className="w-4 h-4" />
                  <span>{success}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Column - Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getAdjustmentIcon(formData.adjustmentType)}
                    Stock Adjustment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Product Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product *
                    </label>
                    <Select
                      value={formData.productId}
                      onValueChange={(value) => handleInputChange('productId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.productCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Warehouse Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warehouse *
                    </label>
                    <Select
                      value={formData.warehouseId}
                      onValueChange={(value) => handleInputChange('warehouseId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} ({warehouse.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Adjustment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjustment Type *
                    </label>
                    <Select
                      value={formData.adjustmentType}
                      onValueChange={(value) => handleInputChange('adjustmentType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">Stock In (+)</SelectItem>
                        <SelectItem value="OUT">Stock Out (-)</SelectItem>
                        <SelectItem value="ADJUSTMENT">Adjustment (Set Quantity)</SelectItem>
                        <SelectItem value="TRANSFER">Transfer to Another Warehouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Warehouse (for transfers) */}
                  {formData.adjustmentType === 'TRANSFER' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Warehouse *
                      </label>
                      <Select
                        value={formData.targetWarehouseId}
                        onValueChange={(value) => handleInputChange('targetWarehouseId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select target warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses
                            .filter(w => w.id !== formData.warehouseId)
                            .map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name} ({warehouse.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        placeholder="Enter quantity"
                        className="pr-16"
                      />
                      {selectedProduct && (
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                          {selectedProduct.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason *
                    </label>
                    <Input
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="Enter reason for adjustment"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Additional notes (optional)"
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Submit Adjustment
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Right Column - Current Stock Info */}
              <div className="space-y-6">

                {/* Current Stock */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Stock Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingStock ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span>Loading stock...</span>
                      </div>
                    ) : selectedProduct && selectedWarehouse ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Product</p>
                          <p className="font-medium">{selectedProduct.name}</p>
                          <p className="text-sm text-gray-500">{selectedProduct.productCode}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Warehouse</p>
                          <p className="font-medium">{selectedWarehouse.name}</p>
                          <p className="text-sm text-gray-500">{selectedWarehouse.location}</p>
                        </div>

                        {currentStock && (
                          <div className="grid grid-cols-1 gap-3 pt-4 border-t">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Stock:</span>
                              <span className="font-medium">
                                {currentStock.quantity} {selectedProduct.unit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Reserved:</span>
                              <span className="text-orange-600">
                                {currentStock.reservedQty} {selectedProduct.unit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Available:</span>
                              <span className="font-medium text-green-600">
                                {currentStock.availableStock} {selectedProduct.unit}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">Select product and warehouse to view stock information</p>
                    )}
                  </CardContent>
                </Card>

                {/* Transfer Target Info */}
                {formData.adjustmentType === 'TRANSFER' && selectedTargetWarehouse && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Transfer Target</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Target Warehouse</p>
                          <p className="font-medium">{selectedTargetWarehouse.name}</p>
                          <p className="text-sm text-gray-500">{selectedTargetWarehouse.location}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}