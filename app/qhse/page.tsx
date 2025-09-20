'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Shield, AlertTriangle, FileCheck, Users, Calendar, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function QHSEPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()

  if (!hasModuleAccess('qhse')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the QHSE module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canCreate = hasFullAccess('qhse')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">QHSE Management</h1>
              <span className="ml-2 text-sm text-gray-500">Quality, Health, Safety & Environment</span>
            </div>
            <div className="flex items-center space-x-4">
              {canCreate && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Incident Report
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

          {/* QHSE Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">96%</div>
                <p className="text-xs text-muted-foreground">
                  +2% improvement this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">3</div>
                <p className="text-xs text-muted-foreground">
                  1 high priority
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                <FileCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">98.5%</div>
                <p className="text-xs text-muted-foreground">
                  All audits passed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Training Complete</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">139/142</div>
                <p className="text-xs text-muted-foreground">
                  3 pending completion
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Incident Reporting</h3>
                    <p className="text-sm text-gray-600">Report safety incidents</p>
                    {canCreate && (
                      <Button size="sm" className="mt-2" variant="destructive">
                        <Plus className="w-3 h-3 mr-1" />
                        Report Incident
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
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Safety Protocols</h3>
                    <p className="text-sm text-gray-600">Manage safety procedures</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Compliance Audits</h3>
                    <p className="text-sm text-gray-600">Track compliance status</p>
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
                    <h3 className="font-semibold">Training Programs</h3>
                    <p className="text-sm text-gray-600">Manage safety training</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Incidents */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Incidents & Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'INC-001', type: 'Near Miss', description: 'Employee slipped on wet floor in warehouse', severity: 'Low', status: 'Investigating', date: '2025-01-15', reporter: 'John Smith' },
                  { id: 'INC-002', type: 'Environmental', description: 'Minor oil spill in machinery area', severity: 'Medium', status: 'Resolved', date: '2025-01-12', reporter: 'Sarah Johnson' },
                  { id: 'INC-003', type: 'Safety Violation', description: 'PPE not worn in designated area', severity: 'High', status: 'Action Required', date: '2025-01-10', reporter: 'Michael Brown' },
                  { id: 'INC-004', type: 'Equipment', description: 'Safety guard damaged on equipment', severity: 'High', status: 'Resolved', date: '2025-01-08', reporter: 'Emily Davis' },
                ].map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        incident.severity === 'High' ? 'bg-red-500' :
                        incident.severity === 'Medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                      <div>
                        <p className="font-medium">{incident.id} - {incident.type}</p>
                        <p className="text-sm text-gray-600">{incident.description}</p>
                        <p className="text-xs text-gray-500">Reported by {incident.reporter} on {incident.date}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        incident.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        incident.status === 'Action Required' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {incident.status}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">{incident.severity} Severity</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { area: 'ISO 45001 (Safety)', status: 'Compliant', lastAudit: '2024-12-15', nextAudit: '2025-06-15' },
                    { area: 'ISO 14001 (Environment)', status: 'Compliant', lastAudit: '2024-11-20', nextAudit: '2025-05-20' },
                    { area: 'ISO 9001 (Quality)', status: 'Compliant', lastAudit: '2024-10-10', nextAudit: '2025-04-10' },
                    { area: 'Local Safety Regulations', status: 'Action Required', lastAudit: '2025-01-05', nextAudit: '2025-07-05' },
                  ].map((compliance, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium text-sm">{compliance.area}</p>
                        <p className="text-xs text-gray-600">Last audit: {compliance.lastAudit}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          compliance.status === 'Compliant' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {compliance.status}
                        </span>
                        <p className="text-xs text-gray-600 mt-1">Next: {compliance.nextAudit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { course: 'Fire Safety Training', completed: 142, total: 142, percentage: 100 },
                    { course: 'First Aid Certification', completed: 38, total: 50, percentage: 76 },
                    { course: 'Chemical Handling Safety', completed: 28, total: 35, percentage: 80 },
                    { course: 'Equipment Operation Safety', completed: 89, total: 95, percentage: 94 },
                  ].map((training, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{training.course}</span>
                        <span>{training.completed}/{training.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            training.percentage === 100 ? 'bg-green-500' :
                            training.percentage >= 80 ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${training.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600">{training.percentage}% complete</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Environmental Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Environmental Impact Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">2.3 tons</div>
                  <div className="text-sm text-gray-600">CO₂ Emissions</div>
                  <div className="text-xs text-green-600">-15% vs last month</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">1,240 L</div>
                  <div className="text-sm text-gray-600">Water Usage</div>
                  <div className="text-xs text-blue-600">-8% vs last month</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">85%</div>
                  <div className="text-sm text-gray-600">Waste Recycled</div>
                  <div className="text-xs text-purple-600">+5% vs last month</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">4.2 MWh</div>
                  <div className="text-sm text-gray-600">Energy Usage</div>
                  <div className="text-xs text-orange-600">-12% vs last month</div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}