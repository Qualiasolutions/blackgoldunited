'use client'

import { useEffect, useState } from 'react'
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
  Download,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
  Package,
  DollarSign,
  TrendingDown,
  Lock
} from 'lucide-react'
import Link from 'next/link'

interface FixedAsset {
  id: string
  asset_code: string
  asset_name: string
  category: string
  purchase_date: string
  purchase_cost: number
  depreciation_method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE'
  useful_life_years: number
  salvage_value: number
  accumulated_depreciation: number
  current_value: number
  location: string
  status: 'ACTIVE' | 'DISPOSED' | 'SOLD'
  created_at: string
}

export default function AssetsPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [assets, setAssets] = useState<FixedAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const canManage = hasFullAccess('accounting')
  const canRead = hasModuleAccess('accounting')

  useEffect(() => {
    if (canRead) {
      fetchAssets()
    }
  }, [canRead])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (searchTerm) params.set('query', searchTerm)
      if (filterStatus) params.set('status', filterStatus)

      const response = await fetch(`/api/accounting/assets?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch fixed assets')
      }

      if (result.success && result.data) {
        setAssets(result.data)
      }
    } catch (error) {
      console.error('Error fetching fixed assets:', error)
      setError(error instanceof Error ? error.message : 'Failed to load fixed assets')
    } finally {
      setLoading(false)
    }
  }

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access Accounting module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalCost = assets.reduce((sum, asset) => sum + Number(asset.purchase_cost), 0)
  const totalCurrentValue = assets.reduce((sum, asset) => sum + Number(asset.current_value), 0)
  const totalDepreciation = assets.reduce((sum, asset) => sum + Number(asset.accumulated_depreciation), 0)
  const activeCount = assets.filter(a => a.status === 'ACTIVE').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Fixed Assets</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canManage && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Asset
                </Button>
              )}
              <Link href="/accounting">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Assets</p>
                    <p className="text-2xl font-bold">{assets.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Purchase Cost</p>
                    <p className="text-2xl font-bold text-green-600">
                      AED {(totalCost / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Value</p>
                    <p className="text-2xl font-bold text-blue-600">
                      AED {(totalCurrentValue / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Depreciation</p>
                    <p className="text-2xl font-bold text-red-600">
                      AED {(totalDepreciation / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DISPOSED">Disposed</SelectItem>
                    <SelectItem value="SOLD">Sold</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchAssets}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assets List */}
          <Card>
            <CardHeader>
              <CardTitle>All Fixed Assets</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">{error}</div>
              ) : assets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No fixed assets found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Asset Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Asset Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Purchase Cost
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Current Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                            {asset.asset_code}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {asset.asset_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                            AED {Number(asset.purchase_cost).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                            AED {Number(asset.current_value).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              asset.status === 'ACTIVE' ? 'default' :
                              asset.status === 'DISPOSED' ? 'secondary' :
                              'destructive'
                            }>
                              {asset.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canManage && (
                                <>
                                  <Button size="sm" variant="ghost">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}