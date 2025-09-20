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
    <div className="flex h-full flex-col bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Enhanced Navigation - No Header (unified with main header) */}
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
                      "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group",
                      moduleActive
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg border-l-4 border-orange-300"
                        : "text-gray-300 hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-orange-600/20 hover:text-white hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      {IconComponent && (
                        <IconComponent className={cn(
                          "h-5 w-5 transition-colors duration-300",
                          moduleActive ? "text-white" : "text-orange-400 group-hover:text-white"
                        )} />
                      )}
                      <span className="font-semibold tracking-wide">{module.title}</span>
                    </div>
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-orange-200" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-orange-200" />
                    )}
                  </button>
                ) : (
                  <Link href={module.href}>
                    <div className={cn(
                      "flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group",
                      moduleActive
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg border-l-4 border-orange-300"
                        : "text-gray-300 hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-orange-600/20 hover:text-white hover:shadow-md"
                    )}>
                      {IconComponent && (
                        <IconComponent className={cn(
                          "h-5 w-5 transition-colors duration-300",
                          moduleActive ? "text-white" : "text-orange-400 group-hover:text-white"
                        )} />
                      )}
                      <span className="font-semibold tracking-wide">{module.title}</span>
                    </div>
                  </Link>
                )}

                {/* Enhanced Submenu with Orange Theme */}
                {expanded && hasSubModules && (
                  <div className="ml-6 space-y-1 border-l-2 border-orange-600/30 pl-4 py-2 bg-black/20 rounded-lg mr-2">
                    {module.subModules.map((subModule) => (
                      <Link key={subModule.id} href={subModule.href}>
                        <div className={cn(
                          "flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-300 group",
                          isActive(subModule.href)
                            ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold shadow-md border-r-3 border-orange-300"
                            : "text-gray-400 hover:bg-orange-500/10 hover:text-orange-200 hover:border-r-2 hover:border-orange-400"
                        )}>
                          <span className="font-medium tracking-wide">{subModule.title}</span>
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

      {/* Enhanced Footer with User Info - Orange Theme */}
      <div className="border-t border-orange-800/30 p-4 bg-gradient-to-r from-gray-900 to-black">
        {user && (
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg ring-2 ring-orange-300/20">
              <span className="text-white text-sm font-bold">
                {user.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-orange-300 truncate font-medium">{user.role}</p>
            </div>
          </div>
        )}
        <div className="text-xs text-orange-400 text-center font-medium">
          BGU Portal v2.0 • Enterprise
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