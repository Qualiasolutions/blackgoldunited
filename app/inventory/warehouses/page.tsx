'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Building2, Package, MapPin, Users, Filter, Download, Settings } from 'lucide-react'
import Link from 'next/link'

export default function InventoryWarehousesPage() {
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
                <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
                <p className="text-gray-600 mt-2">Manage warehouse locations, capacity, and inventory distribution</p>
              </div>
              {hasFullAccess('inventory') && (
                <Link href="/inventory/warehouses/create">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Warehouse
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
                  <p className="text-sm font-medium text-gray-600">Total Warehouses</p>
                  <p className="text-2xl font-bold text-gray-900">6</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                  <p className="text-2xl font-bold text-gray-900">50,000</p>
                  <p className="text-xs text-gray-500">sq ft</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilized Space</p>
                  <p className="text-2xl font-bold text-gray-900">72%</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Staff Members</p>
                  <p className="text-2xl font-bold text-gray-900">42</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Users className="h-6 w-6 text-purple-600" />
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
                  placeholder="Search warehouses..."
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Warehouses</option>
                  <option>Active</option>
                  <option>Under Maintenance</option>
                  <option>Inactive</option>
                </select>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-orange-600" />
                <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                  <option>All Locations</option>
                  <option>New York</option>
                  <option>California</option>
                  <option>Texas</option>
                  <option>Florida</option>
                </select>
              </div>
            </EnhancedCard>
          </div>

          {/* Warehouses Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-xl mr-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Main Warehouse</h3>
                    <p className="text-sm text-gray-500">New York, NY</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Capacity:</span>
                  <span className="text-sm font-medium">15,000 sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Utilized:</span>
                  <span className="text-sm font-medium">85%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Staff:</span>
                  <span className="text-sm font-medium">12 members</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Manager:</span>
                  <span className="text-sm font-medium">John Smith</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">View Details</Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-xl mr-3">
                    <Building2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">West Coast Hub</h3>
                    <p className="text-sm text-gray-500">Los Angeles, CA</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Capacity:</span>
                  <span className="text-sm font-medium">12,000 sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Utilized:</span>
                  <span className="text-sm font-medium">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Staff:</span>
                  <span className="text-sm font-medium">8 members</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Manager:</span>
                  <span className="text-sm font-medium">Sarah Wilson</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">View Details</Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-xl mr-3">
                    <Building2 className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">South Distribution</h3>
                    <p className="text-sm text-gray-500">Houston, TX</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Capacity:</span>
                  <span className="text-sm font-medium">8,500 sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Utilized:</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Staff:</span>
                  <span className="text-sm font-medium">6 members</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Manager:</span>
                  <span className="text-sm font-medium">Mike Johnson</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">View Details</Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </EnhancedCard>
          </div>

          {/* Detailed Warehouse Table */}
          <EnhancedCard className="bg-white border-2 border-orange-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Warehouse Details</h2>
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Warehouse</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Capacity</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Utilization</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Products</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Staff</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sample Data - Replace with real data from Supabase */}
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-orange-600 mr-2" />
                          Main Warehouse
                        </div>
                      </td>
                      <td className="py-3 px-4">New York, NY</td>
                      <td className="py-3 px-4">15,000 sq ft</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <span className="text-sm font-medium">85%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">1,247</td>
                      <td className="py-3 px-4">12</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-orange-600 mr-2" />
                          West Coast Hub
                        </div>
                      </td>
                      <td className="py-3 px-4">Los Angeles, CA</td>
                      <td className="py-3 px-4">12,000 sq ft</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                          </div>
                          <span className="text-sm font-medium">68%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">856</td>
                      <td className="py-3 px-4">8</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-orange-600 mr-2" />
                          South Distribution
                        </div>
                      </td>
                      <td className="py-3 px-4">Houston, TX</td>
                      <td className="py-3 px-4">8,500 sq ft</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                          <span className="text-sm font-medium">45%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">423</td>
                      <td className="py-3 px-4">6</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empty State for when no data */}
              <div className="text-center py-12 hidden">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No warehouses found</p>
                <p className="text-gray-400 mt-2">Add your first warehouse to start managing inventory locations</p>
                {hasFullAccess('inventory') && (
                  <Link href="/inventory/warehouses/create" className="mt-4 inline-block">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Warehouse
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