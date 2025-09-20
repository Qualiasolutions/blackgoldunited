// Route Protection Middleware for BlackGoldUnited ERP
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { UserRole, AccessLevel, ACCESS_CONTROL_MATRIX } from '@/lib/types/auth'

// Define protected routes and their required permissions based on BGU Portal Layout PDF
const ROUTE_PERMISSIONS: Record<string, {
  module: string
  requiredAccess: AccessLevel
  requiredAction?: 'create' | 'read' | 'update' | 'delete'
}> = {
  // Dashboard - requires basic read access to any module
  '/dashboard': { module: 'any', requiredAccess: AccessLevel.READ },

  // Sales Module (exact PDF mapping)
  '/sales': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/invoices': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/invoices/create': { module: 'sales', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/sales/rfq': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/rfq/create': { module: 'sales', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/sales/credit-notes': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/refunds': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/recurring': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/payments': { module: 'sales', requiredAccess: AccessLevel.READ },
  '/sales/settings': { module: 'sales', requiredAccess: AccessLevel.FULL },

  // Clients Module (exact PDF mapping)
  '/clients': { module: 'clients', requiredAccess: AccessLevel.READ },
  '/clients/create': { module: 'clients', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/clients/contacts': { module: 'clients', requiredAccess: AccessLevel.READ },
  '/clients/settings': { module: 'clients', requiredAccess: AccessLevel.FULL },

  // Inventory Module (exact PDF mapping)
  '/inventory': { module: 'inventory', requiredAccess: AccessLevel.READ },
  '/inventory/products': { module: 'inventory', requiredAccess: AccessLevel.READ },
  '/inventory/requisitions': { module: 'inventory', requiredAccess: AccessLevel.READ },
  '/inventory/pricing': { module: 'inventory', requiredAccess: AccessLevel.READ },
  '/inventory/warehouses': { module: 'inventory', requiredAccess: AccessLevel.READ },
  '/inventory/stock': { module: 'inventory', requiredAccess: AccessLevel.READ },
  '/inventory/settings': { module: 'inventory', requiredAccess: AccessLevel.FULL },
  '/inventory/product-settings': { module: 'inventory', requiredAccess: AccessLevel.FULL },

  // Purchase Module (exact PDF mapping)
  '/purchase': { module: 'purchase', requiredAccess: AccessLevel.READ },
  '/purchase/invoices': { module: 'purchase', requiredAccess: AccessLevel.READ },
  '/purchase/refunds': { module: 'purchase', requiredAccess: AccessLevel.READ },
  '/purchase/debit-notes': { module: 'purchase', requiredAccess: AccessLevel.READ },
  '/purchase/suppliers': { module: 'purchase', requiredAccess: AccessLevel.READ },
  '/purchase/payments': { module: 'purchase', requiredAccess: AccessLevel.READ },
  '/purchase/invoice-settings': { module: 'purchase', requiredAccess: AccessLevel.FULL },
  '/purchase/supplier-settings': { module: 'purchase', requiredAccess: AccessLevel.FULL },

  // Finance Module (exact PDF mapping)
  '/finance': { module: 'finance', requiredAccess: AccessLevel.READ },
  '/finance/expenses': { module: 'finance', requiredAccess: AccessLevel.READ },
  '/finance/incomes': { module: 'finance', requiredAccess: AccessLevel.READ },
  '/finance/accounts': { module: 'finance', requiredAccess: AccessLevel.READ },
  '/finance/settings': { module: 'finance', requiredAccess: AccessLevel.FULL },

  // Accounting Module (exact PDF mapping)
  '/accounting': { module: 'accounting', requiredAccess: AccessLevel.READ },
  '/accounting/journal': { module: 'accounting', requiredAccess: AccessLevel.READ },
  '/accounting/journal/create': { module: 'accounting', requiredAccess: AccessLevel.FULL, requiredAction: 'create' },
  '/accounting/chart': { module: 'accounting', requiredAccess: AccessLevel.READ },
  '/accounting/cost-centers': { module: 'accounting', requiredAccess: AccessLevel.READ },
  '/accounting/assets': { module: 'accounting', requiredAccess: AccessLevel.READ },
  '/accounting/settings': { module: 'accounting', requiredAccess: AccessLevel.FULL },

  // Employees Module (exact PDF mapping)
  '/employees': { module: 'employees', requiredAccess: AccessLevel.READ },
  '/employees/roles': { module: 'employees', requiredAccess: AccessLevel.FULL },
  '/employees/settings': { module: 'employees', requiredAccess: AccessLevel.FULL },

  // Organizational Structure Module (exact PDF mapping)
  '/organizational': { module: 'organizational', requiredAccess: AccessLevel.READ },
  '/organizational/designations': { module: 'organizational', requiredAccess: AccessLevel.FULL },
  '/organizational/departments': { module: 'organizational', requiredAccess: AccessLevel.FULL },
  '/organizational/levels': { module: 'organizational', requiredAccess: AccessLevel.FULL },
  '/organizational/employment-types': { module: 'organizational', requiredAccess: AccessLevel.FULL },
  '/organizational/chart': { module: 'organizational', requiredAccess: AccessLevel.READ },

  // Attendance Module (exact PDF mapping)
  '/attendance': { module: 'attendance', requiredAccess: AccessLevel.READ },
  '/attendance/logs': { module: 'attendance', requiredAccess: AccessLevel.READ },
  '/attendance/days': { module: 'attendance', requiredAccess: AccessLevel.READ },
  '/attendance/sheets': { module: 'attendance', requiredAccess: AccessLevel.READ },
  '/attendance/permissions': { module: 'attendance', requiredAccess: AccessLevel.FULL },
  '/attendance/leaves': { module: 'attendance', requiredAccess: AccessLevel.READ },
  '/attendance/shifts': { module: 'attendance', requiredAccess: AccessLevel.FULL },
  '/attendance/allocated-shifts': { module: 'attendance', requiredAccess: AccessLevel.FULL },
  '/attendance/sessions': { module: 'attendance', requiredAccess: AccessLevel.READ },
  '/attendance/settings': { module: 'attendance', requiredAccess: AccessLevel.FULL },

  // Payroll Module (exact PDF mapping)
  '/payroll': { module: 'payroll', requiredAccess: AccessLevel.READ },
  '/payroll/contracts': { module: 'payroll', requiredAccess: AccessLevel.FULL },
  '/payroll/pay-runs': { module: 'payroll', requiredAccess: AccessLevel.FULL },
  '/payroll/pay-slips': { module: 'payroll', requiredAccess: AccessLevel.READ },
  '/payroll/loans': { module: 'payroll', requiredAccess: AccessLevel.FULL },
  '/payroll/components': { module: 'payroll', requiredAccess: AccessLevel.FULL },
  '/payroll/structures': { module: 'payroll', requiredAccess: AccessLevel.FULL },
  '/payroll/settings': { module: 'payroll', requiredAccess: AccessLevel.FULL },

  // Reports Module (exact PDF mapping)
  '/reports': { module: 'reports', requiredAccess: AccessLevel.READ },
  '/reports/sales': { module: 'reports', requiredAccess: AccessLevel.READ },
  '/reports/purchase': { module: 'reports', requiredAccess: AccessLevel.READ },
  '/reports/accounting': { module: 'reports', requiredAccess: AccessLevel.READ },
  '/reports/employees': { module: 'reports', requiredAccess: AccessLevel.READ },
  '/reports/clients': { module: 'reports', requiredAccess: AccessLevel.READ },
  '/reports/inventory': { module: 'reports', requiredAccess: AccessLevel.READ },
  '/reports/activity': { module: 'reports', requiredAccess: AccessLevel.READ },

  // Templates Module (exact PDF mapping)
  '/templates': { module: 'templates', requiredAccess: AccessLevel.READ },
  '/templates/printable': { module: 'templates', requiredAccess: AccessLevel.FULL },
  '/templates/prefilled': { module: 'templates', requiredAccess: AccessLevel.FULL },
  '/templates/terms': { module: 'templates', requiredAccess: AccessLevel.FULL },
  '/templates/files': { module: 'templates', requiredAccess: AccessLevel.FULL },
  '/templates/reminders': { module: 'templates', requiredAccess: AccessLevel.FULL },

  // QHSE Module (exact PDF mapping)
  '/qhse': { module: 'qhse', requiredAccess: AccessLevel.READ },
  '/qhse/reports': { module: 'qhse', requiredAccess: AccessLevel.READ },
  '/qhse/policy': { module: 'qhse', requiredAccess: AccessLevel.FULL },
  '/qhse/procedures': { module: 'qhse', requiredAccess: AccessLevel.FULL },
  '/qhse/forms': { module: 'qhse', requiredAccess: AccessLevel.FULL },
  '/qhse/reports-alt': { module: 'qhse', requiredAccess: AccessLevel.READ },

  // Settings Module (exact PDF mapping)
  '/settings': { module: 'settings', requiredAccess: AccessLevel.READ },
  '/settings/account': { module: 'settings', requiredAccess: AccessLevel.FULL },
  '/settings/general': { module: 'settings', requiredAccess: AccessLevel.FULL },

  // Profile routes (accessible to all authenticated users)
  '/profile': { module: 'any', requiredAccess: AccessLevel.READ },
  '/profile/edit': { module: 'any', requiredAccess: AccessLevel.READ },
  '/profile/change-password': { module: 'any', requiredAccess: AccessLevel.READ },
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

  // Get user's access control matrix
  const userPermissions = ACCESS_CONTROL_MATRIX[userRole]
  if (!userPermissions) {
    return false
  }

  // Get module permission from access control matrix
  const modulePermission = userPermissions[routePermission.module as keyof typeof userPermissions]
  if (!modulePermission) {
    return false
  }

  // Check if user has no access to this module
  if (modulePermission.access === AccessLevel.NONE) {
    return false
  }

  // Check if route requires full access but user only has read access
  if (routePermission.requiredAccess === AccessLevel.FULL &&
      modulePermission.access === AccessLevel.READ) {
    return false
  }

  // Check specific action permission if required
  if (routePermission.requiredAction) {
    const actionAllowed = modulePermission.actions[routePermission.requiredAction]
    if (!actionAllowed) {
      return false
    }
  }

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