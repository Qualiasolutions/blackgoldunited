// Authentication Types for BlackGoldUnited ERP System

// User roles enum
export enum UserRole {
  MANAGEMENT = 'MANAGEMENT',
  FINANCE_TEAM = 'FINANCE_TEAM',
  PROCUREMENT_BD = 'PROCUREMENT_BD',
  ADMIN_HR = 'ADMIN_HR',
  IMS_QHSE = 'IMS_QHSE'
}

// Access levels enum
export enum AccessLevel {
  NONE = 'NONE',
  READ = 'READ',
  FULL = 'FULL'
}

export interface User {
  id: string
  email: string
  username?: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  lastLogin?: Date
  emailVerified: boolean
  employeeId?: string
}

export interface AuthUser extends User {
  permissions: UserPermissions
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupData {
  email: string
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
  role?: UserRole
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  password: string
  confirmPassword: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Permission system
export interface ModulePermission {
  module: string
  access: AccessLevel
  actions: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
}

export interface UserPermissions {
  // Core 14 modules from BGU Portal Layout PDF
  sales: ModulePermission
  clients: ModulePermission
  inventory: ModulePermission
  purchase: ModulePermission
  finance: ModulePermission
  accounting: ModulePermission
  employees: ModulePermission
  organizational: ModulePermission
  attendance: ModulePermission
  payroll: ModulePermission
  reports: ModulePermission
  templates: ModulePermission
  qhse: ModulePermission
  settings: ModulePermission
  // Additional categories from Access Control Matrix
  administration: ModulePermission
  procurement: ModulePermission
  projects: ModulePermission
  compliance: ModulePermission
  correspondence: ModulePermission
}

// Access Control Matrix based on BGU Portal Layout PDF specifications
// Categories: Administration, Finance, Procurement, Projects & Operations, IMS/Compliance, Correspondence
// Colors: Green (F) = Full Access, Yellow (R) = Read-only, Red (N) = No Access
export const ACCESS_CONTROL_MATRIX: Record<UserRole, UserPermissions> = {
  // Management (MD / President) - Full access to all categories
  MANAGEMENT: {
    // Core 14 modules - Full access
    sales: { module: 'sales', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    clients: { module: 'clients', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    inventory: { module: 'inventory', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    purchase: { module: 'purchase', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    finance: { module: 'finance', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    accounting: { module: 'accounting', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    employees: { module: 'employees', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    organizational: { module: 'organizational', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    attendance: { module: 'attendance', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    payroll: { module: 'payroll', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    reports: { module: 'reports', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    templates: { module: 'templates', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    qhse: { module: 'qhse', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    settings: { module: 'settings', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    // Additional categories - Full access
    administration: { module: 'administration', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    procurement: { module: 'procurement', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    projects: { module: 'projects', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    compliance: { module: 'compliance', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    correspondence: { module: 'correspondence', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } }
  },

  // Finance Team - Full access to Finance, Read-only access to Contracts/Procurement
  FINANCE_TEAM: {
    sales: { module: 'sales', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    clients: { module: 'clients', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    inventory: { module: 'inventory', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    purchase: { module: 'purchase', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    finance: { module: 'finance', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    accounting: { module: 'accounting', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    employees: { module: 'employees', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    organizational: { module: 'organizational', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    attendance: { module: 'attendance', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    payroll: { module: 'payroll', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    reports: { module: 'reports', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    templates: { module: 'templates', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    qhse: { module: 'qhse', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    settings: { module: 'settings', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    // Categories from matrix
    administration: { module: 'administration', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    procurement: { module: 'procurement', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    projects: { module: 'projects', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    compliance: { module: 'compliance', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    correspondence: { module: 'correspondence', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } }
  },

  // Procurement / BD Team - Full access to Procurement & Projects, Read-only access to Finance (for PO values)
  PROCUREMENT_BD: {
    sales: { module: 'sales', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    clients: { module: 'clients', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    inventory: { module: 'inventory', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    purchase: { module: 'purchase', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    finance: { module: 'finance', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    accounting: { module: 'accounting', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    employees: { module: 'employees', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    organizational: { module: 'organizational', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    attendance: { module: 'attendance', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    payroll: { module: 'payroll', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    reports: { module: 'reports', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    templates: { module: 'templates', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    qhse: { module: 'qhse', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    settings: { module: 'settings', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    // Categories from matrix
    administration: { module: 'administration', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    procurement: { module: 'procurement', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    projects: { module: 'projects', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    compliance: { module: 'compliance', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    correspondence: { module: 'correspondence', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } }
  },

  // Admin / HR - Full access to HR & Admin docs, Limited read-only access to others (licenses, permits)
  ADMIN_HR: {
    sales: { module: 'sales', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    clients: { module: 'clients', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    inventory: { module: 'inventory', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    purchase: { module: 'purchase', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    finance: { module: 'finance', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    accounting: { module: 'accounting', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    employees: { module: 'employees', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    organizational: { module: 'organizational', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    attendance: { module: 'attendance', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    payroll: { module: 'payroll', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    reports: { module: 'reports', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    templates: { module: 'templates', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    qhse: { module: 'qhse', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    settings: { module: 'settings', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    // Categories from matrix
    administration: { module: 'administration', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    procurement: { module: 'procurement', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    projects: { module: 'projects', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    compliance: { module: 'compliance', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    correspondence: { module: 'correspondence', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } }
  },

  // IMS / QHSE Officer - Full access to IMS / Compliance, Limited access to Operations/Projects
  IMS_QHSE: {
    sales: { module: 'sales', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    clients: { module: 'clients', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    inventory: { module: 'inventory', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    purchase: { module: 'purchase', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    finance: { module: 'finance', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    accounting: { module: 'accounting', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    employees: { module: 'employees', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    organizational: { module: 'organizational', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    attendance: { module: 'attendance', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    payroll: { module: 'payroll', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    reports: { module: 'reports', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    templates: { module: 'templates', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    qhse: { module: 'qhse', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    settings: { module: 'settings', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    // Categories from matrix
    administration: { module: 'administration', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    procurement: { module: 'procurement', access: AccessLevel.NONE, actions: { create: false, read: false, update: false, delete: false } },
    projects: { module: 'projects', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } },
    compliance: { module: 'compliance', access: AccessLevel.FULL, actions: { create: true, read: true, update: true, delete: true } },
    correspondence: { module: 'correspondence', access: AccessLevel.READ, actions: { create: false, read: true, update: false, delete: false } }
  }
}

// Session types
export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  permissions: UserPermissions
  employeeId?: string
}

// Audit log types
export interface AuthAuditLog {
  id: string
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET' | 'ACCOUNT_LOCKED'
  userId?: string
  email: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  success: boolean
  details?: any
}

// API Response types
export interface AuthResponse {
  success: boolean
  message?: string
  user?: AuthUser
  token?: string
  refreshToken?: string
}

export interface ApiError {
  success: false
  error: string
  message: string
  statusCode: number
}

// Validation schemas
export interface ValidationError {
  field: string
  message: string
}

export interface AuthValidationResult {
  isValid: boolean
  errors: ValidationError[]
}