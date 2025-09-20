'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AttendancePage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()

  if (!hasModuleAccess('attendance')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the Attendance module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canCreate = hasFullAccess('attendance')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canCreate && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Clock className="w-4 h-4 mr-2" />
                  Mark Attendance
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

          {/* Attendance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
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
                <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">8</div>
                <p className="text-xs text-muted-foreground">
                  6% of total employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">12</div>
                <p className="text-xs text-muted-foreground">
                  Arrived after 9:00 AM
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.2h</div>
                <p className="text-xs text-muted-foreground">
                  Daily average this month
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
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Clock In/Out</h3>
                    <p className="text-sm text-gray-600">Track daily attendance</p>
                    {canCreate && (
                      <Button size="sm" className="mt-2">
                        <Clock className="w-3 h-3 mr-1" />
                        Mark Attendance
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
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Leave Management</h3>
                    <p className="text-sm text-gray-600">Request and approve leave</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Attendance Reports</h3>
                    <p className="text-sm text-gray-600">Generate attendance analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Attendance */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Today's Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'John Smith', id: 'EMP-001', clockIn: '8:45 AM', clockOut: '-', status: 'Present', hours: '6h 15m' },
                  { name: 'Sarah Johnson', id: 'EMP-002', clockIn: '9:15 AM', clockOut: '-', status: 'Late', hours: '5h 45m' },
                  { name: 'Michael Brown', id: 'EMP-003', clockIn: '-', clockOut: '-', status: 'On Leave', hours: '0h' },
                  { name: 'Emily Davis', id: 'EMP-004', clockIn: '8:30 AM', clockOut: '-', status: 'Present', hours: '6h 30m' },
                  { name: 'David Wilson', id: 'EMP-005', clockIn: '-', clockOut: '-', status: 'Absent', hours: '0h' },
                ].map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-sm font-medium">{record.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-medium">{record.name}</p>
                        <p className="text-sm text-gray-600">{record.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium">Clock In</p>
                        <p className="text-sm text-gray-600">{record.clockIn}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-medium">Clock Out</p>
                        <p className="text-sm text-gray-600">{record.clockOut}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-medium">Hours</p>
                        <p className="text-sm text-gray-600">{record.hours}</p>
                      </div>

                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          record.status === 'Present' ? 'bg-green-100 text-green-800' :
                          record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                          record.status === 'On Leave' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
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

          {/* Attendance Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { day: 'Monday', present: 138, absent: 4, rate: 97 },
                    { day: 'Tuesday', present: 142, absent: 0, rate: 100 },
                    { day: 'Wednesday', present: 135, absent: 7, rate: 95 },
                    { day: 'Thursday', present: 140, absent: 2, rate: 99 },
                    { day: 'Friday', present: 134, absent: 8, rate: 94 },
                  ].map((day) => (
                    <div key={day.day} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day.day}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-green-600">{day.present} present</span>
                        <span className="text-sm text-red-600">{day.absent} absent</span>
                        <span className="text-sm font-medium">{day.rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Alice Cooper', type: 'Sick Leave', dates: 'Jan 20-22', status: 'Pending' },
                    { name: 'Bob Smith', type: 'Vacation', dates: 'Jan 25-29', status: 'Approved' },
                    { name: 'Carol Davis', type: 'Personal', dates: 'Feb 1', status: 'Approved' },
                    { name: 'Dan Wilson', type: 'Sick Leave', dates: 'Feb 3-4', status: 'Pending' },
                  ].map((request, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium text-sm">{request.name}</p>
                        <p className="text-xs text-gray-600">{request.type} • {request.dates}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
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