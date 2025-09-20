'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Users, Phone, Mail, MapPin, Filter, Download, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function ClientContactsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()

  if (!user) {
    return null
  }

  return (
    <MainLayout user={{ name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role }}>
      <div className="bg-gradient-to-br from-white via-orange-50 to-white min-h-full">
        <div className="py-8 px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Client Contacts</h1>
                <p className="text-gray-600 mt-2">Manage contact persons and communication channels</p>
              </div>
              {hasFullAccess('clients') && (
                <Link href="/clients/contacts/create">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Primary Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">42</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Additions</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Plus className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-gray-900">142</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Mail className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Search and Filter Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-orange-600" />
                <Input
                  placeholder="Search contacts by name, company, email..."
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Contacts</option>
                  <option>Primary Contacts</option>
                  <option>Secondary Contacts</option>
                  <option>Technical Contacts</option>
                  <option>Financial Contacts</option>
                </select>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Companies</option>
                  <option>Acme Corporation</option>
                  <option>TechStart Solutions</option>
                  <option>GlobalTech Inc</option>
                  <option>Innovation Labs</option>
                </select>
              </div>
            </EnhancedCard>
          </div>

          {/* Contacts Table */}
          <EnhancedCard className="bg-white border-2 border-orange-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Client Contacts Directory</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact Person</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Position</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact Info</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sample Data - Replace with real data from Supabase */}
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3">
                            JD
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">John Davis</p>
                            <p className="text-sm text-gray-500">j.davis@acme.com</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">Acme Corporation</td>
                      <td className="py-3 px-4">CEO</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            +1 (555) 123-4567
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            j.davis@acme.com
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Message</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold mr-3">
                            SW
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Sarah Wilson</p>
                            <p className="text-sm text-gray-500">s.wilson@techstart.com</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">TechStart Solutions</td>
                      <td className="py-3 px-4">CFO</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            +1 (555) 987-6543
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            s.wilson@techstart.com
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-purple-100 text-purple-800">Financial</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Message</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold mr-3">
                            MJ
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Michael Johnson</p>
                            <p className="text-sm text-gray-500">m.johnson@globaltech.com</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">GlobalTech Inc</td>
                      <td className="py-3 px-4">CTO</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            +1 (555) 456-7890
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            m.johnson@globaltech.com
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-orange-100 text-orange-800">Technical</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Message</Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empty State for when no data */}
              <div className="text-center py-12 hidden">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No contacts found</p>
                <p className="text-gray-400 mt-2">Add your first client contact to get started</p>
                {hasFullAccess('clients') && (
                  <Link href="/clients/contacts/create" className="mt-4 inline-block">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Contact
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </EnhancedCard>
        </div>
      </div>
    </MainLayout>
  )
}