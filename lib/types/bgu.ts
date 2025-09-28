// BGU ERP System Types based on Portal Layout specifications

export type AccessLevel = 'F' | 'R' | 'N'; // Full, Read-only, No Access

export type UserRole = 
  | 'MANAGEMENT' 
  | 'FINANCE_TEAM' 
  | 'PROCUREMENT_BD' 
  | 'ADMIN_HR' 
  | 'IMS_QHSE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Record<string, AccessLevel>;
}

// Navigation Structure from BGU Portal Layout
export interface NavItem {
  id: string;
  title: string;
  href?: string;
  icon?: string;
  children?: NavItem[];
  requiredAccess?: AccessLevel;
  badge?: string | number;
}

// Main module structure based on 14-module navigation
export interface ModuleConfig {
  id: string;
  title: string;
  icon: string;
  href: string;
  description?: string;
  subModules: SubModule[];
  requiredRole?: UserRole[];
  color?: string;
}

export interface SubModule {
  id: string;
  title: string;
  href: string;
  description?: string;
  requiredAccess?: AccessLevel;
}

// Sales Module Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  clientId: string;
  clientName: string;
  status: 'DRAFT' | 'SENT' | 'RESPONDED' | 'ACCEPTED' | 'REJECTED';
  requestDate: Date;
  responseDate?: Date;
  validUntil: Date;
  items: RFQItem[];
}

export interface RFQItem {
  id: string;
  description: string;
  quantity: number;
  specifications?: string;
  notes?: string;
}

// Client Module Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  creditLimit?: number;
  paymentTerms?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  isPrimary: boolean;
}

// Inventory Module Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unitPrice: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  warehouseId?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity?: number;
  managerId?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// Purchase Module Types
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
  paymentTerms?: string;
  createdAt: Date;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';
  orderDate: Date;
  expectedDate?: Date;
  totalAmount: number;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Dashboard Types
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'list' | 'quick-action';
  data?: any;
  loading?: boolean;
  error?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  requiredRole?: UserRole[];
}

// Common Table Types
export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: number;
}

export interface TableConfig<T = any> {
  columns: TableColumn<T>[];
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  actions?: TableAction<T>[];
}

export interface TableAction<T = any> {
  id: string;
  label: string;
  icon?: string;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  requiredAccess?: AccessLevel;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: any;
}

export interface FormConfig {
  title: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  module?: string;
  related_id?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}