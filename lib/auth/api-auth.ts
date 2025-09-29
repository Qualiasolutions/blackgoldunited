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
    let { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, is_active')
      .eq('id', authUser.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile fetch error for user:', authUser.id, {
        error: profileError,
        code: profileError?.code,
        message: profileError?.message,
        details: profileError?.details,
        hint: profileError?.hint
      });

      // Validate required fields before creating profile
      if (!authUser.id || !authUser.email) {
        console.error('Missing required auth user data:', {
          hasId: !!authUser.id,
          hasEmail: !!authUser.email
        });
        return {
          success: false,
          error: 'Incomplete authentication data',
          status: 500
        };
      }

      // Create a default user profile if it doesn't exist
      const defaultProfile = {
        id: authUser.id,
        email: authUser.email,
        role: 'MANAGEMENT' as UserRole, // Default to MANAGEMENT role
        first_name: authUser.user_metadata?.first_name || 'User',
        last_name: authUser.user_metadata?.last_name || 'Name',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Attempting to create user profile:', {
        userId: authUser.id,
        email: authUser.email,
        profileData: defaultProfile
      });

      // Try to insert the default profile
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert([defaultProfile])
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create user profile - Detailed error:', {
          error: insertError,
          code: insertError?.code,
          message: insertError?.message,
          details: insertError?.details,
          hint: insertError?.hint,
          userId: authUser.id,
          email: authUser.email
        });

        // If the error is "already exists", try to fetch the profile again
        if (insertError?.code === '23505') {
          console.log('Profile already exists, attempting to fetch again...');
          const { data: existingProfile, error: refetchError } = await supabase
            .from('users')
            .select('id, email, role, first_name, last_name, is_active')
            .eq('id', authUser.id)
            .single();

          if (!refetchError && existingProfile) {
            console.log('Successfully retrieved existing profile on retry');
            userProfile = existingProfile;
          } else {
            console.error('Failed to retrieve existing profile:', refetchError);
            return {
              success: false,
              error: 'User profile exists but cannot be accessed. Please contact administrator.',
              status: 500
            };
          }
        } else {
          // For other errors, provide specific error messages
          let errorMessage = 'User profile setup failed';
          if (insertError?.code === '42501') {
            errorMessage = 'Permission denied - unable to create user profile';
          } else if (insertError?.code === '23502') {
            errorMessage = 'Missing required fields for user profile creation';
          }

          return {
            success: false,
            error: `${errorMessage}: ${insertError?.message || 'Unknown error'}`,
            status: 500
          };
        }
      } else {
        console.log('Successfully created user profile:', {
          userId: newProfile?.id,
          email: newProfile?.email,
          role: newProfile?.role
        });

        // Use the newly created profile
        userProfile = newProfile;
      }
    }

    // Check if user is active
    if (!userProfile?.is_active) {
      return { success: false, error: 'Account is deactivated', status: 403 };
    }

    // Check role-based permissions
    const userRole = userProfile?.role as UserRole;
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
        id: userProfile?.id || '',
        email: userProfile?.email || '',
        role: userRole,
        firstName: userProfile?.first_name || '',
        lastName: userProfile?.last_name || '',
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
    let { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, is_active')
      .eq('id', authUser.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile fetch error:', profileError);
      return { success: false, error: 'User profile not found', status: 404 };
    }

    // Check if user is active
    if (!userProfile.is_active) {
      return { success: false, error: 'Account is deactivated', status: 403 };
    }

    return {
      success: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role as UserRole,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
      }
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Internal authentication error', status: 500 };
  }
}