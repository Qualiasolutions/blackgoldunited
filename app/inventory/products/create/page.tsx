'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  Tag,
  Scale,
  Barcode,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ProductCategory {
  id: string
  name: string
  description?: string
}

interface FormData {
  productCode: string
  name: string
  description: string
  type: 'PRODUCT' | 'SERVICE'
  categoryId: string
  unit: string
  costPrice: string
  sellingPrice: string
  minStock: string
  maxStock: string
  reorderLevel: string
  isActive: boolean
  isTaxable: boolean
  taxRate: string
  barcode: string
  sku: string
  weight: string
  dimensions: string
  notes: string
}

export default function CreateProductPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const router = useRouter()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<FormData>({
    productCode: '',
    name: '',
    description: '',
    type: 'PRODUCT',
    categoryId: '',
    unit: '',
    costPrice: '',
    sellingPrice: '',
    minStock: '',
    maxStock: '',
    reorderLevel: '',
    isActive: true,
    isTaxable: true,
    taxRate: '0',
    barcode: '',
    sku: '',
    weight: '',
    dimensions: '',
    notes: ''
  })

  const canManage = hasFullAccess('inventory')

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to create products.</p>
            <Button asChild className="mt-4">
              <Link href="/inventory">Back to Inventory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Required fields
    if (!formData.name.trim()) errors.name = 'Product name is required'
    if (!formData.unit.trim()) errors.unit = 'Unit is required'
    if (!formData.sellingPrice.trim()) errors.sellingPrice = 'Selling price is required'

    // Numeric validations
    if (formData.sellingPrice && isNaN(Number(formData.sellingPrice))) {
      errors.sellingPrice = 'Selling price must be a valid number'
    }
    if (formData.costPrice && isNaN(Number(formData.costPrice))) {
      errors.costPrice = 'Cost price must be a valid number'
    }
    if (formData.taxRate && (isNaN(Number(formData.taxRate)) || Number(formData.taxRate) < 0 || Number(formData.taxRate) > 100)) {
      errors.taxRate = 'Tax rate must be a number between 0 and 100'
    }
    if (formData.minStock && isNaN(Number(formData.minStock))) {
      errors.minStock = 'Minimum stock must be a valid number'
    }
    if (formData.maxStock && isNaN(Number(formData.maxStock))) {
      errors.maxStock = 'Maximum stock must be a valid number'
    }
    if (formData.reorderLevel && isNaN(Number(formData.reorderLevel))) {
      errors.reorderLevel = 'Reorder level must be a valid number'
    }
    if (formData.weight && isNaN(Number(formData.weight))) {
      errors.weight = 'Weight must be a valid number'
    }

    // Price validation
    if (formData.sellingPrice && formData.costPrice) {
      const sellingPrice = Number(formData.sellingPrice)
      const costPrice = Number(formData.costPrice)
      if (sellingPrice < costPrice) {
        errors.sellingPrice = 'Selling price cannot be lower than cost price'
      }
    }

    // Stock level validation
    if (formData.minStock && formData.maxStock) {
      const minStock = Number(formData.minStock)
      const maxStock = Number(formData.maxStock)
      if (minStock >= maxStock) {
        errors.maxStock = 'Maximum stock must be greater than minimum stock'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        sellingPrice: Number(formData.sellingPrice),
        taxRate: Number(formData.taxRate),
        minStock: formData.minStock ? Number(formData.minStock) : undefined,
        maxStock: formData.maxStock ? Number(formData.maxStock) : undefined,
        reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        categoryId: formData.categoryId || undefined,
        barcode: formData.barcode || undefined,
        sku: formData.sku || undefined,
        dimensions: formData.dimensions || undefined,
        notes: formData.notes || undefined,
      }

      const response = await fetch('/api/inventory/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details) {
          // Handle Zod validation errors
          const fieldErrors: Record<string, string> = {}
          result.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              fieldErrors[detail.path[0]] = detail.message
            }
          })
          setValidationErrors(fieldErrors)
        }
        throw new Error(result.error || 'Failed to create product')
      }

      if (result.success) {
        // Redirect to the product view page
        router.push(`/inventory/products/${result.data.id}`)
      } else {
        throw new Error(result.error || 'Failed to create product')
      }
    } catch (err) {
      console.error('Error creating product:', err)
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
            </div>
            <div className="flex items-center space-x-4">
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
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Error Message */}
          {error && (
            <Card className="mb-6 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productCode">Product Code</Label>
                    <Input
                      id="productCode"
                      value={formData.productCode}
                      onChange={(e) => handleInputChange('productCode', e.target.value)}
                      placeholder="Leave empty to auto-generate"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Will be auto-generated if left empty
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={validationErrors.name ? 'border-red-500' : ''}
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRODUCT">Product</SelectItem>
                        <SelectItem value="SERVICE">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="categoryId">Category</Label>
                    <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    placeholder="e.g., pcs, kg, lbs, m"
                    className={validationErrors.unit ? 'border-red-500' : ''}
                  />
                  {validationErrors.unit && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.unit}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing & Tax
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="costPrice">Cost Price</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange('costPrice', e.target.value)}
                      className={validationErrors.costPrice ? 'border-red-500' : ''}
                    />
                    {validationErrors.costPrice && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.costPrice}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="sellingPrice">Selling Price *</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                      className={validationErrors.sellingPrice ? 'border-red-500' : ''}
                    />
                    {validationErrors.sellingPrice && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.sellingPrice}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isTaxable"
                    checked={formData.isTaxable}
                    onCheckedChange={(checked) => handleInputChange('isTaxable', checked)}
                  />
                  <Label htmlFor="isTaxable">Taxable Product</Label>
                </div>

                {formData.isTaxable && (
                  <div className="w-full md:w-1/2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.taxRate}
                      onChange={(e) => handleInputChange('taxRate', e.target.value)}
                      className={validationErrors.taxRate ? 'border-red-500' : ''}
                    />
                    {validationErrors.taxRate && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.taxRate}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stock Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Stock Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="minStock">Minimum Stock</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      value={formData.minStock}
                      onChange={(e) => handleInputChange('minStock', e.target.value)}
                      className={validationErrors.minStock ? 'border-red-500' : ''}
                    />
                    {validationErrors.minStock && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.minStock}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="maxStock">Maximum Stock</Label>
                    <Input
                      id="maxStock"
                      type="number"
                      min="0"
                      value={formData.maxStock}
                      onChange={(e) => handleInputChange('maxStock', e.target.value)}
                      className={validationErrors.maxStock ? 'border-red-500' : ''}
                    />
                    {validationErrors.maxStock && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.maxStock}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input
                      id="reorderLevel"
                      type="number"
                      min="0"
                      value={formData.reorderLevel}
                      onChange={(e) => handleInputChange('reorderLevel', e.target.value)}
                      className={validationErrors.reorderLevel ? 'border-red-500' : ''}
                    />
                    {validationErrors.reorderLevel && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.reorderLevel}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className={validationErrors.weight ? 'border-red-500' : ''}
                    />
                    {validationErrors.weight && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.weight}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input
                      id="dimensions"
                      value={formData.dimensions}
                      onChange={(e) => handleInputChange('dimensions', e.target.value)}
                      placeholder="e.g., 10x20x30 cm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active Product</Label>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/inventory">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Product...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Product
                  </>
                )}
              </Button>
            </div>
          </form>

        </div>
      </main>
    </div>
  )
}