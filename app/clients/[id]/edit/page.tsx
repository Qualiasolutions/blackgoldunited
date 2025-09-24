'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft,
  Save,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface ClientEditData {
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
}

export default function EditClientPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState<ClientEditData>({
    clientCode: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    taxNumber: '',
    creditLimit: 0,
    paymentTerms: 30,
    notes: '',
    isActive: true
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})
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

      const client = result.data
      setFormData({
        clientCode: client.clientCode || '',
        companyName: client.companyName || '',
        contactPerson: client.contactPerson || '',
        email: client.email || '',
        phone: client.phone || '',
        mobile: client.mobile || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        postalCode: client.postalCode || '',
        country: client.country || '',
        taxNumber: client.taxNumber || '',
        creditLimit: Number(client.creditLimit) || 0,
        paymentTerms: Number(client.paymentTerms) || 30,
        notes: client.notes || '',
        isActive: client.isActive !== false
      })
    } catch (error) {
      console.error('Error fetching client:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch client')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.clientCode.trim()) {
      newErrors.clientCode = 'Client code is required'
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (formData.creditLimit < 0) {
      newErrors.creditLimit = 'Credit limit cannot be negative'
    }
    if (formData.paymentTerms < 0) {
      newErrors.paymentTerms = 'Payment terms cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveClient = async () => {
    if (!canEdit) return

    // Validate form first
    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      // Prepare client data according to API schema
      const clientData = {
        clientCode: formData.clientCode,
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        mobile: formData.mobile,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        taxNumber: formData.taxNumber,
        creditLimit: Number(formData.creditLimit),
        paymentTerms: Number(formData.paymentTerms),
        notes: formData.notes,
        isActive: formData.isActive
      }

      // Call API endpoint
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        if (response.status === 401) {
          throw new Error('Please log in to update clients')
        } else if (response.status === 403) {
          throw new Error('You don\'t have permission to update clients')
        } else if (response.status === 404) {
          throw new Error('Client not found')
        } else if (response.status === 400) {
          // Validation errors
          if (errorData.details) {
            const newErrors: {[key: string]: string} = {}
            errorData.details.forEach((detail: any) => {
              if (detail.path && detail.path.length > 0) {
                newErrors[detail.path[0]] = detail.message
              }
            })
            setErrors(newErrors)
            return
          } else {
            throw new Error(errorData.error || 'Validation failed')
          }
        } else if (response.status === 409) {
          throw new Error('A client with this email already exists')
        } else {
          throw new Error(errorData.error || 'Failed to update client')
        }
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update client')
      }

      // Success - redirect to clients list or client detail page
      router.push('/clients?updated=true')

    } catch (error) {
      console.error('Error updating client:', error)
      alert(error instanceof Error ? error.message : 'Error updating client. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to edit clients.</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
                <p className="text-sm text-gray-600">Update client information</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={saveClient}
                disabled={saving || !formData.companyName || !formData.clientCode || !formData.email}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Update Client'}
              </Button>
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
                  <div>
                    <Label htmlFor="clientCode">Client Code *</Label>
                    <Input
                      id="clientCode"
                      value={formData.clientCode}
                      onChange={(e) => handleInputChange('clientCode', e.target.value.toUpperCase())}
                      placeholder="CLT001"
                      required
                      className={errors.clientCode ? 'border-red-500' : ''}
                    />
                    {errors.clientCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.clientCode}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Enter company name..."
                      required
                      className={errors.companyName ? 'border-red-500' : ''}
                    />
                    {errors.companyName && (
                      <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      placeholder="Primary contact name..."
                    />
                  </div>
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
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="contact@company.com"
                        required
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      placeholder="+1 (555) 987-6543"
                    />
                  </div>

                  <div>
                    <Label htmlFor="taxNumber">Tax Number / VAT</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber}
                      onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                      placeholder="Tax identification number..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="123 Main Street..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City name..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="State or province..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Country name..."
                    />
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
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Any additional notes about this client..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Business Settings */}
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
                    <Label htmlFor="creditLimit">Credit Limit ($)</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => handleInputChange('creditLimit', Number(e.target.value))}
                      min="0"
                      step="100"
                      placeholder="0"
                      className={errors.creditLimit ? 'border-red-500' : ''}
                    />
                    {errors.creditLimit && (
                      <p className="text-red-500 text-sm mt-1">{errors.creditLimit}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                    <Input
                      id="paymentTerms"
                      type="number"
                      value={formData.paymentTerms}
                      onChange={(e) => handleInputChange('paymentTerms', Number(e.target.value))}
                      min="0"
                      step="1"
                      placeholder="30"
                      className={errors.paymentTerms ? 'border-red-500' : ''}
                    />
                    {errors.paymentTerms && (
                      <p className="text-red-500 text-sm mt-1">{errors.paymentTerms}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Number of days for payment (e.g., 30 for Net 30)</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive">Active Client</Label>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Client Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Code:</span>
                      <span className="font-medium">{formData.clientCode || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium">{formData.companyName || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Email:</span>
                      <span>{formData.email || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Credit Limit:</span>
                      <span>${formData.creditLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Payment Terms:</span>
                      <span>{formData.paymentTerms} days</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Status:</span>
                      <span className={formData.isActive ? 'text-green-600' : 'text-red-600'}>
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help & Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• <strong>Client Code</strong> must be unique (e.g., CLT001)</p>
                    <p>• <strong>Company Name</strong> and <strong>Email</strong> are required</p>
                    <p>• Set appropriate <strong>Credit Limit</strong> to manage risk</p>
                    <p>• <strong>Payment Terms</strong> in days (30 = Net 30)</p>
                    <p>• <strong>Tax Number</strong> is important for compliance</p>
                    <p>• Changes are saved immediately when you click Update</p>
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