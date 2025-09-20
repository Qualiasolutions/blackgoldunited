'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

export default function SalesPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess, canPerformAction } = usePermissions()
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
                <p className="text-sm text-gray-600">Manage invoices, quotes, payments and client relationships</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {canCreate ? '🟢 Full Access' : canRead ? '🟡 Read Only' : '🔴 No Access'}
              </Badge>
              <Link href="/dashboard">
                <Button variant="outline">← Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">

          {/* Sales Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  ${loading ? '...' : (stats?.totalRevenue || 0).toLocaleString()}
                </div>
                <p className="text-xs text-blue-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stats?.revenueGrowth || 0}% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Active Clients</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {loading ? '...' : stats?.activeClients || 0}
                </div>
                <p className="text-xs text-green-600">
                  +{stats?.newClients || 0} new this month
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">Pending Invoices</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {loading ? '...' : stats?.pendingInvoices || 0}
                </div>
                <p className="text-xs text-purple-600">
                  ${(stats?.pendingAmount || 0).toLocaleString()} pending
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {loading ? '...' : stats?.conversionRate || 0}%
                </div>
                <p className="text-xs text-orange-600">
                  +{stats?.conversionGrowth || 0}% this quarter
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Module Navigation */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sales Modules</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {salesModules.map((module) => {
                const hasAccess = hasModuleAccess('sales')
                const IconComponent = module.icon
                const canAccessModule = module.key === 'settings' ? hasFullAccess('sales') : hasAccess

                return (
                  <Card
                    key={module.key}
                    className={`${module.color} border-2 transition-all duration-200 ${
                      canAccessModule
                        ? 'hover:shadow-lg hover:scale-105 cursor-pointer'
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {canAccessModule ? (
                      <Link href={module.path} className="block">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 ${module.bgColor} rounded-lg`}>
                                <IconComponent className={`h-6 w-6 ${module.iconColor}`} />
                              </div>
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                {module.name}
                              </CardTitle>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            {module.description}
                          </p>
                          {module.count > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">
                                {module.count} items
                              </span>
                              {module.amount > 0 && (
                                <span className="font-semibold">
                                  ${module.amount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Link>
                    ) : (
                      <div>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 ${module.bgColor} rounded-lg opacity-50`}>
                                <IconComponent className="h-6 w-6 text-gray-400" />
                              </div>
                              <CardTitle className="text-lg font-semibold text-gray-500">
                                {module.name}
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                            {module.description}
                          </p>
                          <Badge variant="destructive" className="text-xs">
                            Access Restricted
                          </Badge>
                        </CardContent>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Quick Actions for Full Access Users */}
          {canCreate && (
            <div className="mb-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
                <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/sales/invoices/create">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Plus className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-800">New Invoice</h4>
                          <p className="text-xs text-green-600">Create client invoice</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/sales/rfq/create">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Plus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-800">New RFQ</h4>
                          <p className="text-xs text-blue-600">Request quotation</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/sales/payments/create">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Plus className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-purple-800">Record Payment</h4>
                          <p className="text-xs text-purple-600">Log client payment</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/sales/recurring/create">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-teal-200 bg-teal-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-teal-100 p-2 rounded-lg">
                          <Plus className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-teal-800">Setup Recurring</h4>
                          <p className="text-xs text-teal-600">Recurring billing</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Sales Activity</h3>
              <Link href="/sales/invoices">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-gray-500">Loading recent activity...</div>
                </div>
              ) : stats?.recentActivity?.length > 0 ? (
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
          </div>

        </div>
      </main>
    </div>
  )
}