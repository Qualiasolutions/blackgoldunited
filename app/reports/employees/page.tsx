'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, Calendar, DollarSign, Download, FileText, Loader2, TrendingDown } from 'lucide-react'
import Link from 'next/link'

const employeeReports = [
  {
    id: 'headcount',
    title: 'Headcount Report',
    description: 'Employee count by department, level, and type',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'attendance',
    title: 'Attendance Summary',
    description: 'Attendance, leaves, and time-off analysis',
    frequency: 'Weekly',
    status: 'active'
  },
  {
    id: 'payroll',
    title: 'Payroll Report',
    description: 'Salary, deductions, and payroll expenses',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'performance',
    title: 'Performance Review',
    description: 'Employee performance and KPI tracking',
    frequency: 'Quarterly',
    status: 'active'
  },
  {
    id: 'turnover',
    title: 'Turnover Analysis',
    description: 'Employee retention and turnover rates',
    frequency: 'Quarterly',
    status: 'active'
  },
  {
    id: 'demographics',
    title: 'Demographics',
    description: 'Workforce composition and diversity metrics',
    frequency: 'Annual',
    status: 'active'
  }
]

export default function EmployeesReportPage() {
  const { user } = useAuth()
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/reports/employee')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch employee data')
        }

        if (result.success) {
          setEmployeeData(result.data)
        }
      } catch (error) {
        console.error('Error fetching employee data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchEmployeeData()
    }
  }, [user])

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading employee reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <TrendingDown className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = employeeData || {}

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive employee analytics and reporting dashboard
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/reports">
              Back to Reports
            </Link>
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{stats.totalEmployees || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Employees</p>
                <p className="text-2xl font-bold">{stats.activeEmployees || 0}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Tenure</p>
                <p className="text-2xl font-bold">{((stats.averageTenure || 0) / 365).toFixed(1)}y</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Salary</p>
                <p className="text-2xl font-bold">AED {((stats.averageSalary || 0) / 1000).toFixed(1)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Employee Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeeReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                      {report.frequency}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{report.title}</h3>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                  </div>
                  <Button size="sm" className="w-full text-xs">
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}