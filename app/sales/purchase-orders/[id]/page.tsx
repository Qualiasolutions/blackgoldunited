'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Edit,
  ShoppingCart,
  Calendar,
  Building2,
  FileText,
  Loader2,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'

interface POItem {
  id: string
  description: string
  quantity: number
  uom: string
  unit_price: number
  currency: string
  line_total: number
}

interface Client {
  id: string
  company_name: string
  contact_person: string
  email: string
}

interface PurchaseOrder {
  id: string
  po_number: string
  client_id: string
  order_date: string
  delivery_date: string | null
  subtotal: number
  total_amount: number
  terms_and_conditions: string | null
  notes: string | null
  status: string
  created_at: string
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [po, setPo] = useState<PurchaseOrder | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [items, setItems] = useState<POItem[]>([])
  const [deleting, setDeleting] = useState(false)

  const canRead = hasModuleAccess('purchase')
  const canManage = hasFullAccess('purchase')

  useEffect(() => {
    if (!canRead) return

    const fetchPO = async () => {
      try {
        const supabase = createClient()

        // Fetch purchase order
        const { data: poData, error: poError } = await supabase
          .from('purchase_orders')
          .select('*')
          .eq('id', id)
          .single()

        if (poError) throw poError
        setPo(poData)

        // Fetch client if client_id exists
        if (poData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('id, company_name, contact_person, email')
            .eq('id', poData.client_id)
            .single()

          if (clientData) setClient(clientData)
        }

        // Fetch line items
        const { data: itemsData } = await supabase
          .from('purchase_order_items')
          .select('*')
          .eq('po_id', id)
          .order('created_at')

        if (itemsData) setItems(itemsData)
      } catch (error) {
        console.error('Error fetching purchase order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPO()
  }, [id, canRead])

  const handleDelete = async () => {
    if (!po) return

    if (!confirm(`Are you sure you want to delete purchase order ${po.po_number}? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/purchases/orders/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Redirect back to purchase orders list
        router.push('/sales/purchase-orders')
      } else {
        alert(`Failed to delete purchase order: ${result.error}`)
        setDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      alert('An error occurred while deleting the purchase order')
      setDeleting(false)
    }
  }

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view purchase orders.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!po) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Not Found</h1>
            <p className="text-gray-600">Purchase order not found.</p>
            <Link href="/sales/purchase-orders">
              <Button className="mt-4">Back to Purchase Orders</Button>
            </Link>
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
              <h1 className="text-2xl font-bold text-gray-900">Purchase Order {po.po_number}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/sales/purchase-orders">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              {canManage && ['DRAFT', 'SENT'].includes(po.status) && (
                <Link href={`/sales/purchase-orders/${id}/edit`}>
                  <Button>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
              {canManage && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Purchase Order Details
                </span>
                <Badge>{po.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <Building2 className="w-4 h-4 mr-2" />
                    Client
                  </div>
                  <p className="text-base text-gray-900">
                    {client?.company_name || 'N/A'}
                  </p>
                  {client?.contact_person && (
                    <p className="text-sm text-gray-500">{client.contact_person}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    Order Date
                  </div>
                  <p className="text-base text-gray-900">
                    {new Date(po.order_date).toLocaleDateString()}
                  </p>
                </div>

                {po.delivery_date && (
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      Delivery Date
                    </div>
                    <p className="text-base text-gray-900">
                      {new Date(po.delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {po.terms_and_conditions && (
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                      <FileText className="w-4 h-4 mr-2" />
                      Terms
                    </div>
                    <p className="text-base text-gray-900">{po.terms_and_conditions}</p>
                  </div>
                )}

                {po.notes && (
                  <div className="md:col-span-2">
                    <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                      <FileText className="w-4 h-4 mr-2" />
                      Notes
                    </div>
                    <p className="text-base text-gray-900">{po.notes}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Line Items</h3>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-12 md:col-span-4">
                            <div className="text-sm font-medium text-gray-500">Description</div>
                            <p className="text-base text-gray-900">{item.description}</p>
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <div className="text-sm font-medium text-gray-500">Quantity</div>
                            <p className="text-base text-gray-900">{item.quantity}</p>
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <div className="text-sm font-medium text-gray-500">UOM</div>
                            <p className="text-base text-gray-900">{item.uom}</p>
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <div className="text-sm font-medium text-gray-500">Unit Price</div>
                            <p className="text-base text-gray-900">{item.unit_price.toFixed(2)}</p>
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <div className="text-sm font-medium text-gray-500">Currency</div>
                            <p className="text-base text-gray-900">{item.currency}</p>
                          </div>
                        </div>

                        <div className="mt-2 text-right">
                          <span className="text-sm font-semibold">
                            Total: {item.line_total.toFixed(2)} {item.currency}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 flex justify-between items-center p-4 bg-gray-50 rounded">
                  <span className="text-lg font-semibold">Grand Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {(po.total_amount ?? 0).toFixed(2)} KD
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
