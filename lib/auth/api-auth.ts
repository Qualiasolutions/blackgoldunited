/**
 * API Authentication & Authorization Middleware
 *
 * This module provides enterprise-grade authentication and authorization
 * for all API endpoints in the BlackGoldUnited ERP system.
 *
 * Features:
 * - Session-based authentication via Supabase Auth
 * - Role-based access control (RBAC) with 5 user roles
 * - Granular permissions per HTTP method (GET, POST, PUT, DELETE)
 * - Comprehensive error handling with proper HTTP status codes
 *
 * @author BlackGoldUnited ERP Team
 * @version 1.0
 * @since Week 2 - API Infrastructure Implementation
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserRole, UserPermissions } from '@/lib/types/auth';
import { hasHTTPPermission, HTTPMethod } from './permissions';

/**
 * Authenticated user object returned by authentication middleware
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

/**
 * Authenticate and authorize API request
 *
 * This is the main authentication function used by all API endpoints.
 * It performs both authentication (user identity) and authorization (permissions).
 *
 * @param request - The Next.js API request object
 * @param module - The module being accessed (e.g., 'clients', 'sales')
 * @param method - The HTTP method (GET, POST, PUT, DELETE)
 * @returns Promise resolving to either success with user or failure with error
 *
 * @example
 * ```typescript
 * const authResult = await authenticateAndAuthorize(request, 'clients', 'GET');
 * if (!authResult.success) {
 *   return NextResponse.json({ error: authResult.error }, { status: authResult.status });
 * }
 * // Use authResult.user for authenticated operations
 * ```
 */
export async function authenticateAndAuthorize(
  request: NextRequest,
  module: keyof UserPermissions,
  method: HTTPMethod
): Promise<{ success: true; user: AuthenticatedUser } | { success: false; error: string; status: number }> {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return { success: false, error: 'Unauthorized - Please log in', status: 401 };
    }

    // Get user profile with role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, firstName, lastName, isActive')
      .eq('id', authUser.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile fetch error:', profileError);
      return { success: false, error: 'User profile not found', status: 404 };
    }

    // Check if user is active
    if (!userProfile.isActive) {
      return { success: false, error: 'Account is deactivated', status: 403 };
    }

    // Check role-based permissions
    const userRole = userProfile.role as UserRole;
    const hasPermission = hasHTTPPermission(userRole, module, method);

    if (!hasPermission) {
      return {
        success: false,
        error: `Insufficient permissions - ${userRole} role cannot ${method} ${module}`,
        status: 403
      };
    }

    return {
      success: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        role: userRole,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
      }
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Internal authentication error', status: 500 };
  }
}

/**
 * Simple authentication check without authorization (for read-only operations where RLS handles access)
 */
export async function authenticateUser(request: NextRequest): Promise<{ success: true; user: AuthenticatedUser } | { success: false; error: string; status: number }> {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return { success: false, error: 'Unauthorized - Please log in', status: 401 };
    }

    // Get user profile with role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, firstName, lastName, isActive')
      .eq('id', authUser.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile fetch error:', profileError);
      return { success: false, error: 'User profile not found', status: 404 };
    }

    // Check if user is active
    if (!userProfile.isActive) {
      return { success: false, error: 'Account is deactivated', status: 403 };
    }

    return {
      success: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role as UserRole,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
      }
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Internal authentication error', status: 500 };
  }
}