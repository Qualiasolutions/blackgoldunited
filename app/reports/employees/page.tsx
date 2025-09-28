'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/lib/hooks/useAuth'

export default function EmployeesReportPage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <MainLayout user={{ name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive employee analytics and reporting dashboard.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Employee Report Dashboard</h2>
          <p className="text-muted-foreground">
            Employee reports and analytics will be available here.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}