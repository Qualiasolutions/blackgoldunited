'use client'

import { useEffect, useState } from 'react'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Download,
  FileText,
  ArrowLeft,
  Loader2,
  Calendar,
  Users,
  Lock
} from 'lucide-react'
import Link from 'next/link'

interface AttendanceSheet {
  employeeId: string
  employeeName: string
  employeeNumber: string
  department: string
  present: number
  absent: number
  late: number
  leaves: number
  totalDays: number
  attendanceRate: number
}

export default function AttendanceSheetsPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [sheets, setSheets] = useState<AttendanceSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState('')

  const canManage = hasFullAccess('attendance')
  const canRead = hasModuleAccess('attendance')

  useEffect(() => {
    if (canRead) {
      fetchSheets()
    }
  }, [canRead, selectedMonth])

  const fetchSheets = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/hr/attendance/stats')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch attendance sheets')
      }

      if (result.success) {
        // Generate mock sheet data
        const mockSheets: AttendanceSheet[] = [
          {
            employeeId: '1',
            employeeName: 'John Doe',
            employeeNumber: 'EMP001',
            department: 'Engineering',
            present: 22,
            absent: 2,
            late: 3,
            leaves: 1,
            totalDays: 26,
            attendanceRate: 88.5
          },
          {
            employeeId: '2',
            employeeName: 'Jane Smith',
            employeeNumber: 'EMP002',
            department: 'Sales',
            present: 24,
            absent: 1,
            late: 1,
            leaves: 0,
            totalDays: 26,
            attendanceRate: 96.2
          },
          {
            employeeId: '3',
            employeeName: 'Mike Johnson',
            employeeNumber: 'EMP003',
            department: 'HR',
            present: 23,
            absent: 2,
            late: 2,
            leaves: 1,
            totalDays: 26,
            attendanceRate: 92.3
          }
        ]
        setSheets(mockSheets)
      }
    } catch (error) {
      console.error('Error fetching attendance sheets:', error)
      setError(error instanceof Error ? error.message : 'Failed to load attendance sheets')
    } finally {
      setLoading(false)
    }
  }

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access Attendance module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const avgAttendanceRate = sheets.length > 0
    ? sheets.reduce((sum, sheet) => sum + sheet.attendanceRate, 0) / sheets.length
    : 0
  const totalPresent = sheets.reduce((sum, sheet) => sum + sheet.present, 0)
  const totalAbsent = sheets.reduce((sum, sheet) => sum + sheet.absent, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Attendance Sheets</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/attendance">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold">{sheets.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Attendance</p>
                    <p className="text-2xl font-bold text-green-600">{avgAttendanceRate.toFixed(1)}%</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Present Days</p>
                    <p className="text-2xl font-bold">{totalPresent}</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-01">January 2025</SelectItem>
                    <SelectItem value="2024-12">December 2024</SelectItem>
                    <SelectItem value="2024-11">November 2024</SelectItem>
                    <SelectItem value="2024-10">October 2024</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchSheets}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Generate Sheet
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sheets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Attendance Sheet</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">{error}</div>
              ) : sheets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No attendance sheets found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Department
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Present
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Absent
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Late
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Leaves
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Total Days
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Attendance %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sheets.map((sheet) => (
                        <tr key={sheet.employeeId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{sheet.employeeName}</div>
                              <div className="text-xs text-gray-500">{sheet.employeeNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sheet.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-green-600">
                            {sheet.present}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-red-600">
                            {sheet.absent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-orange-600">
                            {sheet.late}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {sheet.leaves}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold">
                            {sheet.totalDays}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Badge variant={sheet.attendanceRate >= 90 ? 'default' : 'secondary'}>
                              {sheet.attendanceRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}