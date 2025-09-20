"use client"

import { ReactNode } from 'react'
import { UserRole, AccessLevel } from '@/lib/types/bgu'
import { rolePermissions } from '@/lib/config/navigation'

interface RoleGuardProps {
  children: ReactNode
  requiredRoles?: UserRole[]
  requiredAccess?: AccessLevel
  userRole?: UserRole
  fallback?: ReactNode
}

export function RoleGuard({ 
  children, 
  requiredRoles, 
  requiredAccess = 'R',
  userRole,
  fallback = null 
}: RoleGuardProps) {
  // If no role requirements, show content
  if (!requiredRoles || requiredRoles.length === 0) {
    return <>{children}</>
  }

  // If no user role provided, hide content
  if (!userRole) {
    return <>{fallback}</>
  }

  // Check if user role is in required roles
  const hasRoleAccess = requiredRoles.includes(userRole)

  // Additional access level check if needed
  let hasAccessLevel = true
  if (requiredAccess && userRole) {
    // This would check against specific permissions
    // For now, we'll use the role-based access from the navigation config
    hasAccessLevel = hasRoleAccess
  }

  if (hasRoleAccess && hasAccessLevel) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

interface PermissionWrapperProps {
  children: ReactNode
  permission: string
  userRole?: UserRole
  requiredLevel?: AccessLevel
  fallback?: ReactNode
}

export function PermissionWrapper({
  children,
  permission,
  userRole,
  requiredLevel = 'R',
  fallback = null
}: PermissionWrapperProps) {
  if (!userRole) {
    return <>{fallback}</>
  }

  const userPermissions = rolePermissions[userRole]
  const userAccessLevel = userPermissions?.[permission]

  if (!userAccessLevel || userAccessLevel === 'N') {
    return <>{fallback}</>
  }

  // Check if user has sufficient access level
  if (requiredLevel === 'F' && userAccessLevel !== 'F') {
    return <>{fallback}</>
  }

  return <>{children}</>
}