// Authentication Validation Utilities for BlackGoldUnited ERP
import { z } from 'zod'
import type {
  LoginCredentials,
  SignupData,
  PasswordResetRequest,
  PasswordReset,
  ChangePasswordData,
  ValidationError,
  AuthValidationResult
} from '@/lib/types/auth'

// Validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
})

export const signupSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['MANAGEMENT', 'FINANCE_TEAM', 'PROCUREMENT_BD', 'ADMIN_HR', 'IMS_QHSE']).optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim()
})

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ['newPassword']
})

// Validation helper functions
export function validateLogin(data: LoginCredentials): AuthValidationResult {
  try {
    loginSchema.parse(data)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => ({
          field: err.path[0] as string,
          message: err.message
        }))
      }
    }
    return {
      isValid: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    }
  }
}

export function validateSignup(data: SignupData): AuthValidationResult {
  try {
    signupSchema.parse(data)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => ({
          field: err.path[0] as string,
          message: err.message
        }))
      }
    }
    return {
      isValid: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    }
  }
}

export function validatePasswordResetRequest(data: PasswordResetRequest): AuthValidationResult {
  try {
    passwordResetRequestSchema.parse(data)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => ({
          field: err.path[0] as string,
          message: err.message
        }))
      }
    }
    return {
      isValid: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    }
  }
}

export function validatePasswordReset(data: PasswordReset): AuthValidationResult {
  try {
    passwordResetSchema.parse(data)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => ({
          field: err.path[0] as string,
          message: err.message
        }))
      }
    }
    return {
      isValid: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    }
  }
}

export function validateChangePassword(data: ChangePasswordData): AuthValidationResult {
  try {
    changePasswordSchema.parse(data)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => ({
          field: err.path[0] as string,
          message: err.message
        }))
      }
    }
    return {
      isValid: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    }
  }
}

// Additional validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isStrongPassword(password: string): {
  isStrong: boolean
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
} {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  }

  const isStrong = Object.values(requirements).every(Boolean)

  return { isStrong, requirements }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"']/g, '')
}

export function isValidResetToken(token: string): boolean {
  // Token should be a valid format (e.g., UUID or random string)
  return /^[a-zA-Z0-9-_]{32,}$/.test(token)
}