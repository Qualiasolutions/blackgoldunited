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
      { id: 'manage-invoices', title: 'Manage Invoice - All', href: '/sales/invoices' },
      { id: 'create-invoice', title: 'Create Invoice - new', href: '/sales/invoices/create' },
      { id: 'manage-purchase-orders', title: 'Manage Purchase Orders', href: '/sales/purchase-orders' },
      { id: 'create-purchase-order', title: 'Create Purchase Order', href: '/sales/purchase-orders/create' },
      { id: 'manage-rfq', title: 'Manage (RFQ) - Quotation', href: '/sales/rfq' },
      { id: 'create-rfq', title: 'Create RFQ - Request for Quotation', href: '/sales/rfq/create' },
      { id: 'credit-notes', title: 'Credit notes', href: '/sales/credit-notes' },
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
      { id: 'add-clients', title: 'Add New Clients', href: '/clients/create' },
      { id: 'contact-list', title: 'Contact List - Summary List', href: '/clients/contacts' },
      { id: 'client-settings', title: 'Client Settings', href: '/clients/settings' }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: 'Package',
    href: '/inventory',
    subModules: [
      { id: 'products-services', title: 'Products & Services - Summary List', href: '/inventory' },
      { id: 'manage-requisition', title: 'Manage Requisition', href: '/inventory/requisition' },
      { id: 'price-list', title: 'Price List', href: '/inventory/price-list' },
      { id: 'warehouses', title: 'Warehouses', href: '/inventory/warehouses' },
      { id: 'manage-stockings', title: 'Manage Stockings', href: '/inventory/stockings' },
      { id: 'inventory-settings', title: 'Inventory Settings', href: '/inventory/settings' },
      { id: 'product-settings', title: 'Product Settings', href: '/inventory/product-settings' }
    ]
  },
  {
    id: 'purchases',
    title: 'Purchase',
    icon: 'ShoppingCart',
    href: '/purchases',
    subModules: [
      { id: 'purchase-invoices', title: 'Purchase Invoices', href: '/purchases/invoices' },
      { id: 'purchase-refunds', title: 'Purchases Refunds', href: '/purchases/refunds' },
      { id: 'debit-notes', title: 'Debit Notes', href: '/purchases/debit-notes' },
      { id: 'manage-suppliers', title: 'Mange Suppliers', href: '/purchases/suppliers' },
      { id: 'supplier-payments', title: 'Suppliers Payment', href: '/purchases/payments' },
      { id: 'purchase-invoice-settings', title: 'Purchase Invoice Settings', href: '/purchases/invoice-settings' },
      { id: 'supplier-settings', title: 'Suppliers Settings', href: '/purchases/supplier-settings' }
    ]
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: 'DollarSign',
    href: '/finance',
    subModules: [
      { id: 'expenses', title: 'Expenses', href: '/finance/expenses' },
      { id: 'incomes', title: 'Incomes', href: '/finance/incomes' },
      { id: 'treasuries-banks', title: 'Treasuries & Bank Accounts', href: '/finance/treasuries' },
      { id: 'finance-settings', title: 'Finance Settings', href: '/finance/settings' }
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting',
    icon: 'Calculator',
    href: '/accounting',
    subModules: [
      { id: 'journal-entries', title: 'Journal Entries', href: '/accounting/journal' },
      { id: 'add-entry', title: 'Add Entry', href: '/accounting/add-entry' },
      { id: 'chart-accounts', title: 'Chart of Accounts', href: '/accounting/chart' },
      { id: 'cost-centers', title: 'Cost Centers', href: '/accounting/cost-centers' },
      { id: 'assets', title: 'Assets', href: '/accounting/assets' },
      { id: 'accounting-settings', title: 'Accounting Settings', href: '/accounting/settings' }
    ]
  },
  {
    id: 'employees',
    title: 'Employees',
    icon: 'UserCheck',
    href: '/employees',
    subModules: [
      { id: 'manage-employees', title: 'Manage Employees', href: '/employees' },
      { id: 'manage-employee-roles', title: 'Manage Employees Roles', href: '/employees/roles' },
      { id: 'employee-settings', title: 'Settings', href: '/employees/settings' }
    ]
  },
  {
    id: 'organizational-structure',
    title: 'Organizational Structure',
    icon: 'Building2',
    href: '/organization',
    subModules: [
      { id: 'manage-designations', title: 'Manage Designations', href: '/organization/designations' },
      { id: 'manage-departments', title: 'Manage Departments', href: '/organization/departments' },
      { id: 'manage-employee-levels', title: 'Manage Employee Levels', href: '/organization/levels' },
      { id: 'manage-employment-type', title: 'Manage Employment Type', href: '/organization/employment-types' },
      { id: 'organizational-chart', title: 'Organizational Chart', href: '/organization/chart' }
    ]
  },
  {
    id: 'attendance',
    title: 'Attendance',
    icon: 'Clock',
    href: '/attendance',
    subModules: [
      { id: 'attendance-logs', title: 'Attendance Logs', href: '/attendance/logs' },
      { id: 'attendance-days', title: 'Attendance Days', href: '/attendance/days' },
      { id: 'attendance-sheets', title: 'Attendance Sheets', href: '/attendance/sheets' },
      { id: 'attendance-permissions', title: 'Attendance Permissions', href: '/attendance/permissions' },
      { id: 'leave-applications', title: 'Leave Applications', href: '/attendance/leave' },
      { id: 'shifts-management', title: 'Shifts Management', href: '/attendance/shifts' },
      { id: 'allocated-shifts', title: 'Allocated Shifts', href: '/attendance/allocated-shifts' },
      { id: 'attendance-log-sessions', title: 'Attendance Log Sessions', href: '/attendance/log-sessions' },
      { id: 'attendance-settings', title: 'Settings', href: '/attendance/settings' }
    ]
  },
  {
    id: 'payroll',
    title: 'Payroll',
    icon: 'CreditCard',
    href: '/payroll',
    subModules: [
      { id: 'contracts', title: 'Contracts', href: '/payroll/contracts' },
      { id: 'pay-runs', title: 'Pay Runs', href: '/payroll/pay-runs' },
      { id: 'pay-slips', title: 'Pay slips', href: '/payroll/payslips' },
      { id: 'loan', title: 'Loan', href: '/payroll/loans' },
      { id: 'salary-components', title: 'Salary Components', href: '/payroll/salary-components' },
      { id: 'salary-structures', title: 'Salary Structures', href: '/payroll/salary-structures' },
      { id: 'payroll-settings', title: 'Settings', href: '/payroll/settings' }
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: 'BarChart3',
    href: '/reports',
    subModules: [
      { id: 'sales-reports', title: 'Sales Reports', href: '/reports/sales' },
      { id: 'purchase-reports', title: 'Purchase Reports', href: '/reports/purchase' },
      { id: 'accounting-reports', title: 'Accounting Reports', href: '/reports/accounting' },
      { id: 'employee-reports', title: 'Employee Reports', href: '/reports/employee' },
      { id: 'clients-reports', title: 'Clients Reports', href: '/reports/clients' },
      { id: 'store-reports', title: 'Store Reports', href: '/reports/store' },
      { id: 'system-activity-log', title: 'System Activity Log', href: '/reports/activity-log' }
    ]
  },
  {
    id: 'templates',
    title: 'Templates',
    icon: 'FileText',
    href: '/templates',
    subModules: [
      { id: 'printable-templates', title: 'Printable Template', href: '/templates/printable' },
      { id: 'prefilled-templates', title: 'Prefilled Templates', href: '/templates/prefilled' },
      { id: 'terms-conditions', title: 'Terms & Conditions', href: '/templates/terms' },
      { id: 'manage-documents', title: 'Manage Files/Documents', href: '/templates/documents' },
      { id: 'auto-reminder-rules', title: 'Auto Reminder Rules', href: '/templates/reminders' }
    ]
  },
  {
    id: 'qhse',
    title: 'QHSE',
    icon: 'Shield',
    href: '/qhse',
    subModules: [
      { id: 'qhse-reports', title: 'Reports', href: '/qhse/reports' },
      { id: 'qhse-policy', title: 'Policy', href: '/qhse/policy' },
      { id: 'qhse-procedures', title: 'Procedures', href: '/qhse/procedures' },
      { id: 'qhse-forms', title: 'Forms', href: '/qhse/forms' }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'Settings',
    href: '/settings',
    subModules: [
      { id: 'account-information', title: 'Account Information', href: '/settings/account' },
      { id: 'account-settings', title: 'Account Settings', href: '/settings/general' }
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
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50">
      {/* Corporate Branding Header */}
      <div className="border-b border-slate-700/50 px-4 py-5">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">BG</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">BlackGoldUnited</h2>
            <p className="text-xs text-slate-400">Enterprise ERP</p>
          </div>
        </div>
      </div>

      {/* Corporate Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
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
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                      moduleActive
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-slate-300 hover:bg-slate-700/70 hover:text-white"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      {IconComponent && (
                        <IconComponent className={cn(
                          "h-4 w-4 transition-colors duration-200",
                          moduleActive ? "text-primary-foreground" : "text-slate-400 group-hover:text-white"
                        )} />
                      )}
                      <span className="font-medium">{module.title}</span>
                    </div>
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                ) : (
                  <Link href={module.href}>
                    <div className={cn(
                      "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                      moduleActive
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-slate-300 hover:bg-slate-700/70 hover:text-white"
                    )}>
                      {IconComponent && (
                        <IconComponent className={cn(
                          "h-4 w-4 transition-colors duration-200",
                          moduleActive ? "text-primary-foreground" : "text-slate-400 group-hover:text-white"
                        )} />
                      )}
                      <span className="font-medium">{module.title}</span>
                    </div>
                  </Link>
                )}

                {/* Corporate Submenu */}
                {expanded && hasSubModules && (
                  <div className="ml-7 space-y-0.5 border-l-2 border-slate-600/50 pl-4 py-1">
                    {module.subModules.map((subModule) => (
                      <Link key={subModule.id} href={subModule.href}>
                        <div className={cn(
                          "flex items-center rounded-md px-3 py-2 text-xs transition-all duration-200 group",
                          isActive(subModule.href)
                            ? "bg-primary/20 text-primary font-medium border-l-2 border-primary shadow-sm"
                            : "text-slate-400 hover:bg-slate-700/40 hover:text-slate-200 hover:border-l-2 hover:border-slate-500"
                        )}>
                          <span className="truncate">{subModule.title}</span>
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

      {/* Corporate Footer with User Info */}
      <div className="border-t border-slate-700/50 p-4 bg-slate-800/80 backdrop-blur-sm">
        {user && (
          <div className="flex items-center space-x-3 mb-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:bg-slate-700/50 transition-colors">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">
                {user.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
        )}
        <div className="text-xs text-slate-500 text-center font-medium">
          BGU ERP v2.0 • Enterprise Edition
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