'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Calculator, FileText, Users, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function PayrollPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()

  if (!hasModuleAccess('payroll')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the Payroll module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canCreate = hasFullAccess('payroll')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canCreate && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Calculator className="w-4 h-4 mr-2" />
                  Process Payroll
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

          {/* Payroll Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$486,200</div>
                <p className="text-xs text-muted-foreground">
                  Current month total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employees Paid</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">142</div>
                <p className="text-xs text-muted-foreground">
                  Out of 142 total employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payslips</CardTitle>
                <FileText className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">8</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$3,424</div>
                <p className="text-xs text-muted-foreground">
                  Monthly average
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
                    <Calculator className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Process Payroll</h3>
                    <p className="text-sm text-gray-600">Calculate and process monthly salaries</p>
                    {canCreate && (
                      <Button size="sm" className="mt-2">
                        <Calculator className="w-3 h-3 mr-1" />
                        Start Processing
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Generate Payslips</h3>
                    <p className="text-sm text-gray-600">Create and distribute payslips</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Salary Structure</h3>
                    <p className="text-sm text-gray-600">Manage employee compensation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payroll Records */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Payroll Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'John Smith', id: 'EMP-001', baseSalary: 5800, allowances: 1200, deductions: 580, netPay: 6420, status: 'Paid' },
                  { name: 'Sarah Johnson', id: 'EMP-002', baseSalary: 4200, allowances: 800, deductions: 420, netPay: 4580, status: 'Paid' },
                  { name: 'Michael Brown', id: 'EMP-003', baseSalary: 6500, allowances: 1500, deductions: 650, netPay: 7350, status: 'Processing' },
                  { name: 'Emily Davis', id: 'EMP-004', baseSalary: 3800, allowances: 600, deductions: 380, netPay: 4020, status: 'Paid' },
                  { name: 'David Wilson', id: 'EMP-005', baseSalary: 4800, allowances: 900, deductions: 480, netPay: 5220, status: 'Processing' },
                ].map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-sm font-medium">{record.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-medium">{record.name}</p>
                        <p className="text-sm text-gray-600">{record.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">Base Salary</p>
                        <p className="text-gray-600">${record.baseSalary.toLocaleString()}</p>
                      </div>

                      <div className="text-center">
                        <p className="font-medium">Allowances</p>
                        <p className="text-green-600">+${record.allowances.toLocaleString()}</p>
                      </div>

                      <div className="text-center">
                        <p className="font-medium">Deductions</p>
                        <p className="text-red-600">-${record.deductions.toLocaleString()}</p>
                      </div>

                      <div className="text-center">
                        <p className="font-medium">Net Pay</p>
                        <p className="font-bold">${record.netPay.toLocaleString()}</p>
                      </div>

                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          record.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payroll Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Payroll Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Base Salaries</span>
                    <span className="font-medium">$398,400</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Allowances</span>
                    <span className="font-medium text-green-600">+$67,200</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tax Deductions</span>
                    <span className="font-medium text-red-600">-$45,600</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Other Deductions</span>
                    <span className="font-medium text-red-600">-$18,200</span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-bold">
                    <span>Net Payroll</span>
                    <span className="text-green-600">$401,800</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Payroll Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: 'Jan 31, 2025', type: 'Monthly Salary', employees: 142, amount: 486200 },
                    { date: 'Feb 15, 2025', type: 'Bonus Payment', employees: 35, amount: 85000 },
                    { date: 'Feb 28, 2025', type: 'Monthly Salary', employees: 142, amount: 492000 },
                    { date: 'Mar 15, 2025', type: 'Performance Bonus', employees: 28, amount: 62000 },
                  ].map((schedule, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium text-sm">{schedule.type}</p>
                        <p className="text-xs text-gray-600">{schedule.date} • {schedule.employees} employees</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${schedule.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}