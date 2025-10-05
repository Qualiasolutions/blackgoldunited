'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Download,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Package,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'

interface POItem {
  id: string
  description: string
  quantity: number
  uom: string | null
  unitPrice: number
  currency: string
  lineTotal: number
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplierName: string
  supplierEmail: string
  supplierPhone: string
  orderDate: string
  deliveryDate: string
  status: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  notes: string
  createdAt: string
  items: POItem[]
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [po, setPo] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)

  const canEdit = hasFullAccess('purchase')
  const canRead = hasModuleAccess('purchase')

  useEffect(() => {
    if (params.id) {
      fetchPurchaseOrder(params.id as string)
    }
  }, [params.id])

  const fetchPurchaseOrder = async (id: string) => {
    try {
      const supabase = createClient()

      // Fetch Purchase Order
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('id', id)
        .single()

      if (poError) throw poError

      // Fetch supplier
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('company_name, email, phone')
        .eq('id', poData.supplier_id)
        .single()

      // Fetch items
      const { data: itemsData } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('purchase_order_id', id)
        .order('created_at')

      const formattedPO: PurchaseOrder = {
        id: poData.id,
        orderNumber: poData.order_number,
        supplierId: poData.supplier_id,
        supplierName: supplierData?.company_name || 'Unknown Supplier',
        supplierEmail: supplierData?.email || '',
        supplierPhone: supplierData?.phone || '',
        orderDate: poData.order_date,
        deliveryDate: poData.delivery_date,
        status: poData.status,
        subtotal: Number(poData.subtotal) || 0,
        taxAmount: Number(poData.tax_amount) || 0,
        totalAmount: Number(poData.total_amount) || 0,
        notes: poData.notes || '',
        createdAt: poData.created_at,
        items: (itemsData || []).map(item => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          uom: item.uom,
          unitPrice: Number(item.unit_price),
          currency: item.currency || 'KD',
          lineTotal: Number(item.line_total)
        }))
      }

      setPo(formattedPO)
    } catch (error) {
      console.error('Error fetching Purchase Order:', error)
      alert('Error loading Purchase Order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText, label: 'Draft' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, label: 'Pending' },
      APPROVED: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle, label: 'Approved' },
      RECEIVED: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, label: 'Received' },
      CANCELLED: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: 'Cancelled' },
      PARTIAL: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle, label: 'Partial' }
    }

    const config = statusConfig[status] || statusConfig.DRAFT
    const Icon = config.icon

    return (
      <Badge className={`${config.color} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const downloadPDF = () => {
    window.print()
  }

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view Purchase Orders.</p>
            <Link href="/purchases" className="mt-4 inline-block">
              <Button variant="outline">← Back to Purchases</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Purchase Order...</p>
        </div>
      </div>
    )
  }

  if (!po) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Purchase Order Not Found</h1>
            <p className="text-gray-600">The requested purchase order could not be found.</p>
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
      <header className="bg-white shadow-lg border-b print:hidden">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{po.orderNumber}</h1>
                <p className="text-sm text-gray-600">Purchase Order</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(po.status)}
              <Button variant="outline" onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              {canEdit && (
                <Link href={`/purchases/orders/${po.id}/edit`}>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
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
              {/* Supplier Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Company Name</p>
                    <p className="font-semibold">{po.supplierName}</p>
                  </div>
                  {po.supplierEmail && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{po.supplierEmail}</p>
                    </div>
                  )}
                  {po.supplierPhone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{po.supplierPhone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-semibold">
                        {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expected Delivery</p>
                      <p className="font-semibold">
                        {po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {po.notes && (
                    <div className="pt-2">
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="text-gray-900 whitespace-pre-wrap">{po.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Items ({po.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {po.items.map((item, index) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">Item {index + 1}</p>
                            <p className="text-gray-700 mt-1">{item.description}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-gray-600">Quantity</p>
                            <p className="font-semibold">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">UOM</p>
                            <p className="font-semibold">{item.uom || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Unit Price</p>
                            <p className="font-semibold">{item.currency} {item.unitPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Line Total</p>
                            <p className="font-semibold">{item.currency} {item.lineTotal.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">PO Number:</span>
                      <span className="font-semibold">{po.orderNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span>{getStatusBadge(po.status)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-semibold">{po.items.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span className="font-semibold">
                        {po.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">${po.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-semibold">${po.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Amount:</span>
                      <span className="text-blue-600">${po.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">Created</p>
                    <p className="font-semibold">
                      {new Date(po.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {po.orderDate && (
                    <div>
                      <p className="text-gray-600">Order Date</p>
                      <p className="font-semibold">
                        {new Date(po.orderDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {po.deliveryDate && (
                    <div>
                      <p className="text-gray-600">Expected Delivery</p>
                      <p className="font-semibold">
                        {new Date(po.deliveryDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}
