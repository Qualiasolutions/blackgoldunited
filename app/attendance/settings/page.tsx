'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, Clock, Calendar, Bell, Save, RefreshCw, ArrowLeft, Lock, Shield } from 'lucide-react'
import Link from 'next/link'

export default function AttendanceSettingsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()

  const canManage = hasFullAccess('attendance')

  if (!user) {
    return null
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You need FULL access to Attendance module to manage settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Attendance Settings</h1>
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

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* General Attendance Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-xl mr-3">
                    <Settings className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>General Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Hours Per Day
                  </label>
                  <Input
                    type="number"
                    defaultValue="8"
                    step="0.5"
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days Per Week
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="5">5 Days</option>
                    <option value="5.5">5.5 Days</option>
                    <option value="6">6 Days</option>
                    <option value="7">7 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weekend Days
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="saturday_sunday">Saturday & Sunday</option>
                    <option value="friday_saturday">Friday & Saturday</option>
                    <option value="sunday_only">Sunday Only</option>
                    <option value="friday_only">Friday Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attendance Tracking Method
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="biometric">Biometric</option>
                    <option value="manual">Manual Entry</option>
                    <option value="mobile_app">Mobile App</option>
                    <option value="web_portal">Web Portal</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Check-in/out Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-xl mr-3">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Check-in/out Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grace Period (minutes)
                  </label>
                  <Input
                    type="number"
                    defaultValue="15"
                    className="border-gray-300 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Allow late check-in within this time
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Half Day Hours
                  </label>
                  <Input
                    type="number"
                    defaultValue="4"
                    step="0.5"
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto Check-out Time
                  </label>
                  <Input
                    type="time"
                    defaultValue="18:00"
                    className="border-gray-300 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically check out if not done manually
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Break Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    defaultValue="60"
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Require Break Tracking</p>
                    <p className="text-xs text-gray-500">Track break check-in/out</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            {/* Leave Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-xl mr-3">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Leave Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Leave Days
                  </label>
                  <Input
                    type="number"
                    defaultValue="30"
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sick Leave Days
                  </label>
                  <Input
                    type="number"
                    defaultValue="10"
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Approval Required
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="always">Always</option>
                    <option value="over_3_days">Over 3 Days Only</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Notice (days)
                  </label>
                  <Input
                    type="number"
                    defaultValue="7"
                    className="border-gray-300 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum notice period for leave requests
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Carry Forward Leave</p>
                    <p className="text-xs text-gray-500">Allow unused leave to next year</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            {/* Overtime & Policies */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-xl mr-3">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Overtime & Policies</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Calculation
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="after_hours">After Working Hours</option>
                    <option value="weekends">Weekends Only</option>
                    <option value="both">Both</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Rate Multiplier
                  </label>
                  <Input
                    type="number"
                    defaultValue="1.5"
                    step="0.1"
                    className="border-gray-300 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Normal rate × multiplier
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Absence Penalty
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="none">No Penalty</option>
                    <option value="warning">Warning Only</option>
                    <option value="deduction">Salary Deduction</option>
                    <option value="leave_deduction">Leave Deduction</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Require Approval for Overtime</p>
                    <p className="text-xs text-gray-500">Pre-approve overtime work</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Lock Attendance</p>
                    <p className="text-xs text-gray-500">Prevent editing after 30 days</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-xl mr-3">
                    <Bell className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle>Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Late Check-in Alert</p>
                      <p className="text-xs text-gray-500">Notify supervisor on late arrival</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Absence Alert</p>
                      <p className="text-xs text-gray-500">Notify on missing check-in</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Leave Request Alert</p>
                      <p className="text-xs text-gray-500">Notify on new leave requests</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Daily Summary</p>
                      <p className="text-xs text-gray-500">Send attendance summary</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}