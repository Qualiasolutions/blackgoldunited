'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Filter,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ArrowLeft,
  Download,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CreditNote {
  id: string
  creditNoteNumber: string
  clientId: string
  clientName: string
  invoiceId?: string
  invoiceNumber?: string
  reason: string
  amount: number
  status: 'DRAFT' | 'ISSUED' | 'APPLIED' | 'CANCELLED'
  issueDate: string
  createdAt: string
  updatedAt: string
}

export default function CreditNotesPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const canCreate = hasFullAccess('sales')
  const canRead = hasModuleAccess('sales')

  useEffect(() => {
    fetchCreditNotes()
  }, [])

  const fetchCreditNotes = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('credit_notes')
        .select(`
          id,
          credit_note_number,
          client_id,
          invoice_id,
          reason,
          amount,
          status,
          issue_date,
          created_at,
          updated_at,
          clients:client_id (
            company_name
          ),
          invoices:invoice_id (
            invoice_number
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedCreditNotes = (data || []).map(item => ({
        id: item.id,
        creditNoteNumber: item.credit_note_number || `CN-${item.id.slice(-6)}`,
        clientId: item.client_id,
        clientName: (item.clients as any)?.company_name || 'Unknown Client',
        invoiceId: item.invoice_id,
        invoiceNumber: (item.invoices as any)?.invoice_number || '',
        reason: item.reason || '',
        amount: Number(item.amount) || 0,
        status: item.status || 'DRAFT',
        issueDate: item.issue_date || '',
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))

      setCreditNotes(formattedCreditNotes)
    } catch (error) {
      console.error('Error fetching credit notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-700', icon: Clock },
      ISSUED: { color: 'bg-blue-100 text-blue-700', icon: FileText },
      APPLIED: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-100 text-red-700', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
    const IconComponent = config.icon

    return (
      <Badge className={`${config.color} text-xs flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const filteredCreditNotes = creditNotes.filter(cn => {
    const matchesSearch = cn.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cn.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cn.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cn.invoiceNumber && cn.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = filterStatus === '' || cn.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const totalAmount = creditNotes.reduce((sum, cn) => sum + cn.amount, 0)
  const issuedAmount = creditNotes
    .filter(cn => cn.status === 'ISSUED' || cn.status === 'APPLIED')
    .reduce((sum, cn) => sum + cn.amount, 0)

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CreditCard className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access Credit Notes.</p>
            <Link href="/sales" className="mt-4 inline-block">
              <Button variant="outline">← Back to Sales</Button>
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
              <Link href="/sales">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Sales
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Credit Notes</h1>
                <p className="text-sm text-gray-600">Manage customer credit notes and refunds</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {canCreate ? '🟢 Full Access' : '🟡 Read Only'}
              </Badge>
              {canCreate && (
                <Link href="/sales/credit-notes/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Credit Note
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

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-800">Total Credit Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{creditNotes.length}</div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-800">Issued</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {creditNotes.filter(cn => cn.status === 'ISSUED').length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-800">Applied</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {creditNotes.filter(cn => cn.status === 'APPLIED').length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-emerald-800">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900">
                  ${(totalAmount ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-emerald-600">
                  ${(issuedAmount ?? 0).toLocaleString()} issued
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search credit notes by number, client, reason, or invoice..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ISSUED">Issued</option>
                    <option value="APPLIED">Applied</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Notes List */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Notes ({filteredCreditNotes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-gray-500">Loading credit notes...</div>
                </div>
              ) : filteredCreditNotes.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Credit Notes Found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus ? 'No credit notes match your search criteria.' : 'Get started by creating your first credit note.'}
                  </p>
                  {canCreate && !searchTerm && !filterStatus && (
                    <Link href="/sales/credit-notes/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Credit Note
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCreditNotes.map((creditNote) => (
                    <div key={creditNote.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{creditNote.creditNoteNumber}</h3>
                            {getStatusBadge(creditNote.status)}
                            <div className="text-lg font-bold text-green-600">
                              ${(creditNote.amount ?? 0).toLocaleString()}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                            <div>
                              <strong>Client:</strong> {creditNote.clientName}
                            </div>
                            {creditNote.invoiceNumber && (
                              <div>
                                <strong>Invoice:</strong> {creditNote.invoiceNumber}
                              </div>
                            )}
                          </div>

                          {creditNote.reason && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Reason:</strong> {creditNote.reason}
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Created: {new Date(creditNote.createdAt).toLocaleDateString()}</span>
                            {creditNote.issueDate && (
                              <span>Issued: {new Date(creditNote.issueDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Link href={`/sales/credit-notes/${creditNote.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>

                          {canCreate && (
                            <>
                              <Link href={`/sales/credit-notes/${creditNote.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>

                              {creditNote.status === 'DRAFT' && (
                                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Issue
                                </Button>
                              )}

                              <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}