'use client'

import { useEffect, useState } from 'react'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
  Clock,
  Users,
  CheckCircle,
  Lock
} from 'lucide-react'
import Link from 'next/link'

interface Shift {
  id: string
  shift_name: string
  start_time: string
  end_time: string
  break_duration: number
  is_flexible: boolean
  grace_period: number
  is_active: boolean
  created_at: string
}

export default function ShiftsPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const canManage = hasFullAccess('attendance')
  const canRead = hasModuleAccess('attendance')

  useEffect(() => {
    if (canRead) {
      fetchShifts()
    }
  }, [canRead])

  const fetchShifts = async () => {
    try {
      setLoading(true)
      setError('')

      // Mock data since shifts API doesn't exist yet
      // TODO: Replace with actual API call when /api/hr/shifts is created
      const mockShifts: Shift[] = [
        {
          id: '1',
          shift_name: 'Morning Shift',
          start_time: '08:00:00',
          end_time: '16:00:00',
          break_duration: 60,
          is_flexible: false,
          grace_period: 15,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          shift_name: 'Evening Shift',
          start_time: '16:00:00',
          end_time: '00:00:00',
          break_duration: 60,
          is_flexible: false,
          grace_period: 15,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          shift_name: 'Night Shift',
          start_time: '00:00:00',
          end_time: '08:00:00',
          break_duration: 60,
          is_flexible: false,
          grace_period: 15,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          shift_name: 'Flexible Shift',
          start_time: '09:00:00',
          end_time: '17:00:00',
          break_duration: 60,
          is_flexible: true,
          grace_period: 30,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]

      setShifts(mockShifts)
    } catch (error) {
      console.error('Error fetching shifts:', error)
      setError(error instanceof Error ? error.message : 'Failed to load shifts')
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

  const activeCount = shifts.filter(s => s.is_active).length
  const flexibleCount = shifts.filter(s => s.is_flexible).length

  const filteredShifts = shifts.filter(shift =>
    !searchTerm ||
    shift.shift_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canManage && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Shift
                </Button>
              )}
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
                    <p className="text-sm font-medium text-gray-600">Total Shifts</p>
                    <p className="text-2xl font-bold">{shifts.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Shifts</p>
                    <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Flexible Shifts</p>
                    <p className="text-2xl font-bold text-purple-600">{flexibleCount}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Search shifts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:col-span-2"
                />
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Shifts List */}
          <Card>
            <CardHeader>
              <CardTitle>All Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">{error}</div>
              ) : filteredShifts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No shifts found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Shift Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Start Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          End Time
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Break (mins)
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Grace Period
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredShifts.map((shift) => (
                        <tr key={shift.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {shift.shift_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shift.start_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shift.end_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {shift.break_duration}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {shift.grace_period} mins
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Badge variant={shift.is_flexible ? 'outline' : 'secondary'}>
                              {shift.is_flexible ? 'Flexible' : 'Fixed'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={shift.is_active ? 'default' : 'secondary'}>
                              {shift.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canManage && (
                                <>
                                  <Button size="sm" variant="ghost">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </div>
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