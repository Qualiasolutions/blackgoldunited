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
  Quote,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ArrowLeft,
  Download,
  Mail
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RFQ {
  id: string
  rfqNumber: string
  clientId: string
  clientName: string
  title: string
  description: string
  status: 'DRAFT' | 'SENT' | 'RESPONDED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  validUntil: string
  totalAmount: number
  createdAt: string
  updatedAt: string
}

export default function RFQPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess, canPerformAction } = usePermissions()
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const canCreate = hasFullAccess('sales')
  const canRead = hasModuleAccess('sales')

  useEffect(() => {
    fetchRFQs()
  }, [])

  const fetchRFQs = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          id,
          quotationNumber,
          clientId,
          title,
          description,
          status,
          validUntil,
          totalAmount,
          createdAt,
          updatedAt,
          clients:clientId (
            companyName
          )
        `)
        .eq('deletedAt', null)
        .order('createdAt', { ascending: false })

      if (error) throw error

      const formattedRFQs = (data || []).map(item => ({
        id: item.id,
        rfqNumber: item.quotationNumber || `RFQ-${item.id.slice(-6)}`,
        clientId: item.clientId,
        clientName: item.clients?.companyName || 'Unknown Client',
        title: item.title || 'Untitled RFQ',
        description: item.description || '',
        status: item.status || 'DRAFT',
        validUntil: item.validUntil || '',
        totalAmount: Number(item.totalAmount) || 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))

      setRfqs(formattedRFQs)
    } catch (error) {
      console.error('Error fetching RFQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-700', icon: Clock },
      SENT: { color: 'bg-blue-100 text-blue-700', icon: Send },
      RESPONDED: { color: 'bg-yellow-100 text-yellow-700', icon: FileText },
      ACCEPTED: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle },
      EXPIRED: { color: 'bg-orange-100 text-orange-700', icon: Clock }
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

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.title.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === '' || rfq.status === filterStatus

    return matchesSearch && matchesFilter
  })

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Quote className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access RFQ management.</p>
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
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Quote className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Request for Quotation</h1>
                <p className="text-sm text-gray-600">Manage and track quotation requests</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {canCreate ? '🟢 Full Access' : '🟡 Read Only'}
              </Badge>
              {canCreate && (
                <Link href="/sales/rfq/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New RFQ
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
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-800">Total RFQs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{rfqs.length}</div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-800">Sent RFQs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {rfqs.filter(r => r.status === 'SENT').length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-800">Responded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">
                  {rfqs.filter(r => r.status === 'RESPONDED').length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-800">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  ${rfqs.reduce((sum, r) => sum + r.totalAmount, 0).toLocaleString()}
                </div>
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
                      placeholder="Search RFQs by number, client, or title..."
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
                    <option value="SENT">Sent</option>
                    <option value="RESPONDED">Responded</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="EXPIRED">Expired</option>
                  </select>

                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RFQ List */}
          <Card>
            <CardHeader>
              <CardTitle>RFQ List ({filteredRFQs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-gray-500">Loading RFQs...</div>
                </div>
              ) : filteredRFQs.length === 0 ? (
                <div className="text-center py-12">
                  <Quote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No RFQs Found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus ? 'No RFQs match your search criteria.' : 'Get started by creating your first RFQ.'}
                  </p>
                  {canCreate && !searchTerm && !filterStatus && (
                    <Link href="/sales/rfq/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First RFQ
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRFQs.map((rfq) => (
                    <div key={rfq.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{rfq.rfqNumber}</h3>
                            {getStatusBadge(rfq.status)}
                            {rfq.validUntil && new Date(rfq.validUntil) < new Date() && (
                              <Badge className="bg-red-100 text-red-700 text-xs">
                                Expired
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Client:</strong> {rfq.clientName}
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Title:</strong> {rfq.title}
                          </div>

                          {rfq.description && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Description:</strong> {rfq.description.slice(0, 100)}
                              {rfq.description.length > 100 && '...'}
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Created: {new Date(rfq.createdAt).toLocaleDateString()}</span>
                            {rfq.validUntil && (
                              <span>Valid Until: {new Date(rfq.validUntil).toLocaleDateString()}</span>
                            )}
                            <span>Amount: ${rfq.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Link href={`/sales/rfq/${rfq.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>

                          {canCreate && (
                            <>
                              <Link href={`/sales/rfq/${rfq.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>

                              {rfq.status === 'DRAFT' && (
                                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                                  <Send className="h-4 w-4 mr-1" />
                                  Send
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