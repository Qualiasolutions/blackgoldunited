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
  Warehouse,
  Download,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface WarehouseData {
  id: string
  name: string
  code: string
  description?: string
  location: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  capacity?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    product_stock: number
  }
}

export default function WarehousesPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLocation, setFilterLocation] = useState<string>('')
  const [filterActive, setFilterActive] = useState<string>('true')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout>()

  const canManage = hasFullAccess('inventory')
  const canRead = hasModuleAccess('inventory')

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the Inventory module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Initial fetch
  useEffect(() => {
    const fetchWarehouses = async (params: {
      query?: string
      location?: string
      isActive?: string
      page?: number
      limit?: number
    } = {}) => {
      try {
        setLoading(true)
        setError('')

        // Build query string
        const queryParams = new URLSearchParams()
        if (params.query) queryParams.set('query', params.query)
        if (params.location) queryParams.set('location', params.location)
        if (params.isActive) queryParams.set('isActive', params.isActive)
        queryParams.set('page', (params.page || 1).toString())
        queryParams.set('limit', (params.limit || 10).toString())

        const response = await fetch(`/api/inventory/warehouses?${queryParams}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch warehouses')
        }

        const result = await response.json()

        if (result.success) {
          setWarehouses(result.data || [])
          setPagination(result.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
        } else {
          throw new Error(result.error || 'Failed to fetch warehouses')
        }
      } catch (err) {
        console.error('Error fetching warehouses:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch warehouses')
        setWarehouses([])
      } finally {
        setLoading(false)
      }
    }

    fetchWarehouses({
      page: 1,
      limit: pagination.limit,
      isActive: filterActive
    })
  }, [filterActive, pagination.limit])

  // Search with debounce
  useEffect(() => {
    if (searchDebounce) clearTimeout(searchDebounce)

    const timeout = setTimeout(async () => {
      try {
        setLoading(true)
        setError('')

        const queryParams = new URLSearchParams()
        if (searchTerm) queryParams.set('query', searchTerm)
        if (filterLocation) queryParams.set('location', filterLocation)
        if (filterActive) queryParams.set('isActive', filterActive)
        queryParams.set('page', '1')
        queryParams.set('limit', pagination.limit.toString())

        const response = await fetch(`/api/inventory/warehouses?${queryParams}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch warehouses')
        }

        const result = await response.json()

        if (result.success) {
          setWarehouses(result.data || [])
          setPagination(result.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
        } else {
          throw new Error(result.error || 'Failed to fetch warehouses')
        }
      } catch (err) {
        console.error('Error fetching warehouses:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch warehouses')
        setWarehouses([])
      } finally {
        setLoading(false)
      }
    }, 500)

    setSearchDebounce(timeout)

    return () => clearTimeout(timeout)
  }, [searchTerm, filterLocation, pagination.limit])

  const handlePageChange = async (newPage: number) => {
    try {
      setLoading(true)
      setError('')

      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.set('query', searchTerm)
      if (filterLocation) queryParams.set('location', filterLocation)
      if (filterActive) queryParams.set('isActive', filterActive)
      queryParams.set('page', newPage.toString())
      queryParams.set('limit', pagination.limit.toString())

      const response = await fetch(`/api/inventory/warehouses?${queryParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch warehouses')
      }

      const result = await response.json()

      if (result.success) {
        setWarehouses(result.data || [])
        setPagination(result.pagination || { page: newPage, limit: pagination.limit, total: 0, pages: 0 })
      } else {
        throw new Error(result.error || 'Failed to fetch warehouses')
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch warehouses')
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      setError('')

      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.set('query', searchTerm)
      if (filterLocation) queryParams.set('location', filterLocation)
      if (filterActive) queryParams.set('isActive', filterActive)
      queryParams.set('page', pagination.page.toString())
      queryParams.set('limit', pagination.limit.toString())

      const response = await fetch(`/api/inventory/warehouses?${queryParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch warehouses')
      }

      const result = await response.json()

      if (result.success) {
        setWarehouses(result.data || [])
        setPagination(result.pagination || pagination)
      } else {
        throw new Error(result.error || 'Failed to fetch warehouses')
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch warehouses')
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (warehouse: WarehouseData) => {
    return warehouse.isActive
      ? <Badge variant="default">Active</Badge>
      : <Badge variant="secondary">Inactive</Badge>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canManage && (
                <Link href="/inventory/warehouses/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Warehouse
                  </Button>
                </Link>
              )}
              <Link href="/inventory">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Inventory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search warehouses by name, code, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {/* You can populate this dynamically from warehouse locations */}
                      <SelectItem value="Main">Main</SelectItem>
                      <SelectItem value="Secondary">Secondary</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterActive} onValueChange={setFilterActive}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="mb-6 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <Warehouse className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warehouses Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Warehouses</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Showing {warehouses.length} of {pagination.total} warehouses
                  </p>
                </div>
                {canManage && (
                  <Button asChild>
                    <Link href="/inventory/warehouses/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Warehouse
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading warehouses...</span>
                </div>
              ) : warehouses.length === 0 ? (
                <div className="text-center p-8">
                  <Warehouse className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No warehouses found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterLocation
                      ? 'No warehouses match your current filters. Try adjusting your search criteria.'
                      : 'Get started by creating your first warehouse.'}
                  </p>
                  {canManage && (
                    <Button asChild>
                      <Link href="/inventory/warehouses/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Warehouse
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {warehouses.map((warehouse) => (
                    <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {warehouse.name}
                            </h3>
                            <p className="text-sm text-gray-500">{warehouse.code}</p>
                          </div>
                          {getStatusBadge(warehouse)}
                        </div>

                        {warehouse.description && (
                          <p className="text-sm text-gray-600 mb-3 truncate">
                            {warehouse.description}
                          </p>
                        )}

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{warehouse.location}</span>
                          </div>

                          {warehouse.contactPerson && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium mr-2">Contact:</span>
                              <span>{warehouse.contactPerson}</span>
                            </div>
                          )}

                          {warehouse.contactPhone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2" />
                              <span>{warehouse.contactPhone}</span>
                            </div>
                          )}

                          {warehouse.contactEmail && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2" />
                              <span>{warehouse.contactEmail}</span>
                            </div>
                          )}

                          {warehouse._count && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Package className="w-4 h-4 mr-2" />
                              <span>{warehouse._count.product_stock} products</span>
                            </div>
                          )}

                          {warehouse.capacity && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium mr-2">Capacity:</span>
                              <span>{(warehouse.capacity ?? 0).toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-xs text-gray-500">
                            Created: {new Date(warehouse.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/inventory/warehouses/${warehouse.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            {canManage && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/inventory/warehouses/${warehouse.id}/edit`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && warehouses.length > 0 && pagination.pages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}