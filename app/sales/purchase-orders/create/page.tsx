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
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    clientId: '',
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

  // Fetch clients - NO useCallback
  useEffect(() => {
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

    fetchClients()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleItemChange = (index: number, field: keyof POItem, value: string | number) => {
    setItems(prev => {
      const newItems = [...prev]
      newItems[index] = {
        ...newItems[index],
        [field]: value
      }

      // Recalculate total
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
      }

      return newItems
    })
  }

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        uom: '',
        unitPrice: 0,
        currency: 'KD',
        total: 0
      }
    ])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleSave = async (status: 'DRAFT' | 'APPROVED') => {
    if (!canCreate) return

    try {
      setSaving(true)
      const supabase = createClient()

      // Create PO
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          client_id: formData.clientId,
          order_date: formData.orderDate,
          delivery_date: formData.deliveryDate || null,
          terms: formData.terms || null,
          notes: formData.notes || null,
          status,
          total_amount: calculateTotal(),
          created_by: user?.id
        })
        .select()
        .single()

      if (poError) throw poError

      // Create line items
      const lineItems = items.map(item => ({
        purchase_order_id: po.id,
        description: item.description,
        quantity: item.quantity,
        uom: item.uom,
        unit_price: item.unitPrice,
        currency: item.currency,
        total: item.total
      }))

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(lineItems)

      if (itemsError) throw itemsError

      router.push('/purchases/orders')
    } catch (error) {
      console.error('Error saving purchase order:', error)
      alert('Failed to save purchase order')
    } finally {
      setSaving(false)
    }
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to create purchase orders.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/purchases/orders">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Purchase Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label>Client *</Label>
                  <select
                    className="w-full mt-1 border rounded px-3 py-2"
                    value={formData.clientId}
                    onChange={(e) => handleInputChange('clientId', e.target.value)}
                    required
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Order Date *</Label>
                  <Input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => handleInputChange('orderDate', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Delivery Date</Label>
                  <Input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Terms</Label>
                  <Input
                    value={formData.terms}
                    onChange={(e) => handleInputChange('terms', e.target.value)}
                    placeholder="Payment terms"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Line Items</h3>
                  <Button onClick={addItem} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-12 md:col-span-4">
                            <Label>Description</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              placeholder="Item description"
                            />
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              min="1"
                            />
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <Label>UOM</Label>
                            <Input
                              value={item.uom}
                              onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                              placeholder="Unit"
                            />
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              step="0.01"
                              min="0"
                            />
                          </div>

                          <div className="col-span-4 md:col-span-1">
                            <Label>Currency</Label>
                            <select
                              className="w-full border rounded px-2 py-2"
                              value={item.currency}
                              onChange={(e) => handleItemChange(index, 'currency', e.target.value)}
                            >
                              <option value="KD">KD</option>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                            </select>
                          </div>

                          <div className="col-span-6 md:col-span-1 flex items-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2 text-right">
                          <span className="text-sm font-semibold">
                            Total: {item.total.toFixed(2)} {item.currency}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 flex justify-between items-center p-4 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-gray-600" />
                    <span className="text-lg font-semibold">Grand Total:</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {calculateTotal().toFixed(2)} KD
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => handleSave('DRAFT')}
                  disabled={saving || !formData.clientId}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSave('APPROVED')}
                  disabled={saving || !formData.clientId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Create & Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
