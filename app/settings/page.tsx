'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Users, Shield, Database, Bell, Globe, Palette, Key } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()

  if (!hasModuleAccess('settings')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the Settings module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canCreate = hasFullAccess('settings')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
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

          {/* Current User Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <p className="text-sm text-blue-600 font-medium">
                    Role: {user?.role?.replace('_', ' ') || 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

            {/* User Management */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">User Management</h3>
                    <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
                    {canCreate && (
                      <div className="mt-2 text-xs text-gray-500">
                        • Add/Remove Users<br/>
                        • Assign Roles<br/>
                        • Reset Passwords
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Control */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Access Control</h3>
                    <p className="text-sm text-gray-600">Configure role-based permissions</p>
                    <div className="mt-2 text-xs text-gray-500">
                      • Module Access Rights<br/>
                      • Data Permissions<br/>
                      • Security Policies
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Configuration */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Settings className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">System Configuration</h3>
                    <p className="text-sm text-gray-600">General system settings</p>
                    <div className="mt-2 text-xs text-gray-500">
                      • Company Information<br/>
                      • Business Rules<br/>
                      • Default Settings
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Management */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Database className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Database Management</h3>
                    <p className="text-sm text-gray-600">Backup and maintenance</p>
                    <div className="mt-2 text-xs text-gray-500">
                      • Database Backups<br/>
                      • Data Import/Export<br/>
                      • System Cleanup
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Bell className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Notifications</h3>
                    <p className="text-sm text-gray-600">Email and system alerts</p>
                    <div className="mt-2 text-xs text-gray-500">
                      • Email Templates<br/>
                      • Alert Thresholds<br/>
                      • Notification Rules
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localization */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <Globe className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Localization</h3>
                    <p className="text-sm text-gray-600">Language and regional settings</p>
                    <div className="mt-2 text-xs text-gray-500">
                      • Language Selection<br/>
                      • Currency Settings<br/>
                      • Date/Time Format
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Quick Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Application Version</span>
                    <span className="text-sm font-medium">BGU ERP v2.1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Database Version</span>
                    <span className="text-sm font-medium">PostgreSQL 15.x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Backup</span>
                    <span className="text-sm font-medium">2025-01-20 02:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="text-sm font-medium">142 Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">System Status</span>
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Administrative Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: 'User role updated', user: 'Admin', time: '2 hours ago' },
                    { action: 'Database backup completed', user: 'System', time: '6 hours ago' },
                    { action: 'New user account created', user: 'HR Manager', time: '1 day ago' },
                    { action: 'Security policy updated', user: 'Admin', time: '2 days ago' },
                    { action: 'System maintenance completed', user: 'System', time: '3 days ago' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-600">by {activity.user}</p>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Security & Access Control Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Access Control Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Module</th>
                      <th className="text-center p-2">Management</th>
                      <th className="text-center p-2">Finance Team</th>
                      <th className="text-center p-2">Procurement/BD</th>
                      <th className="text-center p-2">Admin/HR</th>
                      <th className="text-center p-2">IMS/QHSE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { module: 'Administration', management: 'F', finance: 'R', procurement: 'N', hr: 'F', qhse: 'N' },
                      { module: 'Finance', management: 'F', finance: 'F', procurement: 'R', hr: 'N', qhse: 'N' },
                      { module: 'Procurement', management: 'F', finance: 'R', procurement: 'F', hr: 'N', qhse: 'N' },
                      { module: 'Projects & Operations', management: 'F', finance: 'R', procurement: 'F', hr: 'N', qhse: 'R' },
                      { module: 'IMS/Compliance', management: 'F', finance: 'N', procurement: 'N', hr: 'N', qhse: 'F' },
                      { module: 'Correspondence', management: 'F', finance: 'N', procurement: 'R', hr: 'R', qhse: 'R' },
                    ].map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{row.module}</td>
                        <td className="text-center p-2">
                          <span className={`px-2 py-1 rounded text-xs ${row.management === 'F' ? 'bg-green-100 text-green-800' : row.management === 'R' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {row.management === 'F' ? 'Full' : row.management === 'R' ? 'Read' : 'None'}
                          </span>
                        </td>
                        <td className="text-center p-2">
                          <span className={`px-2 py-1 rounded text-xs ${row.finance === 'F' ? 'bg-green-100 text-green-800' : row.finance === 'R' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {row.finance === 'F' ? 'Full' : row.finance === 'R' ? 'Read' : 'None'}
                          </span>
                        </td>
                        <td className="text-center p-2">
                          <span className={`px-2 py-1 rounded text-xs ${row.procurement === 'F' ? 'bg-green-100 text-green-800' : row.procurement === 'R' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {row.procurement === 'F' ? 'Full' : row.procurement === 'R' ? 'Read' : 'None'}
                          </span>
                        </td>
                        <td className="text-center p-2">
                          <span className={`px-2 py-1 rounded text-xs ${row.hr === 'F' ? 'bg-green-100 text-green-800' : row.hr === 'R' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {row.hr === 'F' ? 'Full' : row.hr === 'R' ? 'Read' : 'None'}
                          </span>
                        </td>
                        <td className="text-center p-2">
                          <span className={`px-2 py-1 rounded text-xs ${row.qhse === 'F' ? 'bg-green-100 text-green-800' : row.qhse === 'R' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {row.qhse === 'F' ? 'Full' : row.qhse === 'R' ? 'Read' : 'None'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <strong>Legend:</strong> F = Full Access (CRUD), R = Read-only Access, N = No Access
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}