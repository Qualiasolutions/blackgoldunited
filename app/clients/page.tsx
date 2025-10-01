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
  Users,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building,
  ArrowLeft,
  UserCheck,
  UserX,
  Calendar,
  DollarSign,
  FileText,
  Star,
  User,
  Landmark,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Client {
  id: string
  clientCode: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  mobile: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  taxNumber: string
  creditLimit: number
  paymentTerms: number
  isActive: boolean
  notes: string
  createdAt: string
  updatedAt: string
  // UI-only fields (will be calculated from relationships in future)
  industry: string
  clientType: 'INDIVIDUAL' | 'CORPORATE' | 'GOVERNMENT' | 'NON_PROFIT'
  totalInvoiced: number
  totalPaid: number
  outstandingBalance: number
  lastInvoiceDate?: string | null
}

export default function ClientsPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const canCreate = hasFullAccess('clients')
  const canRead = hasModuleAccess('clients')

  useEffect(() => {
    fetchClients()
  }, [])

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      fetchClients({
        query: searchTerm || undefined,
        status: filterStatus || undefined
      })
    }, 300)

    setSearchTimeout(timeout)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [searchTerm, filterStatus])

  const fetchClients = async (params: { query?: string; status?: string } = {}) => {
    try {
      setLoading(true)
      setError('')

      // Build query parameters
      const searchParams = new URLSearchParams()
      if (params.query) searchParams.append('query', params.query)
      if (params.status) searchParams.append('status', params.status)

      const url = `/api/clients${searchParams.toString() ? '?' + searchParams.toString() : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view clients')
        } else if (response.status === 403) {
          throw new Error('You don\'t have permission to view clients')
        } else {
          throw new Error(`Failed to fetch clients (${response.status})`)
        }
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch clients')
      }

      const formattedClients = (result.data || []).map((client: any) => ({
        id: client.id,
        clientCode: client.client_code || '',
        companyName: client.company_name || '',
        contactPerson: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || '',
        mobile: client.mobile || '',
        address: client.address_line_1 || '',
        city: client.city || '',
        state: client.state || '',
        country: client.country || '',
        postalCode: client.postal_code || '',
        taxNumber: client.tax_number || '',
        creditLimit: Number(client.credit_limit) || 0,
        paymentTerms: Number(client.payment_terms) || 0,
        isActive: client.is_active !== false,
        notes: client.notes || '',
        createdAt: client.created_at,
        updatedAt: client.updated_at,
        // Derived fields for UI display
        industry: 'General', // Default since we don't have this field yet
        clientType: 'CORPORATE', // Default since we don't have this field yet
        totalInvoiced: 0, // Will be calculated from invoices in future
        totalPaid: 0, // Will be calculated from payments in future
        outstandingBalance: 0, // Will be calculated in future
        lastInvoiceDate: null // Will come from invoice relationships in future
      }))

      setClients(formattedClients)
    } catch (error) {
      console.error('Error fetching clients:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch clients')
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const getClientTypeBadge = (type: string) => {
    const typeConfig = {
      INDIVIDUAL: { color: 'bg-blue-100 text-blue-700', icon: User },
      CORPORATE: { color: 'bg-green-100 text-green-700', icon: Building },
      GOVERNMENT: { color: 'bg-purple-100 text-purple-700', icon: Landmark },
      NON_PROFIT: { color: 'bg-orange-100 text-orange-700', icon: Heart }
    }

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.CORPORATE
    const IconComponent = config.icon

    return (
      <Badge className={`${config.color} text-xs flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={`text-xs flex items-center gap-1 ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  // Filter by client type (front-end only since API doesn't support this yet)
  const filteredClients = clients.filter(client => {
    const matchesType = filterType === '' || client.clientType === filterType
    return matchesType
  })

  const totalClients = clients.length
  const activeClients = clients.filter(c => c.isActive).length
  const totalRevenue = clients.reduce((sum, c) => sum + c.totalPaid, 0)
  const outstanding = clients.reduce((sum, c) => sum + c.outstandingBalance, 0)

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access Client management.</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button variant="outline">← Back to Dashboard</Button>
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
                <p className="text-sm text-gray-600">Manage customer relationships and contacts</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {canCreate ? '🟢 Full Access' : '🟡 Read Only'}
              </Badge>
              {canCreate && (
                <Link href="/clients/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Client
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
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Total Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{totalClients}</div>
                <p className="text-xs text-blue-600">{activeClients} active</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Active Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{activeClients}</div>
                <p className="text-xs text-green-600">
                  {totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-emerald-800 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900">
                  ${(totalRevenue ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-emerald-600">Total collected</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  ${(outstanding ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-orange-600">Pending payments</p>
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
                      placeholder="Search clients by name, contact, email, or industry..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="GOVERNMENT">Government</option>
                    <option value="NON_PROFIT">Non-Profit</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchClients({
                      query: searchTerm || undefined,
                      status: filterStatus || undefined
                    })}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clients List */}
          <Card>
            <CardHeader>
              <CardTitle>Clients ({filteredClients.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Clients</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => fetchClients()} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : loading ? (
                <div className="space-y-4">
                  {/* Loading skeleton */}
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="animate-pulse">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="h-6 bg-gray-200 rounded w-48"></div>
                          <div className="h-5 bg-gray-200 rounded w-16"></div>
                          <div className="h-5 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-4 bg-gray-200 rounded w-40"></div>
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-64 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-96"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterType || filterStatus ? 'No clients match your search criteria.' : 'Get started by adding your first client.'}
                  </p>
                  {searchTerm || filterType || filterStatus ? (
                    <Button onClick={() => {
                      setSearchTerm('')
                      setFilterType('')
                      setFilterStatus('')
                      fetchClients()
                    }} variant="outline">
                      Clear Filters
                    </Button>
                  ) : canCreate && (
                    <Link href="/clients/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Client
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClients.map((client) => (
                    <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 text-lg">{client.companyName}</h3>
                            {getStatusBadge(client.isActive)}
                            {getClientTypeBadge(client.clientType)}
                            {client.outstandingBalance > 0 && (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Outstanding: ${(client.outstandingBalance ?? 0).toLocaleString()}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <UserCheck className="h-4 w-4 mr-2 text-gray-400" />
                              <span><strong>Contact:</strong> {client.contactPerson || 'N/A'}</span>
                            </div>
                            {client.email && (
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>

                          {(client.address || client.city || client.country) && (
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              <span>
                                {[client.address, client.city, client.country].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center space-x-6 text-xs text-gray-500">
                            <span>Joined: {new Date(client.createdAt).toLocaleDateString()}</span>
                            {client.industry && <span>Industry: {client.industry}</span>}
                            <span>Total Paid: ${(client.totalPaid ?? 0).toLocaleString()}</span>
                            {client.lastInvoiceDate && (
                              <span>Last Invoice: {new Date(client.lastInvoiceDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Link href={`/clients/${client.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>

                          {canCreate && (
                            <>
                              <Link href={`/clients/${client.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>

                              {client.email && (
                                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                                  <Mail className="h-4 w-4 mr-1" />
                                  Email
                                </Button>
                              )}
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