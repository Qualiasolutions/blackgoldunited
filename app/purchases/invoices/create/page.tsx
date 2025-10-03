'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  FileText,
  Save,
  Plus,
  Trash2,
  Building,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface Supplier {
  id: string
  name: string
  supplier_code: string
  email: string
}

interface InvoiceItem {
  id: string
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  totalAmount: number
}

interface InvoiceFormData {
  supplier_id: string
  supplier_invoice_number: string
  invoiceDate: string
  dueDate: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED'
  tax_rate: number
  discount_amount: number
  shipping_cost: number
  notes: string
  items: InvoiceItem[]
}

export default function CreatePurchaseInvoicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(true)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const [formData, setFormData] = useState<InvoiceFormData>({
    supplier_id: '',
    supplier_invoice_number: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'DRAFT',
    tax_rate: 0,
    discount_amount: 0,
    shipping_cost: 0,
    notes: '',
    items: [{
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0
    }]
  })

  const canManage = hasFullAccess('purchase')

  // Fetch suppliers
  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true)
      const response = await fetch('/api/purchases/suppliers?limit=100')
      const result = await response.json()

      if (result.success) {
        setSuppliers(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setSuppliersLoading(false)
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalculate total
    const item = updatedItems[index]
    item.totalAmount = item.quantity * item.unitPrice

    setFormData(prev => ({ ...prev, items: updatedItems }))
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = subtotal * (formData.tax_rate / 100)
    const total = subtotal + taxAmount + formData.shipping_cost - formData.discount_amount

    return { subtotal, taxAmount, total }
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Please select a supplier'
    }

    if (!formData.supplier_invoice_number) {
      newErrors.supplier_invoice_number = 'Supplier invoice number is required'
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required'
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required'
    }

    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'Description is required'
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0'
      }
      if (item.unitPrice < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price cannot be negative'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const submitData = {
        supplier_id: formData.supplier_id,
        supplier_invoice_number: formData.supplier_invoice_number,
        invoiceDate: new Date(formData.invoiceDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status,
        tax_rate: formData.tax_rate,
        discount_amount: formData.discount_amount,
        shipping_cost: formData.shipping_cost,
        notes: formData.notes,
        items: formData.items.map(item => ({
          productId: item.productId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      }

      const response = await fetch('/api/purchases/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to create invoices')
        } else if (response.status === 403) {
          throw new Error('You don\'t have permission to create invoices')
        } else if (result.details) {
          throw new Error('Please check the form for errors: ' + result.details.map((d: any) => d.message).join(', '))
        } else {
          throw new Error(result.error || 'Failed to create invoice')
        }
      }

      if (result.success) {
        router.push(`/purchases/invoices`)
      } else {
        throw new Error(result.error || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      setError(error instanceof Error ? error.message : 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to create purchase invoices.</p>
            <Link href="/purchases/invoices" className="mt-4 inline-block">
              <Button variant="outline">← Back to Invoices</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/purchases/invoices">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Invoices
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Purchase Invoice</h1>
                <p className="text-sm text-gray-600">Record a new supplier invoice</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">

          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error:</span>
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Main Invoice Form */}
              <div className="lg:col-span-2 space-y-6">

                {/* Supplier & Invoice Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Supplier & Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier *
                      </label>
                      <Select
                        value={formData.supplier_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                        disabled={suppliersLoading}
                      >
                        <SelectTrigger className={errors.supplier_id ? 'border-red-500' : ''}>
                          <SelectValue placeholder={suppliersLoading ? "Loading suppliers..." : "Select a supplier"} />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name} ({supplier.supplier_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.supplier_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier Invoice Number *
                      </label>
                      <Input
                        value={formData.supplier_invoice_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, supplier_invoice_number: e.target.value }))}
                        placeholder="Enter supplier's invoice number"
                        className={errors.supplier_invoice_number ? 'border-red-500' : ''}
                      />
                      {errors.supplier_invoice_number && (
                        <p className="mt-1 text-sm text-red-600">{errors.supplier_invoice_number}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Invoice Date
                        </label>
                        <Input
                          type="date"
                          value={formData.invoiceDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Due Date *
                        </label>
                        <Input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                          className={errors.dueDate ? 'border-red-500' : ''}
                        />
                        {errors.dueDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Invoice Items</span>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {formData.items.map((item, index) => (
                        <div key={item.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                            {formData.items.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description *
                            </label>
                            <Textarea
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              placeholder="Item description"
                              rows={2}
                              className={errors[`item_${index}_description`] ? 'border-red-500' : ''}
                            />
                            {errors[`item_${index}_description`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_description`]}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity *
                              </label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className={errors[`item_${index}_quantity`] ? 'border-red-500' : ''}
                              />
                              {errors[`item_${index}_quantity`] && (
                                <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit Price *
                              </label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className={errors[`item_${index}_unitPrice`] ? 'border-red-500' : ''}
                              />
                              {errors[`item_${index}_unitPrice`] && (
                                <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_unitPrice`]}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total
                              </label>
                              <Input
                                type="text"
                                value={`$${item.totalAmount.toFixed(2)}`}
                                disabled
                                className="bg-gray-50"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tax Rate (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.tax_rate}
                          onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Shipping Cost
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.shipping_cost}
                          onChange={(e) => setFormData(prev => ({ ...prev, shipping_cost: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.discount_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Invoice Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                        <span className="font-medium">${taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-medium">${formData.shipping_cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-red-600">-${formData.discount_amount.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-bold text-lg">Total:</span>
                        <span className="font-bold text-lg text-purple-600">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-4 space-y-3">
                      <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Create Invoice
                          </>
                        )}
                      </Button>

                      <Link href="/purchases/invoices" className="block">
                        <Button type="button" variant="outline" className="w-full">
                          Cancel
                        </Button>
                      </Link>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>• Invoice number will be auto-generated</p>
                        <p>• All fields marked with * are required</p>
                        <p>• Default payment status: UNPAID</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
