'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import { useDashboardActivity } from '@/lib/hooks/useDashboardActivity'
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch'
import Link from 'next/link'
import { useState } from 'react'
import {
  Search,
  Plus,
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  ArrowRight,
  Bell,
  Settings,
  Filter,
  RefreshCw,
  AlertCircle,
  Loader2,
  Package,
  ShoppingCart,
  Building2,
  ExternalLink
} from 'lucide-react'
import { StatsCard } from '@/components/ui/stats-card'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/layout/main-layout'

export default function DashboardPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const { stats, loading, error, refreshStats, lastUpdated } = useDashboardStats()
  const { data: activityData, loading: activityLoading, error: activityError } = useDashboardActivity()
  const { results: searchResults, loading: searchLoading, query: searchQuery, setQuery: setSearchQuery, clearSearch } = useGlobalSearch()

  if (!user) {
    return null
  }

  // Format current date like in the screenshot
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  // Utility functions
  const formatCurrency = (amount: number) => {
    return `AED ${Math.abs(amount).toLocaleString()}`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'invoice_payment':
        return FileText
      case 'purchase_order':
        return ShoppingCart
      case 'expense':
        return DollarSign
      default:
        return FileText
    }
  }

  const getActivityIcon = (module: string) => {
    switch (module) {
      case 'clients':
        return Users
      case 'sales':
        return TrendingUp
      case 'purchase':
        return ShoppingCart
      case 'inventory':
        return Package
      case 'finance':
        return BarChart3
      default:
        return FileText
    }
  }

  const getSearchResultIcon = (type: string) => {
    switch (type) {
      case 'client':
        return Users
      case 'invoice':
        return FileText
      case 'product':
        return Package
      case 'purchase_order':
        return ShoppingCart
      case 'supplier':
        return Building2
      default:
        return FileText
    }
  }

  return (
    <MainLayout user={{ name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role }}>
      <div className="bg-background min-h-full space-y-6">
        {/* Executive Dashboard Header */}
        <div className="mb-8">
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  Welcome back, {user.firstName}
                </h1>
                <p className="text-muted-foreground">
                  {currentDate} • Executive Dashboard Overview
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-success rounded-full"></div>
                    <span className="text-sm font-medium text-success">Operational</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">{formatTimeAgo(lastUpdated)}</p>
                    <Button variant="ghost" size="sm" onClick={refreshStats} disabled={loading}>
                      <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </>
          ) : error ? (
            <div className="col-span-4">
              <EnhancedCard className="p-6 bg-red-50 border-red-200">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                  <Button variant="outline" size="sm" onClick={refreshStats}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </EnhancedCard>
            </div>
          ) : (
            <>
              <StatsCard
                title="Total Revenue"
                value={`AED ${(stats?.totalRevenue?.value || 0).toLocaleString()}`}
                description="This Month"
                icon={TrendingUp}
                trend={{
                  value: stats?.totalRevenue?.change?.value || 0,
                  label: "from last month",
                  isPositive: stats?.totalRevenue?.change?.isPositive ?? true
                }}
                colorScheme="green"
              />
              <StatsCard
                title="Active Clients"
                value={(stats?.activeClients?.value || 0).toLocaleString()}
                description="Total Active"
                icon={Users}
                trend={{
                  value: stats?.activeClients?.change?.value || 0,
                  label: "from last month",
                  isPositive: stats?.activeClients?.change?.isPositive ?? true
                }}
                colorScheme="blue"
              />
              <StatsCard
                title="Products in Stock"
                value={(stats?.productsInStock?.value || 0).toLocaleString()}
                description="Available Products"
                icon={Package}
                trend={{
                  value: stats?.productsInStock?.change?.value || 0,
                  label: "from last month",
                  isPositive: stats?.productsInStock?.change?.isPositive ?? true
                }}
                colorScheme="orange"
              />
              <StatsCard
                title="Pending Orders"
                value={(stats?.pendingOrders?.value || 0).toLocaleString()}
                description="Awaiting Processing"
                icon={ShoppingCart}
                trend={{
                  value: stats?.pendingOrders?.change?.value || 0,
                  label: "from last month",
                  isPositive: stats?.pendingOrders?.change?.isPositive ?? false
                }}
                colorScheme="emerald"
              />
            </>
          )}
        </div>

        {/* Executive Search Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Global Search</h3>
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Search invoices, clients, orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto border rounded-lg bg-background">
                  <div className="p-2 border-b bg-muted/50">
                    <p className="text-xs font-medium text-muted-foreground">
                      Found {searchResults.length} results
                    </p>
                  </div>
                  {searchResults.map((result) => {
                    const IconComponent = getSearchResultIcon(result.type)

                    return (
                      <Link key={result.id} href={result.href}>
                        <div className="flex items-center space-x-3 p-3 hover:bg-accent transition-colors cursor-pointer">
                          <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Badge variant="outline" className="text-xs">{result.module}</Badge>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !searchLoading && (
                <div className="p-4 text-center text-muted-foreground border rounded-lg">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No results found for "{searchQuery}"</p>
                </div>
              )}

              {!searchQuery && (
                <Button className="w-full" size="sm" disabled>
                  Search All Modules
                </Button>
              )}
            </div>
          </EnhancedCard>

          <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
                <FileText className="h-4 w-4 mb-1" />
                <span className="text-xs">New Invoice</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
                <Users className="h-4 w-4 mb-1" />
                <span className="text-xs">Add Client</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
                <BarChart3 className="h-4 w-4 mb-1" />
                <span className="text-xs">View Reports</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
                <Settings className="h-4 w-4 mb-1" />
                <span className="text-xs">Settings</span>
              </Button>
            </div>
          </EnhancedCard>
        </div>

        {/* Executive Module Access Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Link href="/sales">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Sales</span>
              </div>
            </EnhancedCard>
          </Link>

          <Link href="/clients">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Clients</span>
              </div>
            </EnhancedCard>
          </Link>

          <Link href="/inventory">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Inventory</span>
              </div>
            </EnhancedCard>
          </Link>

          <Link href="/purchase">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Purchase</span>
              </div>
            </EnhancedCard>
          </Link>

          <Link href="/finance">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Finance</span>
              </div>
            </EnhancedCard>
          </Link>

          <Link href="/reports">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <PieChart className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Reports</span>
              </div>
            </EnhancedCard>
          </Link>
        </div>

        {/* Executive Analytics & Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Financial Overview */}
          <div className="lg:col-span-2">
            <EnhancedCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Financial Overview</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    This Month
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                  </Button>
                </div>
              </div>
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Analytics Dashboard</p>
                  <p className="text-xs text-muted-foreground mt-1">Revenue trends and forecasting</p>
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Business Insights */}
          <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Business Insights</h3>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Invoice Processing</span>
                  <span className="font-medium">98.2%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '98.2%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Client Satisfaction</span>
                  <span className="font-medium">94.7%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: '94.7%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">System Uptime</span>
                  <span className="font-medium">99.9%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '99.9%' }}></div>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </div>

        {/* Recent Transactions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {activityLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gray-300 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                        </div>
                        <div className="w-20 h-4 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : activityError ? (
                <div className="p-4 text-center text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Failed to load transactions</p>
                </div>
              ) : !activityData?.recentTransactions?.length ? (
                <div className="p-4 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No recent transactions</p>
                </div>
              ) : (
                activityData.recentTransactions.slice(0, 3).map((transaction) => {
                  const IconComponent = getTransactionIcon(transaction.type)
                  const isPositive = transaction.amount > 0

                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{transaction.title}</p>
                          <p className="text-xs text-muted-foreground">{transaction.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(transaction.created_at)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </EnhancedCard>

          <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">System Activity</h3>
              <Button variant="ghost" size="sm">View Logs</Button>
            </div>
            <div className="space-y-3">
              {activityLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gray-300 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : activityError ? (
                <div className="p-4 text-center text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Failed to load activity</p>
                </div>
              ) : !activityData?.systemActivity?.length ? (
                <div className="p-4 text-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                activityData.systemActivity.slice(0, 3).map((activity) => {
                  const IconComponent = getActivityIcon(activity.module)

                  return (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        activity.type === 'success' ? 'bg-green-100 text-green-600' :
                        activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        activity.type === 'error' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</p>
                          <span className="text-xs font-medium text-muted-foreground capitalize">{activity.module}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </EnhancedCard>
        </div>
      </div>
    </MainLayout>
  )
}