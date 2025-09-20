// Authentication Provider for BlackGoldUnited ERP
'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
  session?: any
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session} refetchInterval={60} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  )
}