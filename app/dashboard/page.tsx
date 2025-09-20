// Dashboard Page for BlackGoldUnited ERP
'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import RealtimeStats from '@/components/dashboard/realtime-stats'
import { RealtimeNotificationSystem } from '@/components/realtime/notification-system'
import { RealtimeActivityFeed } from '@/components/realtime/activity-feed'
import {
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Calculator,
  UserCheck,
  Building,
  Clock,
  CreditCard,
  FileText,
  PieChart,
  Shield,
  Settings,
  Home,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { hasModuleAccess, hasFullAccess, hasReadOnlyAccess } = usePermissions()

  if (!user) {
    return null // This should be handled by middleware, but just in case
  }

  // All 14 modules from BGU Portal Layout PDF with exact structure
  const modules = [
    {
      name: 'Sales',
      key: 'sales',
      icon: BarChart3,
      description: 'Invoices, RFQ, Credit Notes, Refunds, Recurring, Payments',
      path: '/sales',
      category: 'Revenue Management',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      name: 'Clients',
      key: 'clients',
      icon: Users,
      description: 'Client management, contacts, and relationship tracking',
      path: '/clients',
      category: 'Customer Relations',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      name: 'Inventory',
      key: 'inventory',
      icon: Package,
      description: 'Products, Requisitions, Pricing, Warehouses, Stock',
      path: '/inventory',
      category: 'Supply Chain',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      name: 'Purchase',
      key: 'purchase',
      icon: ShoppingCart,
      description: 'Purchase orders, invoices, suppliers, payments',
      path: '/purchase',
      category: 'Procurement',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    },
    {
      name: 'Finance',
      key: 'finance',
      icon: DollarSign,
      description: 'Expenses, incomes, bank accounts, financial tracking',
      path: '/finance',
      category: 'Financial Management',
      color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
    },
    {
      name: 'Accounting',
      key: 'accounting',
      icon: Calculator,
      description: 'Journal entries, chart of accounts, cost centers, assets',
      path: '/accounting',
      category: 'Financial Management',
      color: 'bg-teal-50 border-teal-200 hover:bg-teal-100'
    },
    {
      name: 'Employees',
      key: 'employees',
      icon: UserCheck,
      description: 'Employee profiles, roles, and HR management',
      path: '/employees',
      category: 'Human Resources',
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
    },
    {
      name: 'Organizational',
      key: 'organizational',
      icon: Building,
      description: 'Designations, departments, levels, employment types',
      path: '/organizational',
      category: 'Human Resources',
      color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100'
    },
    {
      name: 'Attendance',
      key: 'attendance',
      icon: Clock,
      description: 'Logs, days, sheets, permissions, leaves, shifts',
      path: '/attendance',
      category: 'Workforce Management',
      color: 'bg-pink-50 border-pink-200 hover:bg-pink-100'
    },
    {
      name: 'Payroll',
      key: 'payroll',
      icon: CreditCard,
      description: 'Contracts, pay runs, slips, loans, components',
      path: '/payroll',
      category: 'Workforce Management',
      color: 'bg-rose-50 border-rose-200 hover:bg-rose-100'
    },
    {
      name: 'Reports',
      key: 'reports',
      icon: PieChart,
      description: 'Sales, purchase, accounting, employee, client reports',
      path: '/reports',
      category: 'Analytics',
      color: 'bg-amber-50 border-amber-200 hover:bg-amber-100'
    },
    {
      name: 'Templates',
      key: 'templates',
      icon: FileText,
      description: 'Printable, prefilled, terms, files, reminders',
      path: '/templates',
      category: 'Document Management',
      color: 'bg-lime-50 border-lime-200 hover:bg-lime-100'
    },
    {
      name: 'QHSE',
      key: 'qhse',
      icon: Shield,
      description: 'Quality, Health, Safety & Environment management',
      path: '/qhse',
      category: 'Compliance',
      color: 'bg-red-50 border-red-200 hover:bg-red-100'
    },
    {
      name: 'Settings',
      key: 'settings',
      icon: Settings,
      description: 'Account, general settings, system configuration',
      path: '/settings',
      category: 'Administration',
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100'
    }
  ]

  // Group modules by category for better organization
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = []
    }
    acc[module.category].push(module)
    return acc
  }, {} as Record<string, typeof modules>)

  const getAccessBadge = (moduleKey: string) => {
    if (!hasModuleAccess(moduleKey)) {
      return (
        <Badge variant="destructive" className="text-xs flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          No Access
        </Badge>
      )
    }
    if (hasFullAccess(moduleKey)) {
      return (
        <Badge variant="default" className="text-xs bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Full Access
        </Badge>
      )
    }
    if (hasReadOnlyAccess(moduleKey)) {
      return (
        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 flex items-center gap-1">
          <Eye className="h-3 w-3" />
          Read Only
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <header className="bg-white shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black rounded-xl flex items-center justify-center shadow-lg">
                  <Building className="h-6 w-6" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold text-gray-900">
                  BlackGoldUnited
                </h1>
                <p className="text-sm text-gray-600">Enterprise Resource Planning</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">BGU</h1>
              </div>
            </div>

            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="hidden md:block text-sm text-gray-700">
                <span className="text-gray-500">Welcome,</span>
                <span className="font-semibold ml-1">{user.firstName} {user.lastName}</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hidden sm:flex">
                {user.role.replace('_', ' ')}
              </Badge>
              <RealtimeNotificationSystem />
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <span className="hidden sm:inline">Sign out</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Modern Welcome Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl shadow-lg p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="h-16 w-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Home className="h-8 w-8 text-black" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Welcome to your BGU Dashboard
                  </h2>
                  <p className="text-gray-600 text-sm lg:text-base mb-3">
                    Access all 14 ERP modules based on your role permissions. Manage your business operations efficiently with real-time insights.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {modules.filter(m => hasFullAccess(m.key)).length} Full Access
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Eye className="h-3 w-3 mr-1" />
                      {modules.filter(m => hasReadOnlyAccess(m.key)).length} Read Only
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Statistics */}
          <div className="mb-8">
            <RealtimeStats />
          </div>

          {/* Real-time Activity Feed */}
          <div className="mb-8">
            <RealtimeActivityFeed />
          </div>

          {/* Modern Module Categories */}
          <div className="space-y-10">
            {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
              <div key={category}>
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900">{category}</h3>
                    <Badge className="bg-gray-100 text-gray-600 text-xs">
                      {categoryModules.length} modules
                    </Badge>
                  </div>
                  <div className="h-1.5 w-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-sm"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                  {categoryModules.map((module) => {
                    const hasAccess = hasModuleAccess(module.key)
                    const IconComponent = module.icon

                    return (
                      <Card
                        key={module.key}
                        className={`${module.color} border-2 transition-all duration-300 ${
                          hasAccess
                            ? 'hover:shadow-xl hover:scale-[1.02] cursor-pointer transform'
                            : 'opacity-60 cursor-not-allowed'
                        } rounded-xl`}
                      >
                        {hasAccess ? (
                          <Link href={module.path} className="block h-full">
                            <CardHeader className="pb-3">
                              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2.5 bg-white/90 rounded-xl shadow-sm">
                                    <IconComponent className="h-6 w-6 text-gray-700" />
                                  </div>
                                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                                    {module.name}
                                  </CardTitle>
                                </div>
                                <div className="flex justify-start sm:justify-end">
                                  {getAccessBadge(module.key)}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                                {module.description}
                              </p>
                            </CardContent>
                          </Link>
                        ) : (
                          <div className="h-full">
                            <CardHeader className="pb-3">
                              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2.5 bg-white/70 rounded-xl opacity-50">
                                    <IconComponent className="h-6 w-6 text-gray-400" />
                                  </div>
                                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-500">
                                    {module.name}
                                  </CardTitle>
                                </div>
                                <div className="flex justify-start sm:justify-end">
                                  {getAccessBadge(module.key)}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                                {module.description}
                              </p>
                            </CardContent>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Modern Access Control Summary */}
          <div className="mt-12 bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-lg border border-gray-200 p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Access Control Summary</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-green-800 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Full Access ({modules.filter(m => hasFullAccess(m.key)).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {modules
                      .filter(m => hasFullAccess(m.key))
                      .map(m => (
                        <div key={m.key} className="text-sm text-green-700">
                          • {m.name}
                        </div>
                      ))
                    }
                    {modules.filter(m => hasFullAccess(m.key)).length === 0 && (
                      <div className="text-sm text-green-600 italic">No modules with full access</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-yellow-800 flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Read-Only Access ({modules.filter(m => hasReadOnlyAccess(m.key)).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {modules
                      .filter(m => hasReadOnlyAccess(m.key))
                      .map(m => (
                        <div key={m.key} className="text-sm text-yellow-700">
                          • {m.name}
                        </div>
                      ))
                    }
                    {modules.filter(m => hasReadOnlyAccess(m.key)).length === 0 && (
                      <div className="text-sm text-yellow-600 italic">No modules with read-only access</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-red-800 flex items-center">
                    🔴 No Access ({modules.filter(m => !hasModuleAccess(m.key)).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {modules
                      .filter(m => !hasModuleAccess(m.key))
                      .map(m => (
                        <div key={m.key} className="text-sm text-red-700">
                          • {m.name}
                        </div>
                      ))
                    }
                    {modules.filter(m => !hasModuleAccess(m.key)).length === 0 && (
                      <div className="text-sm text-red-600 italic">No restricted modules</div>
                    )}
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