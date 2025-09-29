'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, Users, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function AttendancePage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [todayLogs, setTodayLogs] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true)

        // Fetch attendance stats
        const statsRes = await fetch('/api/hr/attendance/stats')
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.data)
        }

        // Fetch today's attendance logs
        const today = new Date().toISOString().split('T')[0]
        const logsRes = await fetch(`/api/hr/attendance?startDate=${today}&endDate=${today}&limit=10`)
        if (logsRes.ok) {
          const logsData = await logsRes.json()
          setTodayLogs(logsData.data || [])
        }

        // Fetch leave requests
        const leaveRes = await fetch('/api/hr/attendance/leave-requests?limit=5')
        if (leaveRes.ok) {
          const leaveData = await leaveRes.json()
          setLeaveRequests(leaveData.data || [])
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (hasModuleAccess('attendance')) {
      fetchAttendanceData()
    }
  }, [hasModuleAccess])

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
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600">{stats?.presentToday || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.attendanceRate || 0}% attendance rate
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-red-600">{stats?.absentToday || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.totalEmployees ? Math.round((stats.absentToday / stats.totalEmployees) * 100) : 0}% of total employees
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-yellow-600">{stats?.lateArrivals || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Arrived after scheduled time
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.avgHours || 0}h</div>
                    <p className="text-xs text-muted-foreground">
                      Daily average today
                    </p>
                  </>
                )}
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-gray-500">Loading attendance logs...</span>
                </div>
              ) : todayLogs.length > 0 ? (
                <div className="space-y-4">
                  {todayLogs.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {record.employee?.firstName?.[0]}{record.employee?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{record.employee?.firstName} {record.employee?.lastName}</p>
                          <p className="text-sm text-gray-600">{record.employee?.employeeNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm font-medium">Clock In</p>
                          <p className="text-sm text-gray-600">{record.checkIn || record.check_in || '-'}</p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm font-medium">Clock Out</p>
                          <p className="text-sm text-gray-600">{record.checkOut || record.check_out || '-'}</p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm font-medium">Hours</p>
                          <p className="text-sm text-gray-600">{record.hoursWorked ? `${record.hoursWorked}h` : '-'}</p>
                        </div>

                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.status === 'PRESENT' || record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'LATE' || record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'LEAVE' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No attendance records for today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(stats?.weeklyTrend || []).map((day: any) => (
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
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : leaveRequests.length > 0 ? (
                  <div className="space-y-3">
                    {leaveRequests.map((request, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium text-sm">{request.name}</p>
                          <p className="text-xs text-gray-600">{request.type} • {request.dates}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          request.status === 'APPROVED' || request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No leave requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}