'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Save,
  Send,
  ShoppingCart,
  Plus,
  Trash2,
  Building2,
  Calculator
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Client {
  id: string
  companyName: string
  contactPerson: string
  email: string
}

interface RFQ {
  id: string
  quotation_number: string
  title: string
  client_id: string
}

interface RFQItem {
  id: string
  description: string
  quantity: number
  uom: string | null
  unit_price: number
  currency: string
  line_total: number
}

interface POItem {
  id: string
  description: string
  quantity: number
  uom: string
  unitPrice: number
  currency: string
  total: number
}

export default function CreatePurchaseOrderPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    quotationId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    terms: '',
    notes: ''
  })

  const [items, setItems] = useState<POItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      uom: '',
      unitPrice: 0,
      currency: 'KD',
      total: 0
    }
  ])

  const canCreate = hasFullAccess('purchase')

  useEffect(() => {
    fetchClients()
    fetchRFQs()
  }, [])

  const fetchClients = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, contact_person, email')
        .eq('is_active', true)
        .order('company_name')

      if (error) throw error
      const mappedClients = (data || []).map(client => ({
        id: client.id,
        companyName: client.company_name,
        contactPerson: client.contact_person,
        email: client.email
      }))
      setClients(mappedClients)
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchRFQs = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('quotations')
        .select('id, quotation_number, title, client_id')
        .eq('status', 'SENT')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRfqs(data || [])
    } catch (error) {
      console.error('Error fetching RFQs:', error)
    }
  }

  const loadRFQData = async (rfqId: string) => {
    if (!rfqId) return

    try {
      const supabase = createClient()
      const { data: rfqItems, error } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', rfqId)
        .order('created_at')

      if (error) throw error

      if (rfqItems && rfqItems.length > 0) {
        const mappedItems: POItem[] = rfqItems.map((item, index) => ({
          id: (index + 1).toString(),
          description: item.description || '',
          quantity: item.quantity || 1,
          uom: item.uom || '',
          unitPrice: item.unit_price || 0,
          currency: item.currency || 'KD',
          total: item.line_total || 0
        }))
        setItems(mappedItems)
      }
    } catch (error) {
      console.error('Error loading RFQ items:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Load RFQ items when RFQ is selected
    if (field === 'quotationId' && value) {
      loadRFQData(value)
    }
  }

  const handleItemChange = (itemId: string, field: string, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value }

        // Recalculate total if quantity or unit price changed
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
        }

        return updatedItem
      }
      return item
    }))
  }

  const addItem = () => {
    const newItem: POItem = {
      id: (items.length + 1).toString(),
      description: '',
      quantity: 1,
      uom: '',
      unitPrice: 0,
      currency: 'KD',
      total: 0
    }
    setItems(prev => [...prev, newItem])
  }

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== itemId))
    }
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const savePO = async (status: 'DRAFT' | 'SENT') => {
    if (!canCreate) return

    setSaving(true)
    try {
      const supabase = createClient()

      // Generate PO number
      const poNumber = `PO-${Date.now().toString().slice(-6)}`

      // Prepare PO data
      const poData = {
        po_number: poNumber,
        client_id: formData.clientId || null,
        supplier_id: null, // To be filled later when supplier responds
        quotation_id: formData.quotationId || null,
        order_date: formData.orderDate,
        delivery_date: formData.deliveryDate || null,
        subtotal: calculateSubtotal(),
        tax_amount: 0,
        total_amount: calculateSubtotal(),
        status: status,
        terms_and_conditions: formData.terms,
        notes: formData.notes,
        created_by: user?.id
      }

      // Create PO
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert([poData])
        .select()
        .single()

      if (poError) throw poError

      // Create PO items
      const itemsData = items
        .filter(item => item.description.trim() !== '')
        .map(item => ({
          po_id: po.id,
          description: item.description,
          quantity: item.quantity,
          uom: item.uom || null,
          unit_price: item.unitPrice,
          currency: item.currency,
          tax_rate: 0,
          line_total: item.total,
          delivered_qty: 0
        }))

      if (itemsData.length > 0) {
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsData)

        if (itemsError) throw itemsError
      }

      // Success message and redirect
      const message = status === 'DRAFT' ? 'Purchase Order saved as draft' : 'Purchase Order sent successfully'
      alert(message)
      router.push('/purchases/orders')

    } catch (error) {
      console.error('Error saving Purchase Order:', error)
      alert('Error saving Purchase Order. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <ShoppingCart className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to create Purchase Orders.</p>
            <Link href="/purchases/orders" className="mt-4 inline-block">
              <Button variant="outline">← Back to Purchase Orders</Button>
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
              <Link href="/purchases/orders">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Purchase Orders
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
                <p className="text-sm text-gray-600">Order from supplier</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => savePO('DRAFT')}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => savePO('SENT')}
                disabled={saving || !formData.supplierId}
              >
                <Send className="h-4 w-4 mr-2" />
                Send PO
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column - PO Details */}
            <div className="lg:col-span-2 space-y-6">

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="client">Client *</Label>
                    <select
                      id="client"
                      value={formData.clientId}
                      onChange={(e) => handleInputChange('clientId', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a client...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.companyName} ({client.contactPerson})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="rfq">Link to RFQ (Optional)</Label>
                    <select
                      id="rfq"
                      value={formData.quotationId}
                      onChange={(e) => handleInputChange('quotationId', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No RFQ - Create from scratch</option>
                      {rfqs.map(rfq => (
                        <option key={rfq.id} value={rfq.id}>
                          {rfq.quotation_number} {rfq.title ? `- ${rfq.title}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select an RFQ to automatically populate items
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="orderDate">Order Date *</Label>
                      <Input
                        id="orderDate"
                        type="date"
                        value={formData.orderDate}
                        onChange={(e) => handleInputChange('orderDate', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="deliveryDate">Expected Delivery</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Calculator className="h-5 w-5 mr-2" />
                      Items
                    </CardTitle>
                    <Button size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-900">Item {index + 1}</span>
                          {items.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="md:col-span-3">
                            <Label>Description</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                              placeholder="Item description..."
                            />
                          </div>

                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                              min="1"
                            />
                          </div>

                          <div>
                            <Label>UOM</Label>
                            <Input
                              value={item.uom}
                              onChange={(e) => handleItemChange(item.id, 'uom', e.target.value)}
                              placeholder="pcs, kg, box..."
                            />
                          </div>

                          <div>
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-3">
                          <div className="md:col-span-3">
                            <Label>Currency</Label>
                            <select
                              value={item.currency}
                              onChange={(e) => handleItemChange(item.id, 'currency', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="KD">KD - Kuwaiti Dinar</option>
                              <option value="USD">$ - US Dollar</option>
                              <option value="EUR">€ - Euro</option>
                              <option value="SAR">SAR - Saudi Riyal</option>
                              <option value="EGP">EGP - Egyptian Pound</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-3 text-right">
                          <span className="text-sm text-gray-600">Total: </span>
                          <span className="font-semibold">{item.currency} {item.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      value={formData.terms}
                      onChange={(e) => handleInputChange('terms', e.target.value)}
                      placeholder="Enter terms and conditions..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Internal Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Internal notes..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>PO Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.quotationId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="text-sm">
                        <span className="font-medium text-blue-800">Linked to RFQ:</span>
                        <div className="text-blue-700">
                          {rfqs.find(r => r.id === formData.quotationId)?.quotation_number}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-sm">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Items:</span>
                      <span>{items.filter(item => item.description.trim() !== '').length}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between py-2">
                        <span className="font-semibold">Total:</span>
                        <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {formData.deliveryDate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm">
                        <span className="font-medium text-blue-800">Expected Delivery:</span>
                        <div className="text-blue-700">
                          {new Date(formData.deliveryDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    * Make sure to verify supplier details and delivery dates before sending.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Verify unit prices with supplier quotes</p>
                    <p>• Set realistic delivery dates</p>
                    <p>• Include clear item descriptions</p>
                    <p>• Save as draft to review before sending</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
