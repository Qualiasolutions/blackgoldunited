import { ModuleConfig, NavItem, UserRole } from '@/lib/types/bgu';

// BGU Portal Navigation Configuration based on PDF specifications
export const navigationModules: ModuleConfig[] = [
  {
    id: 'sales',
    title: 'Sales',
    icon: 'TrendingUp',
    href: '/sales',
    description: 'Manage invoices, quotations, and sales operations',
    color: 'blue',
    subModules: [
      { id: 'manage-invoices', title: 'Manage Invoice - All', href: '/sales/invoices' },
      { id: 'create-invoice', title: 'Create Invoice', href: '/sales/invoices/create' },
      { id: 'manage-rfq', title: 'Manage (RFQ)', href: '/sales/rfq' },
      { id: 'create-rfq', title: 'Create RFQ', href: '/sales/rfq/create' },
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
    description: 'Manage client relationships and contacts',
    color: 'green',
    subModules: [
      { id: 'manage-clients', title: 'Manage Clients', href: '/clients' },
      { id: 'add-clients', title: 'Add New Clients', href: '/clients/create' },
      { id: 'contact-list', title: 'Contact List', href: '/clients/contacts' },
      { id: 'client-settings', title: 'Client Settings', href: '/clients/settings' }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: 'Package',
    href: '/inventory',
    description: 'Manage products, stock, and warehouses',
    color: 'purple',
    subModules: [
      { id: 'products-services', title: 'Products & Services', href: '/inventory/products' },
      { id: 'manage-requisition', title: 'Manage Requisition', href: '/inventory/requisitions' },
      { id: 'price-list', title: 'Price List', href: '/inventory/pricing' },
      { id: 'warehouses', title: 'Warehouses', href: '/inventory/warehouses' },
      { id: 'manage-stockings', title: 'Manage Stockings', href: '/inventory/stock' },
      { id: 'inventory-settings', title: 'Inventory Settings', href: '/inventory/settings' },
      { id: 'product-settings', title: 'Product Settings', href: '/inventory/product-settings' }
    ]
  },
  {
    id: 'purchase',
    title: 'Purchase',
    icon: 'ShoppingCart',
    href: '/purchase',
    description: 'Manage suppliers and purchase operations',
    color: 'orange',
    subModules: [
      { id: 'purchase-invoices', title: 'Purchase Invoices', href: '/purchase/invoices' },
      { id: 'purchase-refunds', title: 'Purchases Refunds', href: '/purchase/refunds' },
      { id: 'debit-notes', title: 'Debit Notes', href: '/purchase/debit-notes' },
      { id: 'manage-suppliers', title: 'Manage Suppliers', href: '/purchase/suppliers' },
      { id: 'suppliers-payment', title: 'Suppliers Payment', href: '/purchase/payments' },
      { id: 'purchase-invoice-settings', title: 'Purchase Invoice Settings', href: '/purchase/invoice-settings' },
      { id: 'suppliers-settings', title: 'Suppliers Settings', href: '/purchase/supplier-settings' }
    ]
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: 'DollarSign',
    href: '/finance',
    description: 'Manage expenses, income, and financial operations',
    color: 'emerald',
    requiredRole: ['MANAGEMENT', 'FINANCE_TEAM'],
    subModules: [
      { id: 'expenses', title: 'Expenses', href: '/finance/expenses' },
      { id: 'incomes', title: 'Incomes', href: '/finance/incomes' },
      { id: 'treasuries-banks', title: 'Treasuries & Bank Accounts', href: '/finance/accounts' },
      { id: 'finance-settings', title: 'Finance Settings', href: '/finance/settings' }
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting',
    icon: 'Calculator',
    href: '/accounting',
    description: 'Manage journal entries and chart of accounts',
    color: 'indigo',
    requiredRole: ['MANAGEMENT', 'FINANCE_TEAM'],
    subModules: [
      { id: 'journal-entries', title: 'Journal Entries', href: '/accounting/journal' },
      { id: 'add-entry', title: 'Add Entry', href: '/accounting/journal/create' },
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
    description: 'Manage employee information and roles',
    color: 'cyan',
    requiredRole: ['MANAGEMENT', 'ADMIN_HR'],
    subModules: [
      { id: 'manage-employees', title: 'Manage Employees', href: '/employees' },
      { id: 'manage-roles', title: 'Manage Employees Roles', href: '/employees/roles' },
      { id: 'employee-settings', title: 'Settings', href: '/employees/settings' }
    ]
  },
  {
    id: 'organizational',
    title: 'Organizational Structure',
    icon: 'Building',
    href: '/organizational',
    description: 'Manage organizational hierarchy and structure',
    color: 'pink',
    requiredRole: ['MANAGEMENT', 'ADMIN_HR'],
    subModules: [
      { id: 'manage-designations', title: 'Manage Designations', href: '/organizational/designations' },
      { id: 'manage-departments', title: 'Manage Departments', href: '/organizational/departments' },
      { id: 'manage-levels', title: 'Manage Employee Levels', href: '/organizational/levels' },
      { id: 'manage-employment-type', title: 'Manage Employment Type', href: '/organizational/employment-types' },
      { id: 'organizational-chart', title: 'Organizational Chart', href: '/organizational/chart' }
    ]
  },
  {
    id: 'attendance',
    title: 'Attendance',
    icon: 'Clock',
    href: '/attendance',
    description: 'Track attendance, leaves, and shifts',
    color: 'amber',
    requiredRole: ['MANAGEMENT', 'ADMIN_HR'],
    subModules: [
      { id: 'attendance-logs', title: 'Attendance Logs', href: '/attendance/logs' },
      { id: 'attendance-days', title: 'Attendance Days', href: '/attendance/days' },
      { id: 'attendance-sheets', title: 'Attendance Sheets', href: '/attendance/sheets' },
      { id: 'attendance-permissions', title: 'Attendance Permissions', href: '/attendance/permissions' },
      { id: 'leave-applications', title: 'Leave Applications', href: '/attendance/leaves' },
      { id: 'shifts-management', title: 'Shifts Management', href: '/attendance/shifts' },
      { id: 'allocated-shifts', title: 'Allocated Shifts', href: '/attendance/allocated-shifts' },
      { id: 'log-sessions', title: 'Attendance Log Sessions', href: '/attendance/sessions' },
      { id: 'attendance-settings', title: 'Settings', href: '/attendance/settings' }
    ]
  },
  {
    id: 'payroll',
    title: 'Payroll',
    icon: 'CreditCard',
    href: '/payroll',
    description: 'Manage contracts, pay runs, and salary structures',
    color: 'teal',
    requiredRole: ['MANAGEMENT', 'ADMIN_HR', 'FINANCE_TEAM'],
    subModules: [
      { id: 'contracts', title: 'Contracts', href: '/payroll/contracts' },
      { id: 'pay-runs', title: 'Pay Runs', href: '/payroll/pay-runs' },
      { id: 'pay-slips', title: 'Pay slips', href: '/payroll/pay-slips' },
      { id: 'loan', title: 'Loan', href: '/payroll/loans' },
      { id: 'salary-components', title: 'Salary Components', href: '/payroll/components' },
      { id: 'salary-structures', title: 'Salary Structures', href: '/payroll/structures' },
      { id: 'payroll-settings', title: 'Settings', href: '/payroll/settings' }
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: 'FileText',
    href: '/reports',
    description: 'Generate and view various business reports',
    color: 'rose',
    subModules: [
      { id: 'sales-reports', title: 'Sales Reports', href: '/reports/sales' },
      { id: 'purchase-reports', title: 'Purchase Reports', href: '/reports/purchase' },
      { id: 'accounting-reports', title: 'Accounting Reports', href: '/reports/accounting' },
      { id: 'employee-reports', title: 'Employee Reports', href: '/reports/employees' },
      { id: 'clients-reports', title: 'Clients Reports', href: '/reports/clients' },
      { id: 'store-reports', title: 'Store Reports', href: '/reports/inventory' },
      { id: 'system-activity-log', title: 'System Activity Log', href: '/reports/activity' }
    ]
  },
  {
    id: 'templates',
    title: 'Templates',
    icon: 'FileTemplate',
    href: '/templates',
    description: 'Manage document templates and files',
    color: 'violet',
    subModules: [
      { id: 'printable-template', title: 'Printable Template', href: '/templates/printable' },
      { id: 'prefilled-templates', title: 'Prefilled Templates', href: '/templates/prefilled' },
      { id: 'terms-conditions', title: 'Terms & Conditions', href: '/templates/terms' },
      { id: 'manage-files', title: 'Manage Files/ Documents', href: '/templates/files' },
      { id: 'auto-reminder-rules', title: 'Auto Reminder Rules', href: '/templates/reminders' }
    ]
  },
  {
    id: 'qhse',
    title: 'QHSE',
    icon: 'Shield',
    href: '/qhse',
    description: 'Quality, Health, Safety, and Environment management',
    color: 'slate',
    requiredRole: ['MANAGEMENT', 'IMS_QHSE'],
    subModules: [
      { id: 'qhse-reports', title: 'Reports', href: '/qhse/reports' },
      { id: 'policy', title: 'Policy', href: '/qhse/policy' },
      { id: 'procedures', title: 'Procedures', href: '/qhse/procedures' },
      { id: 'forms', title: 'Forms', href: '/qhse/forms' },
      { id: 'qhse-reports-alt', title: 'Reports', href: '/qhse/reports-alt' }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'Settings',
    href: '/settings',
    description: 'System configuration and account settings',
    color: 'gray',
    subModules: [
      { id: 'account-information', title: 'Account Information', href: '/settings/account' },
      { id: 'account-settings', title: 'Account Settings', href: '/settings/general' }
    ]
  }
];

// Quick actions for dashboard based on PDF specifications
export const quickActions = [
  {
    id: 'invoice-generator',
    title: 'Invoice Generator',
    description: 'Create new invoices quickly',
    icon: 'FileText',
    href: '/sales/invoices/create',
    color: 'blue'
  },
  {
    id: 'client-management',
    title: 'Client Management',
    description: 'Manage your clients',
    icon: 'Users',
    href: '/clients',
    color: 'green'
  },
  {
    id: 'inventory-check',
    title: 'Inventory Check',
    description: 'Check stock levels',
    icon: 'Package',
    href: '/inventory/products',
    color: 'purple'
  },
  {
    id: 'purchase-orders',
    title: 'Purchase Orders',
    description: 'Manage purchase orders',
    icon: 'ShoppingCart',
    href: '/purchase/invoices',
    color: 'orange'
  }
];

// Role-based access configuration from PDF Access Control Matrix
export const rolePermissions: Record<UserRole, Record<string, 'F' | 'R' | 'N'>> = {
  MANAGEMENT: {
    administration: 'F',
    finance: 'F',
    procurement: 'F',
    projects_operations: 'F',
    ims_compliance: 'F',
    correspondence: 'F'
  },
  FINANCE_TEAM: {
    administration: 'R',
    finance: 'F',
    procurement: 'R',
    projects_operations: 'R',
    ims_compliance: 'N',
    correspondence: 'N'
  },
  PROCUREMENT_BD: {
    administration: 'N',
    finance: 'R',
    procurement: 'F',
    projects_operations: 'F',
    ims_compliance: 'N',
    correspondence: 'R'
  },
  ADMIN_HR: {
    administration: 'F',
    finance: 'N',
    procurement: 'N',
    projects_operations: 'N',
    ims_compliance: 'N',
    correspondence: 'R'
  },
  IMS_QHSE: {
    administration: 'N',
    finance: 'N',
    procurement: 'N',
    projects_operations: 'R',
    ims_compliance: 'F',
    correspondence: 'R'
  }
};

// Navigation tree for sidebar
export const navigationTree: NavItem[] = navigationModules.map(module => ({
  id: module.id,
  title: module.title,
  href: module.href,
  icon: module.icon,
  children: module.subModules.map(sub => ({
    id: sub.id,
    title: sub.title,
    href: sub.href
  }))
}));