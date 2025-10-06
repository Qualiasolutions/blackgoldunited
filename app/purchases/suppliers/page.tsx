'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Search,
  Filter,
  Users,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Building,
  RefreshCw,
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

interface Supplier {
  id: string
  supplierCode: string
  name: string
  type: 'INDIVIDUAL' | 'COMPANY'
  category: 'RAW_MATERIALS' | 'SERVICES' | 'EQUIPMENT' | 'CONSUMABLES' | 'OTHER'
  email: string
  phone: string
  website?: string
  address: string
  city: string
  state: string
  country: string
  contactPersonName: string
  contactPersonEmail?: string
  contactPersonPhone?: string
  paymentTerms: 'NET_15' | 'NET_30' | 'NET_45' | 'NET_60' | 'COD' | 'ADVANCE'
  creditLimit: number
  rating: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    purchase_orders: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function SuppliersPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentTermsFilter, setPaymentTermsFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Permission checks
  const canRead = hasModuleAccess('purchase')
  const canManage = hasFullAccess('purchase')

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the Suppliers module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fetchSuppliers = useCallback(async (params: {
    query?: string
    category?: string
    type?: string
    isActive?: string
    paymentTerms?: string
    page?: number
    limit?: number
  } = {}) => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()

      if (params.query) searchParams.set('query', params.query)
      if (params.category) searchParams.set('category', params.category)
      if (params.type) searchParams.set('type', params.type)
      if (params.isActive) searchParams.set('isActive', params.isActive)
      if (params.paymentTerms) searchParams.set('paymentTerms', params.paymentTerms)
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())

      const response = await fetch(`/api/purchases/suppliers?${searchParams}`)
      const result = await response.json()

      if (result.success) {
        setSuppliers(result.data)
        setPagination(result.pagination)
      } else {
        console.error('Failed to fetch suppliers:', result.error)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSuppliers({
      query: searchTerm || undefined,
      category: categoryFilter || undefined,
      type: typeFilter || undefined,
      isActive: statusFilter || undefined,
      paymentTerms: paymentTermsFilter || undefined,
      page: pagination.page,
      limit: pagination.limit
    })
  }, [fetchSuppliers, searchTerm, categoryFilter, typeFilter, statusFilter, paymentTermsFilter, pagination.page, pagination.limit])

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('')
    setTypeFilter('')
    setStatusFilter('')
    setPaymentTermsFilter('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      'RAW_MATERIALS': 'bg-blue-100 text-blue-800',
      'SERVICES': 'bg-green-100 text-green-800',
      'EQUIPMENT': 'bg-purple-100 text-purple-800',
      'CONSUMABLES': 'bg-orange-100 text-orange-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge className={colors[category as keyof typeof colors] || colors.OTHER}>
        {category.replace('_', ' ')}
      </Badge>
    )
  }

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your supplier relationships and procurement partnerships
              </p>
            </div>
            {canManage && (
              <Button asChild>
                <Link href="/purchases/suppliers/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="RAW_MATERIALS">Raw Materials</SelectItem>
                    <SelectItem value="SERVICES">Services</SelectItem>
                    <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                    <SelectItem value="CONSUMABLES">Consumables</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="COMPANY">Company</SelectItem>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Suppliers ({pagination.total})
              </span>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
                <p className="text-gray-500">
                  {searchTerm || categoryFilter || typeFilter || statusFilter
                    ? 'Try adjusting your search criteria'
                    : 'Get started by adding your first supplier'}
                </p>
                {canManage && !searchTerm && !categoryFilter && !typeFilter && !statusFilter && (
                  <Button asChild className="mt-4">
                    <Link href="/purchases/suppliers/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Supplier
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {supplier.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {supplier.supplierCode} • {supplier.type}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(supplier.isActive)}
                            {getCategoryBadge(supplier.category)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {supplier.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {supplier.phone}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {supplier.city}, {supplier.state}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="text-sm">
                              <span className="font-medium">Contact:</span> {supplier.contactPersonName}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Terms:</span> {supplier.paymentTerms.replace('_', ' ')}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Orders:</span> {supplier._count?.purchase_orders || 0}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRatingStars(supplier.rating)}
                          </div>
                        </div>
                      </div>

                      <div className="ml-6 flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/purchases/suppliers/${supplier.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canManage && (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/purchases/suppliers/${supplier.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} suppliers
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = Math.max(1, pagination.page - 2) + i
                    if (page <= pagination.pages) {
                      return (
                        <Button
                          key={page}
                          variant={page === pagination.page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      )
                    }
                    return null
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}