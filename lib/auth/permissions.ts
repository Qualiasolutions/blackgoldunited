import { UserRole, AccessLevel, ACCESS_CONTROL_MATRIX, UserPermissions } from '@/lib/types/auth';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Map HTTP methods to CRUD actions
const HTTP_TO_CRUD_MAP: Record<HTTPMethod, keyof UserPermissions['clients']['actions']> = {
  'GET': 'read',
  'POST': 'create',
  'PUT': 'update',
  'DELETE': 'delete'
};

/**
 * Check if a user has permission to access a specific module with a specific action
 */
export function hasModulePermission(
  userRole: UserRole,
  module: keyof UserPermissions,
  action: keyof UserPermissions['clients']['actions']
): boolean {
  const permissions = ACCESS_CONTROL_MATRIX[userRole];
  const modulePermission = permissions[module];

  // Check if user has access to the module
  if (modulePermission.access === AccessLevel.NONE) {
    return false;
  }

  // Check specific action permission
  return modulePermission.actions[action];
}

/**
 * Check if user has permission based on HTTP method
 */
export function hasHTTPPermission(
  userRole: UserRole,
  module: keyof UserPermissions,
  method: HTTPMethod
): boolean {
  const action = HTTP_TO_CRUD_MAP[method];
  return hasModulePermission(userRole, module, action);
}

/**
 * Get user's access level for a specific module
 */
export function getModuleAccess(
  userRole: UserRole,
  module: keyof UserPermissions
): AccessLevel {
  return ACCESS_CONTROL_MATRIX[userRole][module].access;
}

/**
 * Check if user has at least read access to a module
 */
export function hasReadAccess(
  userRole: UserRole,
  module: keyof UserPermissions
): boolean {
  const access = getModuleAccess(userRole, module);
  return access === AccessLevel.READ || access === AccessLevel.FULL;
}

/**
 * Check if user has full access to a module
 */
export function hasFullAccess(
  userRole: UserRole,
  module: keyof UserPermissions
): boolean {
  return getModuleAccess(userRole, module) === AccessLevel.FULL;
}

/**
 * Get all modules a user has access to
 */
export function getUserAccessibleModules(userRole: UserRole): string[] {
  const permissions = ACCESS_CONTROL_MATRIX[userRole];
  return Object.keys(permissions).filter(module =>
    permissions[module as keyof UserPermissions].access !== AccessLevel.NONE
  );
}

/**
 * Get user's full permissions object for a specific module
 */
export function getModulePermissions(
  userRole: UserRole,
  module: keyof UserPermissions
) {
  return ACCESS_CONTROL_MATRIX[userRole][module];
}