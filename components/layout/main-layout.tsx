"use client"

import { Sidebar } from './sidebar'
import { Header } from './header'

interface MainLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
    role: string
  }
}

export function MainLayout({ children, user }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background flex-col">
      {/* Unified Header spanning full width */}
      <Header user={user} />

      {/* Main content area with sidebar and content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}