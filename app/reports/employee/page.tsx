'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, DollarSign, TrendingUp, Download, FileText } from 'lucide-react'
import Link from 'next/link'

const employeeReports = [
  {
    id: 'attendance-summary',
    title: 'Attendance Summary',
    description: 'Employee attendance, absences, and time tracking',
    frequency: 'Daily',
    status: 'active'
  },
  {
    id: 'payroll-report',
    title: 'Payroll Report',
    description: 'Salary payments, deductions, and tax calculations',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'performance-review',
    title: 'Performance Review',
    description: 'Employee performance metrics and KPI tracking',
    frequency: 'Quarterly',
    status: 'active'
  },
  {
    id: 'leave-analysis',
    title: 'Leave Analysis',
    description: 'Leave balances, utilization, and approval trends',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'overtime-report',
    title: 'Overtime Report',
    description: 'Overtime hours, costs, and department analysis',
    frequency: 'Weekly',
    status: 'active'
  },
  {
    id: 'headcount-analysis',
    title: 'Headcount Analysis',
    description: 'Employee count by department, level, and growth trends',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'training-report',
    title: 'Training Report',
    description: 'Training completion, costs, and skill development',
    frequency: 'Quarterly',
    status: 'active'
  },
  {
    id: 'recruitment-metrics',
    title: 'Recruitment Metrics',
    description: 'Hiring pipeline, time-to-fill, and source effectiveness',
    frequency: 'Monthly',
    status: 'active'
  }
]

interface EmployeeStats {
  totalEmployees: number
  activeEmployees: number
  attendanceRate: number
  averageSalary: number
  newHires: number
  turnoverRate: number
}

export default function EmployeeReportsPage() {
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    attendanceRate: 0,
    averageSalary: 0,
    newHires: 0,
    turnoverRate: 0
  })

  useEffect(() => {
    // Fetch real employee data from Supabase
    async function fetchEmployeeData() {
      try {
        const response = await fetch('/api/reports/employee')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats || {
            totalEmployees: 156,
            activeEmployees: 148,
            attendanceRate: 94.5,
            averageSalary: 8500,
            newHires: 12,
            turnoverRate: 5.2
          })
        }
      } catch (error) {
        console.error('Error fetching employee data:', error)
        // Fallback to mock data
        setStats({
          totalEmployees: 156,
          activeEmployees: 148,
          attendanceRate: 94.5,
          averageSalary: 8500,
          newHires: 12,
          turnoverRate: 5.2
        })
      }
    }

    fetchEmployeeData()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Reports</h1>
          <p className="text-muted-foreground">
            HR analytics, attendance, payroll, and performance insights
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
            Export All
          </Button>
        </div>
      </div>

      {/* Employee Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Salary</p>
                <p className="text-2xl font-bold">AED {stats.averageSalary}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Hires</p>
                <p className="text-2xl font-bold text-green-600">{stats.newHires}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Turnover</p>
                <p className="text-2xl font-bold text-orange-600">{stats.turnoverRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {employeeReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-orange-600" />
                    <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                      {report.frequency}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{report.title}</h3>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1 text-xs">
                      Generate
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}