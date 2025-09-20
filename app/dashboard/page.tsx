// Dashboard Page for BlackGoldUnited ERP
'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { hasModuleAccess, hasFullAccess, hasReadOnlyAccess } = usePermissions()

  if (!user) {
    return null // This should be handled by middleware, but just in case
  }

  const modules = [
    {
      name: 'Sales',
      key: 'sales',
      icon: '💰',
      description: 'Manage clients, invoices, and payments',
      path: '/sales'
    },
    {
      name: 'Inventory',
      key: 'inventory',
      icon: '📦',
      description: 'Track products, stock, and warehouses',
      path: '/inventory'
    },
    {
      name: 'Purchase',
      key: 'purchase',
      icon: '🛒',
      description: 'Manage suppliers and purchase orders',
      path: '/purchase'
    },
    {
      name: 'Finance',
      key: 'finance',
      icon: '💳',
      description: 'Financial management and transactions',
      path: '/finance'
    },
    {
      name: 'Accounting',
      key: 'accounting',
      icon: '📊',
      description: 'Chart of accounts and journal entries',
      path: '/accounting'
    },
    {
      name: 'Employees',
      key: 'employees',
      icon: '👥',
      description: 'Employee management and HR',
      path: '/employees'
    },
    {
      name: 'Attendance',
      key: 'attendance',
      icon: '⏰',
      description: 'Track attendance and leave management',
      path: '/attendance'
    },
    {
      name: 'Payroll',
      key: 'payroll',
      icon: '💰',
      description: 'Salary management and payslips',
      path: '/payroll'
    },
    {
      name: 'QHSE',
      key: 'qhse',
      icon: '🛡️',
      description: 'Quality, Health, Safety & Environment',
      path: '/qhse'
    },
    {
      name: 'Settings',
      key: 'settings',
      icon: '⚙️',
      description: 'System configuration and user management',
      path: '/settings'
    }
  ]

  const getAccessBadge = (moduleKey: string) => {
    if (!hasModuleAccess(moduleKey)) {
      return <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">No Access</span>
    }
    if (hasFullAccess(moduleKey)) {
      return <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Full Access</span>
    }
    if (hasReadOnlyAccess(moduleKey)) {
      return <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">Read Only</span>
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-black text-white rounded flex items-center justify-center">
                  <span className="text-sm font-bold">BGU</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  BlackGoldUnited ERP
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user.firstName} {user.lastName}</span>
              </div>
              <div className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                {user.role.replace('_', ' ')}
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
            <p className="text-gray-600">
              Welcome to your BlackGoldUnited ERP dashboard. Access the modules you have permissions for below.
            </p>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const hasAccess = hasModuleAccess(module.key)

              return (
                <div
                  key={module.key}
                  className={`bg-white overflow-hidden shadow rounded-lg ${
                    hasAccess
                      ? 'hover:shadow-md transition-shadow cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {hasAccess ? (
                    <Link href={module.path} className="block p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">{module.icon}</span>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {module.name}
                            </h3>
                            {getAccessBadge(module.key)}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {module.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="text-2xl grayscale">{module.icon}</span>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {module.name}
                            </h3>
                            {getAccessBadge(module.key)}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {module.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* User Role Summary */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Access Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Full Access</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {modules
                    .filter(m => hasFullAccess(m.key))
                    .map(m => <li key={m.key}>• {m.name}</li>)
                  }
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Read Only</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {modules
                    .filter(m => hasReadOnlyAccess(m.key))
                    .map(m => <li key={m.key}>• {m.name}</li>)
                  }
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">No Access</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {modules
                    .filter(m => !hasModuleAccess(m.key))
                    .map(m => <li key={m.key}>• {m.name}</li>)
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}