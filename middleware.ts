// Route Protection Middleware for BlackGoldUnited ERP
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { UserRole } from '@/lib/types/auth'

// Define protected routes and their required permissions
const ROUTE_PERMISSIONS: Record<string, {
  module: string
  requiredAccess: 'read' | 'full'
  requiredAction?: 'create' | 'read' | 'update' | 'delete'
}> = {
  // Dashboard - requires basic read access to any module
  '/dashboard': { module: 'any', requiredAccess: 'read' },

  // Sales Module
  '/sales': { module: 'sales', requiredAccess: 'read' },
  '/sales/clients': { module: 'sales', requiredAccess: 'read' },
  '/sales/clients/new': { module: 'sales', requiredAccess: 'full', requiredAction: 'create' },
  '/sales/invoices': { module: 'sales', requiredAccess: 'read' },
  '/sales/invoices/new': { module: 'sales', requiredAccess: 'full', requiredAction: 'create' },
  '/sales/payments': { module: 'sales', requiredAccess: 'read' },
  '/sales/rfqs': { module: 'sales', requiredAccess: 'read' },
  '/sales/rfqs/new': { module: 'sales', requiredAccess: 'full', requiredAction: 'create' },

  // Inventory Module
  '/inventory': { module: 'inventory', requiredAccess: 'read' },
  '/inventory/products': { module: 'inventory', requiredAccess: 'read' },
  '/inventory/products/new': { module: 'inventory', requiredAccess: 'full', requiredAction: 'create' },
  '/inventory/stock': { module: 'inventory', requiredAccess: 'read' },
  '/inventory/warehouses': { module: 'inventory', requiredAccess: 'read' },
  '/inventory/requisitions': { module: 'inventory', requiredAccess: 'read' },

  // Purchase Module
  '/purchase': { module: 'purchase', requiredAccess: 'read' },
  '/purchase/suppliers': { module: 'purchase', requiredAccess: 'read' },
  '/purchase/suppliers/new': { module: 'purchase', requiredAccess: 'full', requiredAction: 'create' },
  '/purchase/orders': { module: 'purchase', requiredAccess: 'read' },
  '/purchase/orders/new': { module: 'purchase', requiredAccess: 'full', requiredAction: 'create' },
  '/purchase/invoices': { module: 'purchase', requiredAccess: 'read' },

  // Finance Module
  '/finance': { module: 'finance', requiredAccess: 'read' },
  '/finance/accounts': { module: 'finance', requiredAccess: 'read' },
  '/finance/transactions': { module: 'finance', requiredAccess: 'read' },
  '/finance/expenses': { module: 'finance', requiredAccess: 'read' },
  '/finance/expenses/new': { module: 'finance', requiredAccess: 'full', requiredAction: 'create' },

  // Accounting Module
  '/accounting': { module: 'accounting', requiredAccess: 'read' },
  '/accounting/chart-of-accounts': { module: 'accounting', requiredAccess: 'read' },
  '/accounting/journal-entries': { module: 'accounting', requiredAccess: 'read' },
  '/accounting/journal-entries/new': { module: 'accounting', requiredAccess: 'full', requiredAction: 'create' },
  '/accounting/assets': { module: 'accounting', requiredAccess: 'read' },

  // Employees Module
  '/employees': { module: 'employees', requiredAccess: 'read' },
  '/employees/list': { module: 'employees', requiredAccess: 'read' },
  '/employees/new': { module: 'employees', requiredAccess: 'full', requiredAction: 'create' },
  '/employees/departments': { module: 'employees', requiredAccess: 'read' },

  // Attendance Module
  '/attendance': { module: 'attendance', requiredAccess: 'read' },
  '/attendance/logs': { module: 'attendance', requiredAccess: 'read' },
  '/attendance/shifts': { module: 'attendance', requiredAccess: 'read' },
  '/attendance/leave': { module: 'attendance', requiredAccess: 'read' },

  // Payroll Module
  '/payroll': { module: 'payroll', requiredAccess: 'read' },
  '/payroll/runs': { module: 'payroll', requiredAccess: 'read' },
  '/payroll/runs/new': { module: 'payroll', requiredAccess: 'full', requiredAction: 'create' },
  '/payroll/salary-structures': { module: 'payroll', requiredAccess: 'read' },

  // QHSE Module
  '/qhse': { module: 'qhse', requiredAccess: 'read' },
  '/qhse/policies': { module: 'qhse', requiredAccess: 'read' },
  '/qhse/procedures': { module: 'qhse', requiredAccess: 'read' },
  '/qhse/forms': { module: 'qhse', requiredAccess: 'read' },
  '/qhse/reports': { module: 'qhse', requiredAccess: 'read' },

  // Settings Module
  '/settings': { module: 'settings', requiredAccess: 'read' },
  '/settings/company': { module: 'settings', requiredAccess: 'full' },
  '/settings/users': { module: 'settings', requiredAccess: 'full' },
  '/settings/permissions': { module: 'settings', requiredAccess: 'full' },

  // Profile routes (accessible to all authenticated users)
  '/profile': { module: 'any', requiredAccess: 'read' },
  '/profile/edit': { module: 'any', requiredAccess: 'read' },
  '/profile/change-password': { module: 'any', requiredAccess: 'read' },
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/error',
  '/auth/verify-email',
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

  // Special case for 'any' module (profile routes)
  if (routePermission.module === 'any') {
    return true
  }

  // For now, allow all authenticated users access to all modules
  // TODO: Implement proper role-based access control with user metadata
  return true
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Allow access to public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    return response
  }

  // Redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Get user role from metadata (will be set during user creation)
  const userRole = user.user_metadata?.role as UserRole || UserRole.MANAGEMENT

  // Check route permissions
  const hasPermission = hasRoutePermission(userRole, pathname)

  if (!hasPermission) {
    // Redirect to unauthorized page or dashboard
    const unauthorizedUrl = new URL('/dashboard', request.url)
    unauthorizedUrl.searchParams.set('error', 'insufficient_permissions')
    return NextResponse.redirect(unauthorizedUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}