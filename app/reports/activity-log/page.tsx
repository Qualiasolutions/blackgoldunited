'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, User, Clock, Filter, Download, Search, RotateCcw } from 'lucide-react'
import Link from 'next/link'

interface ActivityLog {
  id: string
  action: string
  module: string
  description: string
  user_name: string
  user_role: string
  ip_address: string
  timestamp: string
  status: 'SUCCESS' | 'ERROR' | 'WARNING'
}

const activityTypes = [
  { value: 'all', label: 'All Activities' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'IMPORT', label: 'Import' }
]

const modules = [
  { value: 'all', label: 'All Modules' },
  { value: 'sales', label: 'Sales' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'clients', label: 'Clients' },
  { value: 'employees', label: 'Employees' },
  { value: 'finance', label: 'Finance' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'reports', label: 'Reports' }
]

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    action: 'all',
    module: 'all',
    status: 'all',
    dateRange: '7'
  })

  const [stats, setStats] = useState({
    totalActivities: 0,
    todayActivities: 0,
    successRate: 0,
    activeUsers: 0
  })

  useEffect(() => {
    fetchActivityLogs()
  }, [filters])

  const fetchActivityLogs = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()

      if (filters.search) queryParams.append('search', filters.search)
      if (filters.action !== 'all') queryParams.append('action', filters.action)
      if (filters.module !== 'all') queryParams.append('module', filters.module)
      if (filters.status !== 'all') queryParams.append('status', filters.status)
      queryParams.append('days', filters.dateRange)

      const response = await fetch(`/api/reports/activity-log?${queryParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
        setStats(data.stats || {
          totalActivities: 0,
          todayActivities: 0,
          successRate: 0,
          activeUsers: 0
        })
      } else {
        // Fallback to mock data for development
        setActivities(generateMockActivities())
        setStats({
          totalActivities: 247,
          todayActivities: 18,
          successRate: 96.8,
          activeUsers: 23
        })
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error)
      // Fallback to mock data
      setActivities(generateMockActivities())
      setStats({
        totalActivities: 247,
        todayActivities: 18,
        successRate: 96.8,
        activeUsers: 23
      })
    } finally {
      setLoading(false)
    }
  }

  const generateMockActivities = (): ActivityLog[] => [
    {
      id: '1',
      action: 'CREATE',
      module: 'sales',
      description: 'Created new sales invoice #INV-2024-001',
      user_name: 'Ahmed Al-Rashid',
      user_role: 'SALES_MANAGER',
      ip_address: '192.168.1.105',
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    },
    {
      id: '2',
      action: 'UPDATE',
      module: 'inventory',
      description: 'Updated stock levels for Product SKU-001',
      user_name: 'Fatima Hassan',
      user_role: 'INVENTORY_MANAGER',
      ip_address: '192.168.1.108',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'SUCCESS'
    },
    {
      id: '3',
      action: 'LOGIN',
      module: 'system',
      description: 'User logged into the system',
      user_name: 'Mohammad Ali',
      user_role: 'ADMIN',
      ip_address: '192.168.1.101',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'SUCCESS'
    },
    {
      id: '4',
      action: 'DELETE',
      module: 'clients',
      description: 'Attempted to delete client record',
      user_name: 'Sara Khalil',
      user_role: 'SALES_REP',
      ip_address: '192.168.1.112',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      status: 'ERROR'
    },
    {
      id: '5',
      action: 'EXPORT',
      module: 'reports',
      description: 'Exported financial report for Q4 2024',
      user_name: 'Omar Zayed',
      user_role: 'FINANCE_MANAGER',
      ip_address: '192.168.1.103',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      status: 'SUCCESS'
    }
  ]

  const resetFilters = () => {
    setFilters({
      search: '',
      action: 'all',
      module: 'all',
      status: 'all',
      dateRange: '7'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-800'
      case 'ERROR': return 'bg-red-100 text-red-800'
      case 'WARNING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString('en-GB'),
      time: date.toLocaleTimeString('en-GB', { hour12: false })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            System activity tracking, user actions, and audit trails
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/reports">
              Back to Reports
            </Link>
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Log
          </Button>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">{stats.totalActivities}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.todayActivities}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-purple-600">{stats.activeUsers}</p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.action}
              onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.module}
              onValueChange={(value) => setFilters(prev => ({ ...prev, module: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map(module => (
                  <SelectItem key={module.value} value={module.value}>
                    {module.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetFilters} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading activities...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const { date, time } = formatTimestamp(activity.timestamp)
                return (
                  <div key={activity.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {activity.action}
                          </Badge>
                          <Badge variant="secondary">
                            {activity.module}
                          </Badge>
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-1">{activity.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {activity.user_name} ({activity.user_role})
                          </span>
                          <span>IP: {activity.ip_address}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{date}</div>
                        <div>{time}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {activities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activities found for the selected filters.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}