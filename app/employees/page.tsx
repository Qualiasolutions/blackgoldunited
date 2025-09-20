'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, UserPlus, Award, Calendar, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  salary: number
  isActive: boolean
  hireDate: string
  createdAt: string
}

export default function EmployeesPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canCreate = hasFullAccess('employees')
  const canRead = hasModuleAccess('employees')

  useEffect(() => {
    if (canRead) {
      fetchEmployees()
    }
  }, [canRead])

  const fetchEmployees = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('deletedAt', null)
        .order('firstName')

      if (error) throw error

      const formattedEmployees = (data || []).map(emp => ({
        id: emp.id,
        employeeNumber: emp.employeeNumber || '',
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        email: emp.email || '',
        phone: emp.phone || '',
        salary: Number(emp.salary) || 0,
        isActive: emp.isActive !== false,
        hireDate: emp.hireDate,
        createdAt: emp.createdAt
      }))

      setEmployees(formattedEmployees)
    } catch (error) {
      console.error('Error fetching employees:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access Employee management.</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate real statistics from employee data
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(emp => emp.isActive).length
  const recentHires = employees.filter(emp => {
    const hireDate = new Date(emp.hireDate)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return hireDate >= oneMonthAgo
  }).length
  const averageSalary = employees.length > 0
    ? employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                <p className="text-sm text-gray-600">Manage workforce and HR data</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{totalEmployees}</span> total employees
              </div>
              {canCreate && (
                <Link href="/employees/create">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Employee Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{totalEmployees}</div>
                <p className="text-xs text-blue-600">
                  +{recentHires} hired this month
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Active Employees</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{activeEmployees}</div>
                <p className="text-xs text-green-600">
                  {totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800">Average Salary</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">
                  ${averageSalary.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-yellow-600">
                  Per employee annually
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">Recent Hires</CardTitle>
                <UserPlus className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{recentHires}</div>
                <p className="text-xs text-purple-600">
                  New hires this month
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
              <CardTitle className="flex items-center justify-between">
                <span>Employee Directory ({totalEmployees})</span>
                {loading && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1 animate-pulse" />
                    Loading...
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-4">Error: {error}</div>
                  <Button onClick={fetchEmployees} variant="outline">
                    Retry
                  </Button>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Found</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first employee.</p>
                  {canCreate && (
                    <Link href="/employees/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Employee
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-medium">
                          <span className="text-sm">{employee.firstName[0]}{employee.lastName[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</p>
                          <p className="text-sm text-gray-600">ID: {employee.employeeNumber}</p>
                          <p className="text-sm text-gray-500">{employee.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <p className="text-sm text-gray-600">
                            ${employee.salary.toLocaleString()} / year
                          </p>
                          <p className="text-xs text-gray-400">
                            Hired: {new Date(employee.hireDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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