'use client'

import { useEffect, useState } from 'react'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  FileCheck,
  FolderOpen,
  Bell,
  ArrowLeft,
  Loader2,
  Lock
} from 'lucide-react'
import Link from 'next/link'

interface TemplateStats {
  totalTemplates: number
  printable: number
  prefilled: number
  terms: number
  files: number
  reminders: number
}

export default function TemplatesPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [stats, setStats] = useState<TemplateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const canManage = hasFullAccess('templates')
  const canRead = hasModuleAccess('templates')

  useEffect(() => {
    if (canRead) {
      fetchStats()
    }
  }, [canRead])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError('')

      const [templates, documents] = await Promise.all([
        fetch('/api/documents/templates').then(r => r.json()),
        fetch('/api/documents').then(r => r.json())
      ])

      const templateData = templates.data || []
      const statsData: TemplateStats = {
        totalTemplates: templateData.length,
        printable: templateData.filter((t: any) => t.templateType === 'INVOICE' || t.templateType === 'REPORT').length,
        prefilled: templateData.filter((t: any) => t.templateType === 'CONTRACT' || t.templateType === 'LETTER').length,
        terms: templateData.filter((t: any) => t.templateType === 'MEMO' || t.templateType === 'PROPOSAL').length,
        files: documents.data?.length || 0,
        reminders: 0 // TODO: Add reminder count when API available
      }

      setStats(statsData)
    } catch (error) {
      console.error('Error fetching template stats:', error)
      setError('Failed to load template statistics')
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
            <p className="text-gray-600">You don't have permission to access Templates module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const quickLinks = [
    {
      title: 'Printable Templates',
      description: 'Manage printable document templates',
      href: '/templates/printable',
      icon: FileText,
      color: 'blue',
      count: stats?.printable || 0
    },
    {
      title: 'Prefilled Templates',
      description: 'Templates with pre-populated data',
      href: '/templates/prefilled',
      icon: FileCheck,
      color: 'purple',
      count: stats?.prefilled || 0
    },
    {
      title: 'Terms & Conditions',
      description: 'Legal terms and conditions templates',
      href: '/templates/terms',
      icon: FileText,
      color: 'green',
      count: stats?.terms || 0
    },
    {
      title: 'Files & Documents',
      description: 'Manage uploaded files and documents',
      href: '/templates/files',
      icon: FolderOpen,
      color: 'orange',
      count: stats?.files || 0
    },
    {
      title: 'Auto Reminder Rules',
      description: 'Configure automated reminder rules',
      href: '/templates/reminders',
      icon: Bell,
      color: 'red',
      count: stats?.reminders || 0
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-violet-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
                <p className="text-sm text-gray-600">Manage document templates and files</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Templates</p>
                        <p className="text-2xl font-bold">{stats?.totalTemplates || 0}</p>
                      </div>
                      <FileText className="h-8 w-8 text-violet-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Files</p>
                        <p className="text-2xl font-bold">{stats?.files || 0}</p>
                      </div>
                      <FolderOpen className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Reminders</p>
                        <p className="text-2xl font-bold">{stats?.reminders || 0}</p>
                      </div>
                      <Bell className="h-8 w-8 text-red-600" />
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
                          <span className="text-2xl font-bold text-gray-700">{link.count}</span>
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