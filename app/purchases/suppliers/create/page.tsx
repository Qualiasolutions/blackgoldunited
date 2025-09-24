'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Loader2, Building, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface SupplierFormData {
  supplierCode: string
  name: string
  type: 'INDIVIDUAL' | 'COMPANY'
  category: 'RAW_MATERIALS' | 'SERVICES' | 'EQUIPMENT' | 'CONSUMABLES' | 'OTHER'
  email: string
  phone: string
  website: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  taxId: string
  registrationNumber: string
  industry: string
  paymentTerms: 'NET_15' | 'NET_30' | 'NET_45' | 'NET_60' | 'COD' | 'ADVANCE'
  creditLimit: number
  currency: string
  contactPersonName: string
  contactPersonTitle: string
  contactPersonEmail: string
  contactPersonPhone: string
  rating: number
  isActive: boolean
  notes: string
}

export default function CreateSupplierPage() {
  const router = useRouter()
  const { hasFullAccess } = usePermissions()

  const [formData, setFormData] = useState<SupplierFormData>({
    supplierCode: '',
    name: '',
    type: 'COMPANY',
    category: 'RAW_MATERIALS',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'United States',
    postalCode: '',
    taxId: '',
    registrationNumber: '',
    industry: '',
    paymentTerms: 'NET_30',
    creditLimit: 0,
    currency: 'USD',
    contactPersonName: '',
    contactPersonTitle: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    rating: 3,
    isActive: true,
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const canCreate = hasFullAccess('purchase')

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to create suppliers.</p>
            <Button asChild className="mt-4">
              <Link href="/purchases/suppliers">Back to Suppliers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) errors.name = 'Supplier name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format'
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'
    if (!formData.address.trim()) errors.address = 'Address is required'
    if (!formData.city.trim()) errors.city = 'City is required'
    if (!formData.state.trim()) errors.state = 'State is required'
    if (!formData.country.trim()) errors.country = 'Country is required'
    if (!formData.postalCode.trim()) errors.postalCode = 'Postal code is required'
    if (!formData.contactPersonName.trim()) errors.contactPersonName = 'Contact person name is required'
    if (formData.creditLimit < 0) errors.creditLimit = 'Credit limit cannot be negative'
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) errors.website = 'Invalid website URL'

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/purchases/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        router.push('/purchases/suppliers')
      } else {
        setError(result.error || 'Failed to create supplier')
        if (result.details) {
          const fieldErrors: Record<string, string> = {}
          result.details.forEach((detail: any) => {
            fieldErrors[detail.path[0]] = detail.message
          })
          setValidationErrors(fieldErrors)
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof SupplierFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/purchases/suppliers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Supplier</h1>
              <p className="mt-1 text-sm text-gray-500">
                Add a new supplier to your procurement network
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="supplierCode">Supplier Code (Optional)</Label>
                  <Input
                    id="supplierCode"
                    value={formData.supplierCode}
                    onChange={(e) => handleInputChange('supplierCode', e.target.value)}
                    placeholder="Auto-generated if empty"
                    className={validationErrors.supplierCode ? 'border-red-500' : ''}
                  />
                  {validationErrors.supplierCode && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.supplierCode}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="name">Supplier Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Company or individual name"
                    className={validationErrors.name ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Supplier Type</Label>
                  <Select value={formData.type} onValueChange={(value: 'INDIVIDUAL' | 'COMPANY') => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPANY">Company</SelectItem>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value: any) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RAW_MATERIALS">Raw Materials</SelectItem>
                      <SelectItem value="SERVICES">Services</SelectItem>
                      <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                      <SelectItem value="CONSUMABLES">Consumables</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="e.g. Manufacturing, Technology"
                  />
                </div>

                <div>
                  <Label htmlFor="rating">Initial Rating</Label>
                  <Select value={formData.rating.toString()} onValueChange={(value) => handleInputChange('rating', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Star</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active supplier</Label>
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="supplier@example.com"
                    className={validationErrors.email ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={validationErrors.phone ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://supplier-website.com"
                    className={validationErrors.website ? 'border-red-500' : ''}
                  />
                  {validationErrors.website && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.website}</p>
                  )}
                </div>
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Street address"
                    className={validationErrors.address ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.address && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.address}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                    className={validationErrors.city ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.city && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.city}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="State or Province"
                    className={validationErrors.state ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.state && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.state}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Country"
                    className={validationErrors.country ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.country && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.country}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="ZIP/Postal Code"
                    className={validationErrors.postalCode ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.postalCode && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.postalCode}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Person */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Primary Contact Person
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contactPersonName">Contact Name *</Label>
                  <Input
                    id="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                    placeholder="Contact person full name"
                    className={validationErrors.contactPersonName ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.contactPersonName && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.contactPersonName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactPersonTitle">Title</Label>
                  <Input
                    id="contactPersonTitle"
                    value={formData.contactPersonTitle}
                    onChange={(e) => handleInputChange('contactPersonTitle', e.target.value)}
                    placeholder="Job title or position"
                  />
                </div>

                <div>
                  <Label htmlFor="contactPersonEmail">Contact Email</Label>
                  <Input
                    id="contactPersonEmail"
                    type="email"
                    value={formData.contactPersonEmail}
                    onChange={(e) => handleInputChange('contactPersonEmail', e.target.value)}
                    placeholder="contact@supplier.com"
                  />
                </div>

                <div>
                  <Label htmlFor="contactPersonPhone">Contact Phone</Label>
                  <Input
                    id="contactPersonPhone"
                    value={formData.contactPersonPhone}
                    onChange={(e) => handleInputChange('contactPersonPhone', e.target.value)}
                    placeholder="Direct phone number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business & Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Business & Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    placeholder="Tax identification number"
                  />
                </div>

                <div>
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    placeholder="Business registration number"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={formData.paymentTerms} onValueChange={(value: any) => handleInputChange('paymentTerms', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NET_15">Net 15 days</SelectItem>
                      <SelectItem value="NET_30">Net 30 days</SelectItem>
                      <SelectItem value="NET_45">Net 45 days</SelectItem>
                      <SelectItem value="NET_60">Net 60 days</SelectItem>
                      <SelectItem value="COD">Cash on Delivery</SelectItem>
                      <SelectItem value="ADVANCE">Advance Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={validationErrors.creditLimit ? 'border-red-500' : ''}
                  />
                  {validationErrors.creditLimit && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.creditLimit}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes about the supplier..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/purchases/suppliers">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Supplier
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}