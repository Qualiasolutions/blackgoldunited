"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  ChevronDown,
  ChevronRight,
  Home,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Calculator,
  UserCheck,
  Building2,
  Clock,
  CreditCard,
  FileText,
  Shield,
  Settings,
  Menu,
  X,
  BarChart3,
  FolderOpen,
  Archive,
  UserCog
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/lib/hooks/useAuth'

// Icon mapping
const iconMap = {
  Home,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Calculator,
  UserCheck,
  Building2,
  Clock,
  CreditCard,
  FileText,
  Shield,
  Settings,
  BarChart3,
  FolderOpen,
  Archive,
  UserCog
}

// BGU Portal Navigation Structure (based on screenshots)
const bguNavigationModules = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'Home',
    href: '/dashboard',
    subModules: []
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: 'TrendingUp',
    href: '/sales',
    subModules: [
      { id: 'manage-invoices', title: 'Manage Invoices', href: '/sales/invoices' },
      { id: 'create-invoice', title: 'Create Invoice', href: '/sales/invoices/create' },
      { id: 'manage-estimates', title: 'Manage Estimates', href: '/sales/rfq' },
      { id: 'create-estimate', title: 'Create Estimate', href: '/sales/rfq/create' },
      { id: 'credit-notes', title: 'Credit Notes', href: '/sales/credit-notes' },
      { id: 'refund-receipts', title: 'Refund Receipts', href: '/sales/refunds' },
      { id: 'recurring-invoices', title: 'Recurring Invoices', href: '/sales/recurring' },
      { id: 'client-payments', title: 'Client Payments', href: '/sales/payments' },
      { id: 'sales-settings', title: 'Sales Settings', href: '/sales/settings' }
    ]
  },
  {
    id: 'clients',
    title: 'Clients',
    icon: 'Users',
    href: '/clients',
    subModules: [
      { id: 'manage-clients', title: 'Manage Clients', href: '/clients' },
      { id: 'create-client', title: 'Create Client', href: '/clients/create' },
      { id: 'client-contracts', title: 'Client Contracts', href: '/clients/contracts' }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: 'Package',
    href: '/inventory',
    subModules: [
      { id: 'manage-inventory', title: 'Manage Inventory', href: '/inventory' },
      { id: 'add-product', title: 'Add Product', href: '/inventory/create' },
      { id: 'stock-movements', title: 'Stock Movements', href: '/inventory/movements' },
      { id: 'inventory-reports', title: 'Inventory Reports', href: '/inventory/reports' }
    ]
  },
  {
    id: 'purchases',
    title: 'Purchases',
    icon: 'ShoppingCart',
    href: '/purchases',
    subModules: [
      { id: 'purchase-orders', title: 'Purchase Orders', href: '/purchases/orders' },
      { id: 'create-po', title: 'Create Purchase Order', href: '/purchases/orders/create' },
      { id: 'suppliers', title: 'Suppliers', href: '/purchases/suppliers' },
      { id: 'purchase-requests', title: 'Purchase Requests', href: '/purchases/requests' }
    ]
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: 'DollarSign',
    href: '/finance',
    subModules: [
      { id: 'budgets', title: 'Budgets', href: '/finance/budgets' },
      { id: 'cash-flow', title: 'Cash Flow', href: '/finance/cash-flow' },
      { id: 'financial-reports', title: 'Financial Reports', href: '/finance/reports' }
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting',
    icon: 'Calculator',
    href: '/accounting',
    subModules: [
      { id: 'chart-accounts', title: 'Chart of Accounts', href: '/accounting/chart' },
      { id: 'journal-entries', title: 'Journal Entries', href: '/accounting/journal' },
      { id: 'trial-balance', title: 'Trial Balance', href: '/accounting/trial-balance' }
    ]
  },
  {
    id: 'employees',
    title: 'Employees',
    icon: 'UserCheck',
    href: '/employees',
    subModules: [
      { id: 'employee-list', title: 'Employee List', href: '/employees' },
      { id: 'add-employee', title: 'Add Employee', href: '/employees/create' },
      { id: 'employee-records', title: 'Employee Records', href: '/employees/records' }
    ]
  },
  {
    id: 'organizational-structure',
    title: 'Organizational Structure',
    icon: 'Building2',
    href: '/organization',
    subModules: [
      { id: 'org-chart', title: 'Organization Chart', href: '/organization/chart' },
      { id: 'departments', title: 'Departments', href: '/organization/departments' },
      { id: 'positions', title: 'Positions', href: '/organization/positions' }
    ]
  },
  {
    id: 'attendance',
    title: 'Attendance',
    icon: 'Clock',
    href: '/attendance',
    subModules: [
      { id: 'time-tracking', title: 'Time Tracking', href: '/attendance/tracking' },
      { id: 'leave-management', title: 'Leave Management', href: '/attendance/leave' },
      { id: 'attendance-reports', title: 'Attendance Reports', href: '/attendance/reports' }
    ]
  },
  {
    id: 'payroll',
    title: 'Payroll',
    icon: 'CreditCard',
    href: '/payroll',
    subModules: [
      { id: 'salary-processing', title: 'Salary Processing', href: '/payroll/processing' },
      { id: 'payslips', title: 'Payslips', href: '/payroll/payslips' },
      { id: 'payroll-reports', title: 'Payroll Reports', href: '/payroll/reports' }
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: 'BarChart3',
    href: '/reports',
    subModules: [
      { id: 'sales-reports', title: 'Sales Reports', href: '/reports/sales' },
      { id: 'financial-reports', title: 'Financial Reports', href: '/reports/financial' },
      { id: 'custom-reports', title: 'Custom Reports', href: '/reports/custom' }
    ]
  },
  {
    id: 'templates',
    title: 'Templates',
    icon: 'FileText',
    href: '/templates',
    subModules: [
      { id: 'invoice-templates', title: 'Invoice Templates', href: '/templates/invoices' },
      { id: 'document-templates', title: 'Document Templates', href: '/templates/documents' },
      { id: 'email-templates', title: 'Email Templates', href: '/templates/emails' }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'Settings',
    href: '/settings',
    subModules: [
      { id: 'general-settings', title: 'General Settings', href: '/settings/general' },
      { id: 'user-management', title: 'User Management', href: '/settings/users' },
      { id: 'system-settings', title: 'System Settings', href: '/settings/system' }
    ]
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(['sales']) // Default expand sales
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const isModuleExpanded = (moduleId: string) => expandedModules.includes(moduleId)
  
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      {/* Enhanced Header with BGU Logo */}
      <div className="flex h-20 items-center border-b border-gray-200 px-6 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Image
              src="/united-logo-white.webp"
              alt="BlackGoldUnited"
              width={40}
              height={40}
              className="rounded-lg"
              priority
            />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-white">BlackGoldUnited</h1>
            <p className="text-xs text-blue-100">ERP Portal</p>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {/* Module Navigation */}
          {bguNavigationModules.map((module) => {
            const IconComponent = iconMap[module.icon as keyof typeof iconMap]
            const expanded = isModuleExpanded(module.id)
            const moduleActive = isActive(module.href)
            const hasSubModules = module.subModules.length > 0

            return (
              <div key={module.id} className="space-y-1">
                {hasSubModules ? (
                  <button
                    onClick={() => toggleModule(module.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      moduleActive
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      {IconComponent && (
                        <IconComponent className={cn(
                          "h-5 w-5",
                          moduleActive ? "text-blue-600" : "text-gray-500"
                        )} />
                      )}
                      <span className="font-medium">{module.title}</span>
                    </div>
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                ) : (
                  <Link href={module.href}>
                    <div className={cn(
                      "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      moduleActive
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}>
                      {IconComponent && (
                        <IconComponent className={cn(
                          "h-5 w-5",
                          moduleActive ? "text-blue-600" : "text-gray-500"
                        )} />
                      )}
                      <span className="font-medium">{module.title}</span>
                    </div>
                  </Link>
                )}

                {/* Enhanced Submenu */}
                {expanded && hasSubModules && (
                  <div className="ml-8 space-y-1 border-l border-gray-200 pl-4 py-2">
                    {module.subModules.map((subModule) => (
                      <Link key={subModule.id} href={subModule.href}>
                        <div className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm transition-all duration-200",
                          isActive(subModule.href)
                            ? "bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-500"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}>
                          <span>{subModule.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Enhanced Footer with User Info */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        {user && (
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          </div>
        )}
        <div className="text-xs text-gray-500 text-center">
          BGU Portal v2.0
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/80 lg:hidden" 
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-full w-80 bg-background border-r lg:hidden">
            <SidebarContent />
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex h-full w-80 flex-col border-r bg-background",
        className
      )}>
        <SidebarContent />
      </div>
    </>
  )
}