"use client"

import { ReactNode } from 'react'
import { UserRole } from '@/lib/types/bgu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Lock } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: UserRole[]
  userRole?: UserRole
  isAuthenticated?: boolean
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  userRole,
  isAuthenticated = true 
}: ProtectedRouteProps) {
  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              You need to be logged in to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check role authorization
  if (requiredRoles && requiredRoles.length > 0 && userRole) {
    const hasAccess = requiredRoles.includes(userRole)
    
    if (!hasAccess) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                You don't have permission to access this page.
              </p>
              <p className="text-sm text-muted-foreground">
                Required roles: {requiredRoles.join(', ')}
              </p>
              <p className="text-sm text-muted-foreground">
                Your role: {userRole}
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return <>{children}</>
}