'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, UserPlus, Award, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

export default function EmployeesPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()

  if (!hasModuleAccess('employees')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the Employees module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canCreate = hasFullAccess('employees')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canCreate && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              )}
              <Link href="/dashboard">
                <Button variant="outline">← Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Employee Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142</div>
                <p className="text-xs text-muted-foreground">
                  +8 hired this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">134</div>
                <p className="text-xs text-muted-foreground">
                  94% attendance rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">8</div>
                <p className="text-xs text-muted-foreground">
                  Approved leave requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  Active departments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Employee Directory</h3>
                    <p className="text-sm text-gray-600">View and manage employee profiles</p>
                    {canCreate && (
                      <Button size="sm" className="mt-2">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Employee
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/attendance">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Attendance Tracking</h3>
                      <p className="text-sm text-gray-600">Monitor attendance and timesheets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/payroll">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Payroll Management</h3>
                      <p className="text-sm text-gray-600">Process salaries and benefits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Employee List */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'EMP-001', name: 'John Smith', department: 'Engineering', position: 'Senior Engineer', status: 'Present', email: 'john.smith@bgu.com' },
                  { id: 'EMP-002', name: 'Sarah Johnson', department: 'Finance', position: 'Financial Analyst', status: 'Present', email: 'sarah.johnson@bgu.com' },
                  { id: 'EMP-003', name: 'Michael Brown', department: 'Operations', position: 'Operations Manager', status: 'On Leave', email: 'michael.brown@bgu.com' },
                  { id: 'EMP-004', name: 'Emily Davis', department: 'HR', position: 'HR Specialist', status: 'Present', email: 'emily.davis@bgu.com' },
                  { id: 'EMP-005', name: 'David Wilson', department: 'Sales', position: 'Sales Representative', status: 'Present', email: 'david.wilson@bgu.com' },
                ].map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-sm font-medium">{employee.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-gray-600">{employee.position} • {employee.department}</p>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        employee.status === 'Present' ? 'bg-green-100 text-green-800' :
                        employee.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {employee.status}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">{employee.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Department Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Engineering', employees: 45, manager: 'John Smith' },
                  { name: 'Finance', employees: 18, manager: 'Sarah Johnson' },
                  { name: 'Operations', employees: 32, manager: 'Michael Brown' },
                  { name: 'Sales', employees: 24, manager: 'David Wilson' },
                  { name: 'HR', employees: 8, manager: 'Emily Davis' },
                  { name: 'Administration', employees: 15, manager: 'Lisa Anderson' },
                ].map((dept) => (
                  <div key={dept.name} className="p-4 border rounded-lg">
                    <h4 className="font-semibold">{dept.name}</h4>
                    <p className="text-sm text-gray-600">{dept.employees} employees</p>
                    <p className="text-sm text-gray-500">Manager: {dept.manager}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}