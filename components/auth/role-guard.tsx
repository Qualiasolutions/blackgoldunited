'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { UserRole, AccessLevel } from '@/lib/types/auth';
import { hasModuleAccess, canPerformAction, getAccessLevelIndicator } from '@/lib/utils/permissions';
import { AlertCircle, Lock, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface RoleGuardProps {
  children: ReactNode;
  module?: string;
  action?: 'create' | 'read' | 'update' | 'delete';
  requiredLevel?: AccessLevel;
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
  showIndicator?: boolean;
  hideOnNoAccess?: boolean;
}

/**
 * RoleGuard component based on BGU Portal Layout PDF Access Control Matrix
 * Protects content based on user role and module permissions
 */
export function RoleGuard({
  children,
  module,
  action,
  requiredLevel = AccessLevel.READ,
  requiredRoles,
  fallback,
  showIndicator = false,
  hideOnNoAccess = false
}: RoleGuardProps) {
  const { user } = useAuth();

  // If no user is authenticated, deny access
  if (!user) {
    if (hideOnNoAccess) return null;

    return fallback || (
      <Alert variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Authentication required to access this content.
        </AlertDescription>
      </Alert>
    );
  }

  // Check role-based access if requiredRoles is specified
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    if (hideOnNoAccess) return null;

    return fallback || (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Required roles: {requiredRoles.join(', ')}
        </AlertDescription>
      </Alert>
    );
  }

  // Check module-based access if module is specified
  if (module) {
    const hasAccess = hasModuleAccess(user.role, module, requiredLevel);

    if (!hasAccess) {
      if (hideOnNoAccess) return null;

      const accessIndicator = getAccessLevelIndicator(user.role, module);

      return fallback || (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Access denied to {module} module. Your access level: {accessIndicator.label}
          </AlertDescription>
        </Alert>
      );
    }

    // Check specific action if specified
    if (action && !canPerformAction(user.role, module, action)) {
      if (hideOnNoAccess) return null;

      return fallback || (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to {action} in the {module} module.
          </AlertDescription>
        </Alert>
      );
    }
  }

  // If showIndicator is true, wrap children with access level indicator
  if (showIndicator && module && user) {
    const accessIndicator = getAccessLevelIndicator(user.role, module);

    return (
      <div className="relative">
        <div className="absolute top-0 right-0 z-10">
          <Badge
            variant={accessIndicator.color === 'green' ? 'default' :
                    accessIndicator.color === 'yellow' ? 'secondary' : 'destructive'}
            className="text-xs"
          >
            {accessIndicator.color === 'green' && '🟢'}
            {accessIndicator.color === 'yellow' && '🟡'}
            {accessIndicator.color === 'red' && '🔴'}
            {accessIndicator.level === 'full' ? 'F' :
             accessIndicator.level === 'read' ? 'R' : 'N'}
          </Badge>
        </div>
        {children}
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Specific guards for common use cases
export function ReadOnlyGuard({ children, module, fallback }: {
  children: ReactNode;
  module: string;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      module={module}
      requiredLevel={AccessLevel.READ}
      fallback={fallback}
      hideOnNoAccess={true}
    >
      {children}
    </RoleGuard>
  );
}

export function FullAccessGuard({ children, module, fallback }: {
  children: ReactNode;
  module: string;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      module={module}
      requiredLevel={AccessLevel.FULL}
      fallback={fallback}
      hideOnNoAccess={true}
    >
      {children}
    </RoleGuard>
  );
}

export function ActionGuard({
  children,
  module,
  action,
  fallback
}: {
  children: ReactNode;
  module: string;
  action: 'create' | 'read' | 'update' | 'delete';
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      module={module}
      action={action}
      fallback={fallback}
      hideOnNoAccess={true}
    >
      {children}
    </RoleGuard>
  );
}

// Management-only guard
export function ManagementOnlyGuard({ children, fallback }: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      requiredRoles={[UserRole.MANAGEMENT]}
      fallback={fallback}
      hideOnNoAccess={true}
    >
      {children}
    </RoleGuard>
  );
}

// Finance team guard
export function FinanceTeamGuard({ children, fallback }: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      requiredRoles={[UserRole.MANAGEMENT, UserRole.FINANCE_TEAM]}
      fallback={fallback}
      hideOnNoAccess={true}
    >
      {children}
    </RoleGuard>
  );
}

// HR/Admin guard
export function HRAdminGuard({ children, fallback }: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      requiredRoles={[UserRole.MANAGEMENT, UserRole.ADMIN_HR]}
      fallback={fallback}
      hideOnNoAccess={true}
    >
      {children}
    </RoleGuard>
  );
}

// QHSE guard
export function QHSEGuard({ children, fallback }: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      requiredRoles={[UserRole.MANAGEMENT, UserRole.IMS_QHSE]}
      fallback={fallback}
      hideOnNoAccess={true}
    >
      {children}
    </RoleGuard>
  );
}

// Procurement/BD guard
export function ProcurementBDGuard({ children, fallback }: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      requiredRoles={[UserRole.MANAGEMENT, UserRole.PROCUREMENT_BD]}
      fallback={fallback}
      hideOnNoAccess={true}
    >
      {children}
    </RoleGuard>
  );
}

// Legacy compatibility - PermissionWrapper
interface PermissionWrapperProps {
  children: ReactNode
  permission: string
  userRole?: UserRole
  requiredLevel?: 'F' | 'R' | 'N'
  fallback?: ReactNode
}

export function PermissionWrapper({
  children,
  permission,
  userRole,
  requiredLevel = 'R',
  fallback = null
}: PermissionWrapperProps) {
  const accessLevel = requiredLevel === 'F' ? AccessLevel.FULL :
                     requiredLevel === 'R' ? AccessLevel.READ :
                     AccessLevel.NONE;

  return (
    <RoleGuard
      module={permission}
      requiredLevel={accessLevel}
      fallback={fallback}
      hideOnNoAccess={true}
    >
      {children}
    </RoleGuard>
  );
}