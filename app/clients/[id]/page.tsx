'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Edit,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
  Calendar,
  DollarSign,
  FileText,
  Smartphone,
  Hash
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface ClientData {
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
  postalCode: string
  country: string
  taxNumber: string
  creditLimit: number
  paymentTerms: number
  notes: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ClientDetailPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const params = useParams()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [client, setClient] = useState<ClientData | null>(null)

  const canRead = hasModuleAccess('clients')
  const canEdit = hasFullAccess('clients')

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const fetchClient = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view client details')
        } else if (response.status === 403) {
          throw new Error('You don\'t have permission to view this client')
        } else if (response.status === 404) {
          throw new Error('Client not found')
        } else {
          throw new Error(`Failed to fetch client details (${response.status})`)
        }
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch client details')
      }

      setClient(result.data)
    } catch (error) {
      console.error('Error fetching client:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch client')
    } finally {
      setLoading(false)
    }
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

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view client details.</p>
            <Link href="/clients" className="mt-4 inline-block">
              <Button variant="outline">← Back to Clients</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Loading Client</h1>
            <p className="text-gray-600">Please wait while we fetch the client details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Client</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-2">
              <Button onClick={fetchClient} variant="outline">
                Try Again
              </Button>
              <Link href="/clients">
                <Button variant="outline">← Back to Clients</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Client Not Found</h1>
            <p className="text-gray-600">The requested client could not be found.</p>
            <Link href="/clients" className="mt-4 inline-block">
              <Button variant="outline">← Back to Clients</Button>
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
              <Link href="/clients">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Clients
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{client.companyName}</h1>
                <p className="text-sm text-gray-600">Client Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(client.isActive)}
              {canEdit && (
                <Link href={`/clients/${client.id}/edit`}>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Client
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

            {/* Left Column - Main Information */}
            <div className="lg:col-span-2 space-y-6">

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Client Code</label>
                      <div className="mt-1 flex items-center">
                        <Hash className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {client.clientCode}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Company Name</label>
                      <div className="mt-1">
                        <span className="text-sm text-gray-900">{client.companyName}</span>
                      </div>
                    </div>
                  </div>

                  {client.contactPerson && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Contact Person</label>
                      <div className="mt-1">
                        <span className="text-sm text-gray-900">{client.contactPerson}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <div className="mt-1 flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                          {client.email}
                        </a>
                      </div>
                    </div>
                    {client.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <div className="mt-1 flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <a href={`tel:${client.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                            {client.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {client.mobile && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Mobile</label>
                      <div className="mt-1 flex items-center">
                        <Smartphone className="h-4 w-4 text-gray-400 mr-2" />
                        <a href={`tel:${client.mobile}`} className="text-sm text-blue-600 hover:text-blue-800">
                          {client.mobile}
                        </a>
                      </div>
                    </div>
                  )}

                  {client.taxNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tax Number / VAT</label>
                      <div className="mt-1">
                        <span className="text-sm text-gray-900 font-mono">{client.taxNumber}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address Information */}
              {(client.address || client.city || client.state || client.country || client.postalCode) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {client.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Street Address</label>
                        <div className="mt-1">
                          <span className="text-sm text-gray-900">{client.address}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {client.city && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">City</label>
                          <div className="mt-1">
                            <span className="text-sm text-gray-900">{client.city}</span>
                          </div>
                        </div>
                      )}
                      {client.state && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">State/Province</label>
                          <div className="mt-1">
                            <span className="text-sm text-gray-900">{client.state}</span>
                          </div>
                        </div>
                      )}
                      {client.postalCode && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Postal Code</label>
                          <div className="mt-1">
                            <span className="text-sm text-gray-900">{client.postalCode}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {client.country && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Country</label>
                        <div className="mt-1">
                          <span className="text-sm text-gray-900">{client.country}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Additional Information */}
              {client.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notes</label>
                      <div className="mt-1">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{client.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Business Settings & Summary */}
            <div className="space-y-6">

              {/* Business Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Business Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Credit Limit</label>
                    <div className="mt-1 flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-semibold">
                        ${client.creditLimit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Payment Terms</label>
                    <div className="mt-1">
                      <span className="text-sm text-gray-900">
                        {client.paymentTerms} days
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(client.isActive)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <div className="mt-1">
                      <span className="text-sm text-gray-900">
                        {new Date(client.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <div className="mt-1">
                      <span className="text-sm text-gray-900">
                        {new Date(client.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canEdit && (
                    <Link href={`/clients/${client.id}/edit`} className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Client
                      </Button>
                    </Link>
                  )}

                  <a href={`mailto:${client.email}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                  </a>

                  {client.phone && (
                    <a href={`tel:${client.phone}`} className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Phone
                      </Button>
                    </a>
                  )}

                  {client.mobile && (
                    <a href={`tel:${client.mobile}`} className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Call Mobile
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}