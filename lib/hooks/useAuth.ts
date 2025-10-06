// Authentication Hooks for BlackGoldUnited ERP
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type {
  LoginCredentials,
  SignupData, // Keep for type compatibility but not used
  PasswordResetRequest,
  PasswordReset,
  ChangePasswordData,
  AuthResponse,
  SessionUser
} from '@/lib/types/auth'
import { UserRole, ACCESS_CONTROL_MATRIX } from '@/lib/types/auth'
import { validateLogin, validatePasswordResetRequest, validatePasswordReset, validateChangePassword } from '@/lib/auth/validation'
// validateSignup removed - signup is managed through Supabase dashboard

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sessionUser, setSessionUser] = useState<SessionUser | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        const userData = convertToSessionUser(session.user)
        setSessionUser(userData)
      }
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const userData = convertToSessionUser(session.user)
          setSessionUser(userData)
        } else {
          setSessionUser(undefined)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const convertToSessionUser = (user: User): SessionUser => {
    const role = (user.user_metadata?.role as UserRole) || UserRole.MANAGEMENT
    // Get permissions from ACCESS_CONTROL_MATRIX based on user role
    const permissions = ACCESS_CONTROL_MATRIX[role]

    return {
      id: user.id,
      email: user.email!,
      firstName: user.user_metadata?.firstName || '',
      lastName: user.user_metadata?.lastName || '',
      role,
      permissions,
      employeeId: user.user_metadata?.employeeId
    }
  }

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate credentials
      const validation = validateLogin(credentials)
      if (!validation.isValid) {
        const errorMessage = validation.errors.map(e => e.message).join(', ')
        setError(errorMessage)
        return { success: false, message: errorMessage }
      }

      // Attempt sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        const errorMessage = 'Invalid email or password'
        setError(errorMessage)
        return { success: false, message: errorMessage }
      }

      if (data.user) {
        router.push('/dashboard')
        return { success: true, message: 'Login successful' }
      }

      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Signup functionality is disabled - accounts are created directly in Supabase dashboard
  const signup = async (data: SignupData): Promise<AuthResponse> => {
    // Account creation is managed by administrators through Supabase dashboard
    return {
      success: false,
      message: 'Account creation is managed by administrators. Please contact your system administrator.'
    }
  }

  const requestPasswordReset = async (data: PasswordResetRequest): Promise<AuthResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate email
      const validation = validatePasswordResetRequest(data)
      if (!validation.isValid) {
        const errorMessage = validation.errors.map(e => e.message).join(', ')
        setError(errorMessage)
        return { success: false, message: errorMessage }
      }

      // Request password reset with Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        setError(error.message || 'Password reset request failed')
        return { success: false, message: error.message || 'Password reset request failed' }
      }

      return { success: true, message: 'Password reset email sent successfully' }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (data: PasswordReset): Promise<AuthResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate reset data
      const validation = validatePasswordReset(data)
      if (!validation.isValid) {
        const errorMessage = validation.errors.map(e => e.message).join(', ')
        setError(errorMessage)
        return { success: false, message: errorMessage }
      }

      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) {
        setError(error.message || 'Password reset failed')
        return { success: false, message: error.message || 'Password reset failed' }
      }

      return { success: true, message: 'Password reset successfully' }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const changePassword = async (data: ChangePasswordData): Promise<AuthResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate password change data
      const validation = validateChangePassword(data)
      if (!validation.isValid) {
        const errorMessage = validation.errors.map(e => e.message).join(', ')
        setError(errorMessage)
        return { success: false, message: errorMessage }
      }

      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })

      if (error) {
        setError(error.message || 'Password change failed')
        return { success: false, message: error.message || 'Password change failed' }
      }

      return { success: true, message: 'Password changed successfully' }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (data: Partial<SessionUser>): Promise<AuthResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      // Update user metadata with Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          employeeId: data.employeeId
        }
      })

      if (error) {
        setError(error.message || 'Profile update failed')
        return { success: false, message: error.message || 'Profile update failed' }
      }

      return { success: true, message: 'Profile updated successfully' }
    } catch (error) {
      const errorMessage = 'Profile update failed'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    // Session data
    user: sessionUser,
    isAuthenticated: !!user,
    isLoading,
    error,

    // Auth actions
    login,
    logout,
    signup,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateProfile,
    clearError
  }
}

// Permission checking hook
export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (module: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
    if (!user?.permissions) return false

    const modulePermission = user.permissions[module as keyof typeof user.permissions]
    if (!modulePermission) return false

    return modulePermission.actions[action]
  }

  const hasModuleAccess = (module: string): boolean => {
    if (!user?.permissions) return false

    const modulePermission = user.permissions[module as keyof typeof user.permissions]
    if (!modulePermission) return false

    return modulePermission.access !== 'NONE'
  }

  const hasFullAccess = (module: string): boolean => {
    if (!user?.permissions) return false

    const modulePermission = user.permissions[module as keyof typeof user.permissions]
    if (!modulePermission) return false

    return modulePermission.access === 'FULL'
  }

  const hasReadOnlyAccess = (module: string): boolean => {
    if (!user?.permissions) return false

    const modulePermission = user.permissions[module as keyof typeof user.permissions]
    if (!modulePermission) return false

    return modulePermission.access === 'READ'
  }

  return {
    hasPermission,
    hasModuleAccess,
    hasFullAccess,
    hasReadOnlyAccess,
    userRole: user?.role,
    permissions: user?.permissions
  }
}