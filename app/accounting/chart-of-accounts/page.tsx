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
  Layers,
  TrendingUp,
  TrendingDown,
  Lock
} from 'lucide-react'
import Link from 'next/link'

interface Account {
  code: string
  name: string
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  balance: number
}

export default function ChartOfAccountsPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('')

  const canManage = hasFullAccess('accounting')
  const canRead = hasModuleAccess('accounting')

  useEffect(() => {
    if (canRead) {
      fetchAccounts()
    }
  }, [canRead])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/accounting/chart-of-accounts')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch chart of accounts')
      }

      if (result.success && result.data) {
        setAccounts(result.data)
      }
    } catch (error) {
      console.error('Error fetching chart of accounts:', error)
      setError(error instanceof Error ? error.message : 'Failed to load chart of accounts')
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

  // Filter accounts based on search and type
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = !searchTerm ||
      account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || account.type === filterType
    return matchesSearch && matchesType
  })

  const totalAssets = accounts.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + a.balance, 0)
  const totalLiabilities = accounts.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + a.balance, 0)
  const totalEquity = accounts.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + a.balance, 0)
  const totalRevenue = accounts.filter(a => a.type === 'REVENUE').reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canManage && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Account
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
                    <p className="text-2xl font-bold text-green-600">
                      AED {(totalAssets / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Liabilities</p>
                    <p className="text-2xl font-bold text-red-600">
                      AED {(totalLiabilities / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Equity</p>
                    <p className="text-2xl font-bold text-blue-600">
                      AED {(totalEquity / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <Layers className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">
                      AED {(totalRevenue / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="ASSET">Assets</SelectItem>
                    <SelectItem value="LIABILITY">Liabilities</SelectItem>
                    <SelectItem value="EQUITY">Equity</SelectItem>
                    <SelectItem value="REVENUE">Revenue</SelectItem>
                    <SelectItem value="EXPENSE">Expenses</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchAccounts}>
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

          {/* Accounts List */}
          <Card>
            <CardHeader>
              <CardTitle>All Accounts ({filteredAccounts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">{error}</div>
              ) : filteredAccounts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No accounts found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Account Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Account Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Balance
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAccounts.map((account) => (
                        <tr key={account.code} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                            {account.code}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {account.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              account.type === 'ASSET' ? 'default' :
                              account.type === 'LIABILITY' ? 'secondary' :
                              account.type === 'EQUITY' ? 'outline' :
                              account.type === 'REVENUE' ? 'default' :
                              'destructive'
                            }>
                              {account.type}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                            AED {Number(account.balance).toLocaleString()}
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