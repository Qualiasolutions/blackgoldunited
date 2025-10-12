'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Download,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  DollarSign,
  Package,
  Trash2,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'

interface RFQItem {
  id: string
  description: string
  quantity: number
  uom: string | null
  unitPrice: number
  currency: string
  lineTotal: number
}

interface RFQ {
  id: string
  quotationNumber: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  title: string
  description: string
  issueDate: string
  validUntil: string
  status: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  termsAndConditions: string
  notes: string
  createdAt: string
  items: RFQItem[]
}

export default function RFQDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [rfq, setRfq] = useState<RFQ | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const canEdit = hasFullAccess('sales')
  const canRead = hasModuleAccess('sales')

  useEffect(() => {
    if (params.id) {
      fetchRFQ(params.id as string)
    }
  }, [params.id])

  const fetchRFQ = async (id: string) => {
    try {
      const supabase = createClient()

      // Fetch RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single()

      if (rfqError) throw rfqError

      // Fetch client
      const { data: clientData } = await supabase
        .from('clients')
        .select('company_name, email, phone')
        .eq('id', rfqData.client_id)
        .single()

      // Fetch items
      const { data: itemsData } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', id)
        .order('created_at')

      const formattedRFQ: RFQ = {
        id: rfqData.id,
        quotationNumber: rfqData.quotation_number,
        clientId: rfqData.client_id,
        clientName: clientData?.company_name || 'Unknown Client',
        clientEmail: clientData?.email || '',
        clientPhone: clientData?.phone || '',
        title: rfqData.title || 'Untitled RFQ',
        description: rfqData.description || '',
        issueDate: rfqData.issue_date,
        validUntil: rfqData.valid_until,
        status: rfqData.status,
        subtotal: Number(rfqData.subtotal) || 0,
        taxAmount: Number(rfqData.tax_amount) || 0,
        totalAmount: Number(rfqData.total_amount) || 0,
        termsAndConditions: rfqData.terms_and_conditions || '',
        notes: rfqData.notes || '',
        createdAt: rfqData.created_at,
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

      setRfq(formattedRFQ)
    } catch (error) {
      console.error('Error fetching RFQ:', error)
      alert('Error loading RFQ. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText, label: 'Draft' },
      SENT: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Send, label: 'Sent' },
      RESPONDED: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, label: 'Responded' },
      ACCEPTED: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, label: 'Accepted' },
      REJECTED: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: 'Rejected' },
      EXPIRED: { color: 'bg-gray-100 text-gray-600 border-gray-300', icon: Clock, label: 'Expired' }
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

  const handleDelete = async () => {
    if (!rfq) return

    if (!confirm(`Are you sure you want to delete RFQ ${rfq.quotationNumber}? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/sales/quotations/${rfq.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Redirect back to RFQ list
        router.push('/sales/rfq')
      } else {
        alert(`Failed to delete RFQ: ${result.error}`)
        setDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting RFQ:', error)
      alert('An error occurred while deleting the RFQ')
      setDeleting(false)
    }
  }

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view RFQs.</p>
            <Link href="/sales" className="mt-4 inline-block">
              <Button variant="outline">← Back to Sales</Button>
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
          <p className="text-gray-600">Loading RFQ...</p>
        </div>
      </div>
    )
  }

  if (!rfq) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">RFQ Not Found</h1>
            <p className="text-gray-600">The requested RFQ could not be found.</p>
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
      <header className="bg-white shadow-lg border-b print:hidden">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{rfq.quotationNumber}</h1>
                <p className="text-sm text-gray-600">{rfq.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(rfq.status)}
              <Button variant="outline" onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              {canEdit && (
                <>
                  <Link href={`/sales/rfq/${rfq.id}/edit`}>
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </>
              )}
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
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Company Name</p>
                    <p className="font-semibold">{rfq.clientName}</p>
                  </div>
                  {rfq.clientEmail && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{rfq.clientEmail}</p>
                    </div>
                  )}
                  {rfq.clientPhone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{rfq.clientPhone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* RFQ Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    RFQ Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="font-semibold">{rfq.title}</p>
                  </div>
                  {rfq.description && (
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="text-gray-900">{rfq.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm text-gray-600">Issue Date</p>
                      <p className="font-semibold">
                        {rfq.issueDate ? new Date(rfq.issueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valid Until</p>
                      <p className="font-semibold">
                        {rfq.validUntil ? new Date(rfq.validUntil).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Items ({rfq.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rfq.items.map((item, index) => (
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

              {/* Terms and Notes */}
              {(rfq.termsAndConditions || rfq.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rfq.termsAndConditions && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Terms & Conditions</p>
                        <p className="text-gray-600 whitespace-pre-wrap">{rfq.termsAndConditions}</p>
                      </div>
                    )}
                    {rfq.notes && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Internal Notes</p>
                        <p className="text-gray-600 whitespace-pre-wrap">{rfq.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    RFQ Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">RFQ Number:</span>
                      <span className="font-semibold">{rfq.quotationNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span>{getStatusBadge(rfq.status)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-semibold">{rfq.items.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span className="font-semibold">
                        {rfq.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">${rfq.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-semibold">${rfq.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Amount:</span>
                      <span className="text-blue-600">${rfq.totalAmount.toFixed(2)}</span>
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
                      {new Date(rfq.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {rfq.issueDate && (
                    <div>
                      <p className="text-gray-600">Issued</p>
                      <p className="font-semibold">
                        {new Date(rfq.issueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {rfq.validUntil && (
                    <div>
                      <p className="text-gray-600">Valid Until</p>
                      <p className="font-semibold">
                        {new Date(rfq.validUntil).toLocaleDateString('en-US', {
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
