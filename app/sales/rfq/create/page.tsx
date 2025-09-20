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
  Quote,
  Plus,
  Trash2,
  Users,
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

interface RFQItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export default function CreateRFQPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    validUntil: '',
    terms: '',
    notes: ''
  })

  const [items, setItems] = useState<RFQItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
  ])

  const canCreate = hasFullAccess('sales')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clients')
        .select('id, companyName, contactPerson, email')
        .eq('deletedAt', null)
        .eq('isActive', true)
        .order('companyName')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
    const newItem: RFQItem = {
      id: (items.length + 1).toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
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

  const saveRFQ = async (status: 'DRAFT' | 'SENT') => {
    if (!canCreate) return

    setSaving(true)
    try {
      const supabase = createClient()

      // Generate RFQ number
      const rfqNumber = `RFQ-${Date.now().toString().slice(-6)}`

      // Prepare RFQ data
      const rfqData = {
        quotationNumber: rfqNumber,
        clientId: formData.clientId,
        title: formData.title,
        description: formData.description,
        status: status,
        validUntil: formData.validUntil || null,
        totalAmount: calculateSubtotal(),
        terms: formData.terms,
        notes: formData.notes,
        createdBy: user?.id
      }

      // Create RFQ
      const { data: rfq, error: rfqError } = await supabase
        .from('quotations')
        .insert([rfqData])
        .select()
        .single()

      if (rfqError) throw rfqError

      // Create RFQ items
      const itemsData = items
        .filter(item => item.description.trim() !== '')
        .map(item => ({
          quotationId: rfq.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.total
        }))

      if (itemsData.length > 0) {
        const { error: itemsError } = await supabase
          .from('quotation_items')
          .insert(itemsData)

        if (itemsError) throw itemsError
      }

      // Success message and redirect
      const message = status === 'DRAFT' ? 'RFQ saved as draft' : 'RFQ sent successfully'
      alert(message)
      router.push('/sales/rfq')

    } catch (error) {
      console.error('Error saving RFQ:', error)
      alert('Error saving RFQ. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Quote className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to create RFQs.</p>
            <Link href="/sales/rfq" className="mt-4 inline-block">
              <Button variant="outline">← Back to RFQ List</Button>
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
              <Link href="/sales/rfq">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  RFQ List
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Quote className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create RFQ</h1>
                <p className="text-sm text-gray-600">Request for Quotation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => saveRFQ('DRAFT')}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => saveRFQ('SENT')}
                disabled={saving || !formData.clientId || !formData.title}
              >
                <Send className="h-4 w-4 mr-2" />
                Send RFQ
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column - RFQ Details */}
            <div className="lg:col-span-2 space-y-6">

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
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
                    <Label htmlFor="title">RFQ Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter RFQ title..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the requirements..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    />
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

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
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
                            <Label>Est. Unit Price</Label>
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

                        <div className="mt-3 text-right">
                          <span className="text-sm text-gray-600">Total: </span>
                          <span className="font-semibold">${item.total.toFixed(2)}</span>
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
                      placeholder="Internal notes (not visible to client)..."
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
                  <CardTitle>RFQ Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        <span className="font-semibold">Estimated Total:</span>
                        <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {formData.validUntil && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="text-sm">
                        <span className="font-medium text-yellow-800">Valid Until:</span>
                        <div className="text-yellow-700">
                          {new Date(formData.validUntil).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    * This is an estimated total. Final amounts may vary based on supplier quotations.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Provide detailed item descriptions for accurate quotes</p>
                    <p>• Set realistic validity dates for better responses</p>
                    <p>• Include terms and conditions to avoid misunderstandings</p>
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