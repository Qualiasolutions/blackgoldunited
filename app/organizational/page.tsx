'use client'

import { useEffect, useState } from 'react'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Building,
  Users,
  Briefcase,
  Award,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Lock,
  Building2,
  GitBranch
} from 'lucide-react'
import Link from 'next/link'

interface OrganizationalStats {
  totalDepartments: number
  totalDesignations: number
  totalEmployeeLevels: number
  totalEmploymentTypes: number
  activeDepartments: number
  activeDesignations: number
}

export default function OrganizationalPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [stats, setStats] = useState<OrganizationalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const canManage = hasFullAccess('organizational')
  const canRead = hasModuleAccess('organizational')

  useEffect(() => {
    if (canRead) {
      fetchStats()
    }
  }, [canRead])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError('')

      const [depts, desigs, levels, types] = await Promise.all([
        fetch('/api/hr/departments').then(r => r.json()),
        fetch('/api/hr/designations').then(r => r.json()),
        fetch('/api/hr/employee-levels').then(r => r.json()),
        fetch('/api/hr/employment-types').then(r => r.json())
      ])

      const statsData: OrganizationalStats = {
        totalDepartments: depts.data?.length || 0,
        totalDesignations: desigs.data?.length || 0,
        totalEmployeeLevels: levels.data?.length || 0,
        totalEmploymentTypes: types.data?.length || 0,
        activeDepartments: depts.data?.filter((d: any) => d.isActive)?.length || 0,
        activeDesignations: desigs.data?.filter((d: any) => d.isActive)?.length || 0
      }

      setStats(statsData)
    } catch (error) {
      console.error('Error fetching organizational stats:', error)
      setError('Failed to load organizational statistics')
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
            <p className="text-gray-600">You don't have permission to access Organizational Structure module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const quickLinks = [
    {
      title: 'Manage Departments',
      description: 'View and manage company departments',
      href: '/organizational/departments',
      icon: Building2,
      color: 'blue',
      count: stats?.totalDepartments || 0
    },
    {
      title: 'Manage Designations',
      description: 'View and manage employee designations',
      href: '/organizational/designations',
      icon: Award,
      color: 'purple',
      count: stats?.totalDesignations || 0
    },
    {
      title: 'Employee Levels',
      description: 'Manage employee hierarchy levels',
      href: '/organizational/levels',
      icon: TrendingUp,
      color: 'green',
      count: stats?.totalEmployeeLevels || 0
    },
    {
      title: 'Employment Types',
      description: 'Manage employment type categories',
      href: '/organizational/employment-types',
      icon: Briefcase,
      color: 'orange',
      count: stats?.totalEmploymentTypes || 0
    },
    {
      title: 'Organizational Chart',
      description: 'View company hierarchy and structure',
      href: '/organizational/chart',
      icon: GitBranch,
      color: 'pink',
      count: null
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-pink-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Organizational Structure</h1>
                <p className="text-sm text-gray-600">Manage company hierarchy and structure</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchStats} variant="outline">
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Departments</p>
                        <p className="text-2xl font-bold">{stats?.totalDepartments || 0}</p>
                      </div>
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Designations</p>
                        <p className="text-2xl font-bold">{stats?.totalDesignations || 0}</p>
                      </div>
                      <Award className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Employee Levels</p>
                        <p className="text-2xl font-bold">{stats?.totalEmployeeLevels || 0}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Employment Types</p>
                        <p className="text-2xl font-bold">{stats?.totalEmploymentTypes || 0}</p>
                      </div>
                      <Briefcase className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <link.icon className={`h-10 w-10 text-${link.color}-600`} />
                          {link.count !== null && (
                            <span className="text-2xl font-bold text-gray-700">{link.count}</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.title}</h3>
                        <p className="text-sm text-gray-600">{link.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}