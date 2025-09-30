'use client'

import { useEffect, useState } from 'react'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Loader2,
  GitBranch,
  Building2,
  Users,
  Lock
} from 'lucide-react'
import Link from 'next/link'

interface Department {
  id: string
  name: string
  description: string | null
  managerId: string | null
  parentId: string | null
  isActive: boolean
  manager?: {
    firstName: string
    lastName: string
    employeeNumber: string
  }
  employees?: { count: number }[]
  children?: Department[]
}

export default function OrganizationalChartPage() {
  const { user } = useAuth()
  const { hasModuleAccess } = usePermissions()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const canRead = hasModuleAccess('organizational')

  useEffect(() => {
    if (canRead) {
      fetchDepartments()
    }
  }, [canRead])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/hr/departments?includeHierarchy=true')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch departments')
      }

      if (result.success && result.data) {
        // Organize into hierarchy
        const hierarchy = buildHierarchy(result.data)
        setDepartments(hierarchy)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
      setError(error instanceof Error ? error.message : 'Failed to load organizational chart')
    } finally {
      setLoading(false)
    }
  }

  const buildHierarchy = (depts: Department[]): Department[] => {
    const deptMap = new Map<string, Department>()
    const roots: Department[] = []

    // Initialize map with children arrays
    depts.forEach(dept => {
      deptMap.set(dept.id, { ...dept, children: [] })
    })

    // Build hierarchy
    depts.forEach(dept => {
      const deptWithChildren = deptMap.get(dept.id)!
      if (dept.parentId && deptMap.has(dept.parentId)) {
        deptMap.get(dept.parentId)!.children!.push(deptWithChildren)
      } else {
        roots.push(deptWithChildren)
      }
    })

    return roots
  }

  const renderDepartmentNode = (dept: Department, level: number = 0) => {
    const employeeCount = dept.employees?.[0]?.count || 0

    return (
      <div key={dept.id} className={`${level > 0 ? 'ml-8 mt-4' : 'mt-4'}`}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-lg text-gray-900">{dept.name}</h3>
                </div>

                {dept.description && (
                  <p className="text-sm text-gray-600 mb-2">{dept.description}</p>
                )}

                <div className="flex items-center space-x-4 text-sm">
                  {dept.manager && (
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium">Manager:</span>
                      <span className="ml-1">
                        {dept.manager.firstName} {dept.manager.lastName}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center text-gray-700">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{employeeCount} employees</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {dept.children && dept.children.length > 0 && (
                  <span className="text-sm text-blue-600 font-medium">
                    {dept.children.length} sub-dept{dept.children.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {dept.children && dept.children.length > 0 && (
          <div className="border-l-2 border-gray-200 ml-4 pl-4">
            {dept.children.map(child => renderDepartmentNode(child, level + 1))}
          </div>
        )}
      </div>
    )
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <GitBranch className="h-6 w-6 text-pink-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Organizational Chart</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/organizational">
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
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center text-sm text-gray-600">
                <GitBranch className="h-4 w-4 mr-2" />
                <p>
                  This chart displays the hierarchical structure of your organization, showing departments,
                  their managers, and sub-departments.
                </p>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchDepartments} variant="outline">
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : departments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No departments found in your organization</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {departments.map(dept => renderDepartmentNode(dept, 0))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}