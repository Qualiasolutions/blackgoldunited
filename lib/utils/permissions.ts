// Permission utilities for BGU Portal Layout access control
import { UserRole, AccessLevel, ModulePermission, ACCESS_CONTROL_MATRIX } from '@/lib/types/auth';

/**
 * Check if user has access to a specific module
 * Based on BGU Portal Layout PDF Access Control Matrix
 */
export function hasModuleAccess(
  userRole: UserRole,
  module: string,
  requiredLevel: AccessLevel = AccessLevel.READ
): boolean {
  const permissions = ACCESS_CONTROL_MATRIX[userRole];
  if (!permissions || !permissions[module as keyof typeof permissions]) {
    return false;
  }

  const modulePermission = permissions[module as keyof typeof permissions];

  switch (requiredLevel) {
    case AccessLevel.NONE:
      return true; // Always true for NONE level check
    case AccessLevel.READ:
      return modulePermission.access !== AccessLevel.NONE;
    case AccessLevel.FULL:
      return modulePermission.access === AccessLevel.FULL;
    default:
      return false;
  }
}

/**
 * Check if user can perform a specific action (CRUD)
 */
export function canPerformAction(
  userRole: UserRole,
  module: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const permissions = ACCESS_CONTROL_MATRIX[userRole];
  if (!permissions || !permissions[module as keyof typeof permissions]) {
    return false;
  }

  const modulePermission = permissions[module as keyof typeof permissions];
  return modulePermission.actions[action];
}

/**
 * Get user's permission level for a module
 */
export function getModulePermission(
  userRole: UserRole,
  module: string
): ModulePermission | null {
  const permissions = ACCESS_CONTROL_MATRIX[userRole];
  if (!permissions || !permissions[module as keyof typeof permissions]) {
    return null;
  }

  return permissions[module as keyof typeof permissions];
}

/**
 * Get all accessible modules for a user role
 */
export function getAccessibleModules(userRole: UserRole): string[] {
  const permissions = ACCESS_CONTROL_MATRIX[userRole];
  if (!permissions) return [];

  return Object.keys(permissions).filter(module =>
    hasModuleAccess(userRole, module, AccessLevel.READ)
  );
}

/**
 * Check if user has full access to a module (Green in PDF matrix)
 */
export function hasFullAccess(userRole: UserRole, module: string): boolean {
  return hasModuleAccess(userRole, module, AccessLevel.FULL);
}

/**
 * Check if user has read-only access to a module (Yellow in PDF matrix)
 */
export function hasReadOnlyAccess(userRole: UserRole, module: string): boolean {
  const permission = getModulePermission(userRole, module);
  return permission?.access === AccessLevel.READ;
}

/**
 * Check if user has no access to a module (Red in PDF matrix)
 */
export function hasNoAccess(userRole: UserRole, module: string): boolean {
  const permission = getModulePermission(userRole, module);
  return !permission || permission.access === AccessLevel.NONE;
}

/**
 * Get visual indicator for access level (matching PDF colors)
 */
export function getAccessLevelIndicator(userRole: UserRole, module: string): {
  level: 'full' | 'read' | 'none';
  color: 'green' | 'yellow' | 'red';
  label: string;
} {
  if (hasFullAccess(userRole, module)) {
    return { level: 'full', color: 'green', label: 'Full Access (F)' };
  }
  if (hasReadOnlyAccess(userRole, module)) {
    return { level: 'read', color: 'yellow', label: 'Read-only (R)' };
  }
  return { level: 'none', color: 'red', label: 'No Access (N)' };
}

/**
 * Filter navigation items based on user permissions
 */
export function filterNavigation(
  userRole: UserRole,
  navigationItems: any[]
): any[] {
  return navigationItems.filter(item =>
    hasModuleAccess(userRole, item.id, AccessLevel.READ)
  );
}

/**
 * Get role description based on BGU Portal Layout PDF
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions = {
    [UserRole.MANAGEMENT]: 'Management (MD / President) - Full access to all categories',
    [UserRole.FINANCE_TEAM]: 'Finance Team - Full access to Finance, Read-only access to Contracts/Procurement',
    [UserRole.PROCUREMENT_BD]: 'Procurement / BD Team - Full access to Procurement & Projects, Read-only access to Finance (for PO values)',
    [UserRole.ADMIN_HR]: 'Admin / HR - Full access to HR & Admin docs, Limited read-only access to others (licenses, permits)',
    [UserRole.IMS_QHSE]: 'IMS / QHSE Officer - Full access to IMS / Compliance, Limited access to Operations/Projects'
  };

  return descriptions[role] || 'Unknown role';
}

/**
 * Validate if navigation request is allowed
 */
export function validateNavigation(
  userRole: UserRole,
  targetPath: string
): { allowed: boolean; reason?: string } {
  // Extract module from path (e.g., '/sales/invoices' -> 'sales')
  const pathParts = targetPath.split('/').filter(Boolean);
  const moduleName = pathParts[0];

  if (!moduleName) {
    return { allowed: true }; // Allow dashboard access
  }

  if (hasModuleAccess(userRole, moduleName, AccessLevel.READ)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Access denied: ${getRoleDescription(userRole)} does not have access to ${moduleName} module`
  };
}

/**
 * BGU Portal categories access check (from PDF matrix)
 */
export function hasCategoryAccess(
  userRole: UserRole,
  category: 'administration' | 'finance' | 'procurement' | 'projects' | 'compliance' | 'correspondence'
): 'F' | 'R' | 'N' {
  const roleMatrix = {
    [UserRole.MANAGEMENT]: { administration: 'F', finance: 'F', procurement: 'F', projects: 'F', compliance: 'F', correspondence: 'F' },
    [UserRole.FINANCE_TEAM]: { administration: 'R', finance: 'F', procurement: 'R', projects: 'R', compliance: 'N', correspondence: 'N' },
    [UserRole.PROCUREMENT_BD]: { administration: 'N', finance: 'R', procurement: 'F', projects: 'F', compliance: 'N', correspondence: 'R' },
    [UserRole.ADMIN_HR]: { administration: 'F', finance: 'N', procurement: 'N', projects: 'N', compliance: 'N', correspondence: 'R' },
    [UserRole.IMS_QHSE]: { administration: 'N', finance: 'N', procurement: 'N', projects: 'R', compliance: 'F', correspondence: 'R' }
  };

  return roleMatrix[userRole][category] as 'F' | 'R' | 'N';
}