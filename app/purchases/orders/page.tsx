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
  ShoppingCart,
  Eye,
  Edit,
  Check,
  X,
  Clock,
  Package,
  Truck,
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign,
  RefreshCw,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

interface PurchaseOrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  description?: string
  receivedQuantity: number
  product: {
    id: string
    name: string
    productCode: string
    unit: string
  }
}

interface PurchaseOrder {
  id: string
  poNumber: string
  orderDate: string
  expectedDeliveryDate: string
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  requiresApproval: boolean
  subtotal: number
  taxAmount: number
  totalAmount: number
  shippingCost: number
  discountAmount: number
  supplier: {
    id: string
    name: string
    supplierCode: string
    email: string
    phone: string
  }
  items: PurchaseOrderItem[]
  itemsCount: number
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function PurchaseOrdersPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
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
            <p className="text-gray-600">You don't have permission to access Purchase Orders.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fetchOrders = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...params
      })

      if (searchTerm) searchParams.set('query', searchTerm)
      if (statusFilter) searchParams.set('status', statusFilter)
      if (priorityFilter) searchParams.set('priority', priorityFilter)
      if (approvalFilter) searchParams.set('approvalStatus', approvalFilter)
      if (supplierFilter) searchParams.set('supplierId', supplierFilter)

      const response = await fetch(`/api/purchases/orders?${searchParams}`)
      const result = await response.json()

      if (result.success) {
        setOrders(result.data)
        setPagination(result.pagination)
      } else {
        console.error('Failed to fetch purchase orders:', result.error)
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, priorityFilter, approvalFilter, supplierFilter, pagination.page, pagination.limit])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchOrders()
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setPriorityFilter('')
    setApprovalFilter('')
    setSupplierFilter('')
    setPagination(prev => ({ ...prev, page: 1 }))
    setTimeout(() => fetchOrders(), 100)
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', icon: FileText },
      'SENT': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'CONFIRMED': { color: 'bg-green-100 text-green-800', icon: Check },
      'PARTIALLY_RECEIVED': { color: 'bg-yellow-100 text-yellow-800', icon: Package },
      'RECEIVED': { color: 'bg-emerald-100 text-emerald-800', icon: Check },
      'CANCELLED': { color: 'bg-red-100 text-red-800', icon: X }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
    const IconComponent = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'LOW': 'bg-gray-100 text-gray-800',
      'MEDIUM': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.MEDIUM}>
        {priority}
      </Badge>
    )
  }

  const getApprovalBadge = (status: string, required: boolean) => {
    if (!required) {
      return <Badge className="bg-green-100 text-green-800">No Approval Required</Badge>
    }

    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.PENDING}>
        {status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage purchase orders and track procurement progress
              </p>
            </div>
            {canManage && (
              <Button asChild>
                <Link href="/purchases/orders/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Purchase Order
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
                    placeholder="Search purchase orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Priorities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Approval Filter */}
              <div>
                <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Approval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Approvals</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
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

        {/* Purchase Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Purchase Orders ({pagination.total})
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
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter || priorityFilter || approvalFilter
                    ? 'Try adjusting your search criteria'
                    : 'Get started by creating your first purchase order'}
                </p>
                {canManage && !searchTerm && !statusFilter && !priorityFilter && !approvalFilter && (
                  <Button asChild className="mt-4">
                    <Link href="/purchases/orders/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Purchase Order
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.poNumber}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {order.supplier.name} ({order.supplier.supplierCode})
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(order.status)}
                            {getPriorityBadge(order.priority)}
                            {getApprovalBadge(order.approvalStatus, order.requiresApproval)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Order: {formatDate(order.orderDate)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Truck className="h-4 w-4 mr-2" />
                            Expected: {formatDate(order.expectedDeliveryDate)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Package className="h-4 w-4 mr-2" />
                            Items: {order.itemsCount}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Total: {formatCurrency(order.totalAmount)}
                          </div>
                        </div>

                        {/* Progress for received orders */}
                        {['PARTIALLY_RECEIVED', 'RECEIVED'].includes(order.status) && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                              <span>Delivery Progress</span>
                              <span>
                                {order.items.reduce((sum, item) => sum + item.receivedQuantity, 0)} / {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(100, (order.items.reduce((sum, item) => sum + item.receivedQuantity, 0) / order.items.reduce((sum, item) => sum + item.quantity, 0)) * 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Overdue warning */}
                        {order.status !== 'CANCELLED' && order.status !== 'RECEIVED' &&
                         new Date(order.expectedDeliveryDate) < new Date() && (
                          <div className="flex items-center text-sm text-red-600 mb-2">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Overdue by {Math.floor((new Date().getTime() - new Date(order.expectedDeliveryDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </div>
                        )}
                      </div>

                      <div className="ml-6 flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/purchases/orders/${order.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canManage && ['DRAFT', 'SENT'].includes(order.status) && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/purchases/orders/${order.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {canManage && order.approvalStatus === 'PENDING' && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/purchases/orders/${order.id}/approve`}>
                              <Check className="h-4 w-4" />
                            </Link>
                          </Button>
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
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
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