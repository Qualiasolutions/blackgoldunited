// Authentication Hooks for BlackGoldUnited ERP
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import type {
  LoginCredentials,
  SignupData,
  PasswordResetRequest,
  PasswordReset,
  ChangePasswordData,
  AuthResponse,
  SessionUser
} from '@/lib/types/auth'
import { validateLogin, validateSignup, validatePasswordResetRequest, validatePasswordReset, validateChangePassword } from '@/lib/auth/validation'

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
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

      // Attempt sign in
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false
      })

      if (result?.error) {
        const errorMessage = 'Invalid email or password'
        setError(errorMessage)
        return { success: false, message: errorMessage }
      }

      if (result?.ok) {
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
  }, [router])

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      await signOut({ callbackUrl: '/auth/login' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (data: SignupData): Promise<AuthResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate signup data
      const validation = validateSignup(data)
      if (!validation.isValid) {
        const errorMessage = validation.errors.map(e => e.message).join(', ')
        setError(errorMessage)
        return { success: false, message: errorMessage }
      }

      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Signup failed')
        return { success: false, message: result.message || 'Signup failed' }
      }

      return { success: true, message: 'Account created successfully' }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const requestPasswordReset = useCallback(async (data: PasswordResetRequest): Promise<AuthResponse> => {
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

      // Call password reset API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Password reset request failed')
        return { success: false, message: result.message || 'Password reset request failed' }
      }

      return { success: true, message: 'Password reset email sent successfully' }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (data: PasswordReset): Promise<AuthResponse> => {
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

      // Call password reset confirmation API
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Password reset failed')
        return { success: false, message: result.message || 'Password reset failed' }
      }

      return { success: true, message: 'Password reset successfully' }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const changePassword = useCallback(async (data: ChangePasswordData): Promise<AuthResponse> => {
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

      // Call change password API
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Password change failed')
        return { success: false, message: result.message || 'Password change failed' }
      }

      return { success: true, message: 'Password changed successfully' }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (data: Partial<SessionUser>): Promise<AuthResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      // Update session
      await update(data)
      return { success: true, message: 'Profile updated successfully' }
    } catch (error) {
      const errorMessage = 'Profile update failed'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [update])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Session data
    user: session?.user as SessionUser | undefined,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading' || isLoading,
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

  const hasPermission = useCallback((module: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
    if (!user?.permissions) return false

    const modulePermission = user.permissions[module as keyof typeof user.permissions]
    if (!modulePermission) return false

    return modulePermission.actions[action]
  }, [user])

  const hasModuleAccess = useCallback((module: string): boolean => {
    if (!user?.permissions) return false

    const modulePermission = user.permissions[module as keyof typeof user.permissions]
    if (!modulePermission) return false

    return modulePermission.access !== 'NONE'
  }, [user])

  const hasFullAccess = useCallback((module: string): boolean => {
    if (!user?.permissions) return false

    const modulePermission = user.permissions[module as keyof typeof user.permissions]
    if (!modulePermission) return false

    return modulePermission.access === 'FULL'
  }, [user])

  const hasReadOnlyAccess = useCallback((module: string): boolean => {
    if (!user?.permissions) return false

    const modulePermission = user.permissions[module as keyof typeof user.permissions]
    if (!modulePermission) return false

    return modulePermission.access === 'READ'
  }, [user])

  return {
    hasPermission,
    hasModuleAccess,
    hasFullAccess,
    hasReadOnlyAccess,
    userRole: user?.role,
    permissions: user?.permissions
  }
}