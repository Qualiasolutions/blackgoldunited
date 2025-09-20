'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/ui/stats-card'
import { ModuleCard } from '@/components/ui/module-card'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import {
  Plus,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Quote,
  CreditCard,
  RefreshCw,
  Repeat,
  Settings,
  BarChart3,
  FileCheck,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useSalesStats } from '@/lib/hooks/useSalesStats'
import { cn } from '@/lib/utils'

export default function SalesPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const { stats, loading, error } = useSalesStats()

  if (!hasModuleAccess('sales')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the Sales module.</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canCreate = hasFullAccess('sales')
  const canRead = hasModuleAccess('sales')

  // All sales sub-modules from BGU Portal Layout PDF
  const salesModules = [
    {
      name: 'Invoices',
      key: 'invoices',
      path: '/sales/invoices',
      icon: FileText,
      description: 'Create, manage and track client invoices',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      count: stats?.invoicesCount || 0,
      amount: stats?.invoicesAmount || 0
    },
    {
      name: 'RFQ',
      key: 'rfq',
      path: '/sales/rfq',
      icon: Quote,
      description: 'Request for Quotation management',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      count: stats?.rfqCount || 0,
      amount: stats?.rfqAmount || 0
    },
    {
      name: 'Credit Notes',
      key: 'credit-notes',
      path: '/sales/credit-notes',
      icon: CreditCard,
      description: 'Manage credit notes and refunds',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      count: stats?.creditNotesCount || 0,
      amount: stats?.creditNotesAmount || 0
    },
    {
      name: 'Refunds',
      key: 'refunds',
      path: '/sales/refunds',
      icon: RefreshCw,
      description: 'Process and track customer refunds',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      count: stats?.refundsCount || 0,
      amount: stats?.refundsAmount || 0
    },
    {
      name: 'Recurring',
      key: 'recurring',
      path: '/sales/recurring',
      icon: Repeat,
      description: 'Manage recurring billing and subscriptions',
      color: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
      iconColor: 'text-teal-600',
      bgColor: 'bg-teal-100',
      count: stats?.recurringCount || 0,
      amount: stats?.recurringAmount || 0
    },
    {
      name: 'Payments',
      key: 'payments',
      path: '/sales/payments',
      icon: DollarSign,
      description: 'Track and reconcile customer payments',
      color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      count: stats?.paymentsCount || 0,
      amount: stats?.paymentsAmount || 0
    },
    {
      name: 'Settings',
      key: 'settings',
      path: '/sales/settings',
      icon: Settings,
      description: 'Configure sales module settings',
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-100',
      count: 0,
      amount: 0
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Enhanced Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl opacity-20 blur-sm animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                  Sales Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">Comprehensive sales operations and client relationship management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className={cn(
                "px-3 py-1.5 font-medium transition-all duration-200",
                canCreate
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : canRead
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-red-50 text-red-700 border-red-200"
              )}>
                {canCreate ? '✓ Full Access' : canRead ? '◐ Read Only' : '✗ No Access'}
              </Badge>
              <Link href="/dashboard">
                <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200">
                  ← Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">

          {/* Sales Overview Statistics */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Performance Overview</h2>
              <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Revenue"
                value={loading ? '...' : `$${(stats?.totalRevenue || 0).toLocaleString()}`}
                description="Revenue generated this month"
                icon={DollarSign}
                trend={{
                  value: stats?.revenueGrowth || 0,
                  label: "from last month",
                  isPositive: true
                }}
                colorScheme="blue"
              />

              <StatsCard
                title="Active Clients"
                value={loading ? '...' : stats?.activeClients || 0}
                description={`+${stats?.newClients || 0} new this month`}
                icon={Users}
                colorScheme="green"
              />

              <StatsCard
                title="Pending Invoices"
                value={loading ? '...' : stats?.pendingInvoices || 0}
                description={`$${(stats?.pendingAmount || 0).toLocaleString()} pending`}
                icon={FileText}
                colorScheme="purple"
              />

              <StatsCard
                title="Conversion Rate"
                value={loading ? '...' : `${stats?.conversionRate || 0}%`}
                description="Quote to sale conversion"
                icon={TrendingUp}
                trend={{
                  value: stats?.conversionGrowth || 0,
                  label: "this quarter",
                  isPositive: true
                }}
                colorScheme="orange"
              />
            </div>
          </div>

          {/* Sales Module Navigation */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sales Modules</h2>
              <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {salesModules.map((module) => {
                const hasAccess = hasModuleAccess('sales')
                const canAccessModule = module.key === 'settings' ? hasFullAccess('sales') : hasAccess

                const colorSchemeMap: Record<string, any> = {
                  'invoices': 'blue',
                  'rfq': 'green',
                  'credit-notes': 'purple',
                  'refunds': 'orange',
                  'recurring': 'teal',
                  'payments': 'emerald',
                  'settings': 'amber'
                }

                return (
                  <ModuleCard
                    key={module.key}
                    name={module.name}
                    description={module.description}
                    icon={module.icon}
                    path={module.path}
                    hasAccess={canAccessModule}
                    colorScheme={colorSchemeMap[module.key] || 'blue'}
                    stats={module.count > 0 ? {
                      count: module.count,
                      amount: module.amount,
                      label: 'items'
                    } : undefined}
                  />
                )
              })}
            </div>
          </div>

          {/* Quick Actions for Full Access Users */}
          {canCreate && (
            <div className="mb-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h3>
                <div className="h-1 w-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/sales/invoices/create">
                  <EnhancedCard
                    variant="interactive"
                    colorScheme="green"
                    className="h-full"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-3 rounded-xl">
                        <Plus className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-green-900 text-lg">New Invoice</h4>
                        <p className="text-sm text-green-700">Create client invoice</p>
                      </div>
                    </div>
                  </EnhancedCard>
                </Link>

                <Link href="/sales/rfq/create">
                  <EnhancedCard
                    variant="interactive"
                    colorScheme="blue"
                    className="h-full"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-xl">
                        <Plus className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-blue-900 text-lg">New RFQ</h4>
                        <p className="text-sm text-blue-700">Request quotation</p>
                      </div>
                    </div>
                  </EnhancedCard>
                </Link>

                <Link href="/sales/payments/create">
                  <EnhancedCard
                    variant="interactive"
                    colorScheme="purple"
                    className="h-full"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 p-3 rounded-xl">
                        <Plus className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-purple-900 text-lg">Record Payment</h4>
                        <p className="text-sm text-purple-700">Log client payment</p>
                      </div>
                    </div>
                  </EnhancedCard>
                </Link>

                <Link href="/sales/recurring/create">
                  <EnhancedCard
                    variant="interactive"
                    colorScheme="teal"
                    className="h-full"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-teal-100 p-3 rounded-xl">
                        <Plus className="h-6 w-6 text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-teal-900 text-lg">Setup Recurring</h4>
                        <p className="text-sm text-teal-700">Recurring billing</p>
                      </div>
                    </div>
                  </EnhancedCard>
                </Link>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <EnhancedCard variant="elevated" size="lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Recent Sales Activity</h3>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              </div>
              <Link href="/sales/invoices">
                <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-gray-500">Loading recent activity...</div>
                </div>
              ) : stats && stats.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'invoice' ? 'bg-blue-100' :
                        activity.type === 'payment' ? 'bg-green-100' :
                        activity.type === 'rfq' ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        <FileCheck className={`h-4 w-4 ${
                          activity.type === 'invoice' ? 'text-blue-600' :
                          activity.type === 'payment' ? 'text-green-600' :
                          activity.type === 'rfq' ? 'text-purple-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {activity.amount > 0 && (
                      <div className="text-sm font-semibold">
                        ${activity.amount.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent sales activity</p>
                  {canCreate && (
                    <Link href="/sales/invoices/create" className="mt-2 inline-block">
                      <Button size="sm">Create First Invoice</Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </EnhancedCard>

        </div>
      </main>
    </div>
  )
}