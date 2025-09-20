// Route Protection Middleware for BlackGoldUnited ERP
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole, AccessLevel } from '@prisma/client'
import { ACCESS_CONTROL_MATRIX } from '@/lib/types/auth'

// Define protected routes and their required permissions
const ROUTE_PERMISSIONS: Record<string, {
  module: string
  requiredAccess: AccessLevel
  requiredAction?: 'create' | 'read' | 'update' | 'delete'
}> = {
  // Dashboard - requires basic read access to any module
  '/dashboard': { module: 'any', requiredAccess: AccessLevel.READ },

  // Sales Module
  '/sales': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/clients': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/clients/new': { module: 'sales', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/sales/invoices': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/invoices/new': { module: 'sales', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/sales/payments': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/rfqs': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/rfqs/new': { module: 'sales', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },

  // Inventory Module
  '/inventory': { module: 'inventory', requiredAccess: AccessLevel.READ },
  '/inventory/products': { module: 'inventory', requiredAccess: AccessLevel.READ },
  '/inventory/products/new': { module: 'inventory', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/inventory/stock': { module: 'inventory', requiredAccess: AccessLevel.READ },
  '/inventory/warehouses': { module: 'inventory', requiredAccess: AccessLevel.READ },
  '/inventory/requisitions': { module: 'inventory', requiredAccess: AccessLevel.READ },

  // Purchase Module
  '/purchase': { module: 'purchase', requiredAccess: AccessLevel.READ },
  '/purchase/suppliers': { module: 'purchase', requiredAccess: AccessLevel.READ },
  '/purchase/suppliers/new': { module: 'purchase', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/purchase/orders': { module: 'purchase', requiredAccess: AccessLevel.READ },
  '/purchase/orders/new': { module: 'purchase', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/purchase/invoices': { module: 'purchase', requiredAccess: AccessLevel.READ },

  // Finance Module
  '/finance': { module: 'finance', requiredAccess: AccessLevel.READ },
  '/finance/accounts': { module: 'finance', requiredAccess: AccessLevel.READ },
  '/finance/transactions': { module: 'finance', requiredAccess: AccessLevel.READ },
  '/finance/expenses': { module: 'finance', requiredAccess: AccessLevel.READ },
  '/finance/expenses/new': { module: 'finance', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },

  // Accounting Module
  '/accounting': { module: 'accounting', requiredAccess: AccessLevel.READ },
  '/accounting/chart-of-accounts': { module: 'accounting', requiredAccess: AccessLevel.READ },
  '/accounting/journal-entries': { module: 'accounting', requiredAccess: AccessLevel.READ },
  '/accounting/journal-entries/new': { module: 'accounting', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/accounting/assets': { module: 'accounting', requiredAccess: AccessLevel.READ },

  // Employees Module
  '/employees': { module: 'employees', requiredAccess: AccessLevel.READ },
  '/employees/list': { module: 'employees', requiredAccess: AccessLevel.READ },
  '/employees/new': { module: 'employees', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/employees/departments': { module: 'employees', requiredAccess: AccessLevel.READ },

  // Attendance Module
  '/attendance': { module: 'attendance', requiredAccess: AccessLevel.READ },
  '/attendance/logs': { module: 'attendance', requiredAccess: AccessLevel.READ },
  '/attendance/shifts': { module: 'attendance', requiredAccess: AccessLevel.READ },
  '/attendance/leave': { module: 'attendance', requiredAccess: AccessLevel.READ },

  // Payroll Module
  '/payroll': { module: 'payroll', requiredAccess: AccessLevel.READ },
  '/payroll/runs': { module: 'payroll', requiredAccess: AccessLevel.READ },
  '/payroll/runs/new': { module: 'payroll', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/payroll/salary-structures': { module: 'payroll', requiredAccess: AccessLevel.READ },

  // QHSE Module
  '/qhse': { module: 'qhse', requiredAccess: AccessLevel.READ },
  '/qhse/policies': { module: 'qhse', requiredAccess: AccessLevel.READ },
  '/qhse/procedures': { module: 'qhse', requiredAccess: AccessLevel.READ },
  '/qhse/forms': { module: 'qhse', requiredAccess: AccessLevel.READ },
  '/qhse/reports': { module: 'qhse', requiredAccess: AccessLevel.READ },

  // Settings Module
  '/settings': { module: 'settings', requiredAccess: AccessLevel.READ },
  '/settings/company': { module: 'settings', requiredAccess: AccessLevel.FULL },
  '/settings/users': { module: 'settings', requiredAccess: AccessLevel.FULL },
  '/settings/permissions': { module: 'settings', requiredAccess: AccessLevel.FULL },

  // Profile routes (accessible to all authenticated users)
  '/profile': { module: 'any', requiredAccess: AccessLevel.READ },
  '/profile/edit': { module: 'any', requiredAccess: AccessLevel.READ },
  '/profile/change-password': { module: 'any', requiredAccess: AccessLevel.READ },
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/error',
  '/auth/verify-email',
  '/',
]

// Admin-only routes
const ADMIN_ROUTES = [
  '/settings/users',
  '/settings/permissions',
  '/settings/system',
]

function hasRoutePermission(
  userRole: UserRole,
  pathname: string
): boolean {
  // Check if it's a public route
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return true
  }

  // Check if it's an admin-only route
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    return userRole === UserRole.MANAGEMENT
  }

  // Find the most specific route match
  let matchedRoute: string | null = null
  let maxMatchLength = 0

  for (const route in ROUTE_PERMISSIONS) {
    if (pathname.startsWith(route) && route.length > maxMatchLength) {
      matchedRoute = route
      maxMatchLength = route.length
    }
  }

  if (!matchedRoute) {
    // Default to denying access for unmatched protected routes
    return false
  }

  const routePermission = ROUTE_PERMISSIONS[matchedRoute]
  const userPermissions = ACCESS_CONTROL_MATRIX[userRole]

  // Special case for 'any' module (profile routes)
  if (routePermission.module === 'any') {
    return true
  }

  const modulePermission = userPermissions[routePermission.module as keyof typeof userPermissions]

  if (!modulePermission) {
    return false
  }

  // Check access level
  if (modulePermission.access === AccessLevel.NONE) {
    return false
  }

  if (routePermission.requiredAccess === AccessLevel.FULL && modulePermission.access !== AccessLevel.FULL) {
    return false
  }

  // Check specific action if required
  if (routePermission.requiredAction) {
    return modulePermission.actions[routePermission.requiredAction]
  }

  return true
}

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Allow access to public routes
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Redirect to login if not authenticated
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check route permissions
    const userRole = token.role as UserRole
    const hasPermission = hasRoutePermission(userRole, pathname)

    if (!hasPermission) {
      // Redirect to unauthorized page or dashboard
      const unauthorizedUrl = new URL('/dashboard', req.url)
      unauthorizedUrl.searchParams.set('error', 'insufficient_permissions')
      return NextResponse.redirect(unauthorizedUrl)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to public routes without token
        if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
          return true
        }

        // Require token for all other routes
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}