// Authentication Provider for BlackGoldUnited ERP
'use client'

import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Supabase handles authentication state internally
  // No provider wrapper needed
  return <>{children}</>
}