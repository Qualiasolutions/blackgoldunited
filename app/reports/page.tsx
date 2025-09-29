'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  FileText,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Calendar,
  Download,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  const [currentDate, setCurrentDate] = useState('')
  const [reportData, setReportData] = useState<any>({
    sales: null,
    purchase: null,
    accounting: null
  })
  const [loading, setLoading] = useState(true)

  const reportCategories = [
    {
      id: 'sales',
      title: 'Sales Reports',
      description: 'Track sales performance, revenue, and customer trends',
      icon: TrendingUp,
      href: '/reports/sales',
      count: reportData.sales?.summary?.invoiceCount || 0,
      color: 'bg-blue-500'
    },
    {
      id: 'purchase',
      title: 'Purchase Reports',
      description: 'Monitor procurement, supplier performance, and costs',
      icon: Package,
      href: '/reports/purchase',
      count: reportData.purchase?.summary?.orderCount || 0,
      color: 'bg-green-500'
    },
    {
      id: 'accounting',
      title: 'Accounting Reports',
      description: 'Financial statements, P&L, balance sheets, and cash flow',
      icon: DollarSign,
      href: '/reports/accounting',
      count: reportData.accounting?.plTrend?.length || 12,
      color: 'bg-purple-500'
    },
    {
      id: 'employee',
      title: 'Employee Reports',
      description: 'HR analytics, attendance, payroll, and performance',
      icon: Users,
      href: '/reports/employee',
      count: 10,
      color: 'bg-orange-500'
    },
    {
      id: 'clients',
      title: 'Client Reports',
      description: 'Customer analytics, satisfaction, and relationship insights',
      icon: Users,
      href: '/reports/clients',
      count: 5,
      color: 'bg-pink-500'
    },
    {
      id: 'store',
      title: 'Store Reports',
      description: 'Inventory levels, stock movements, and warehouse analytics',
      icon: Package,
      href: '/reports/store',
      count: 7,
      color: 'bg-teal-500'
    }
  ]

  const quickReports = [
    { title: 'Sales Summary', href: '#sales', action: 'viewSales' },
    { title: 'P&L Statement', href: '#accounting', action: 'viewAccounting' },
    { title: 'Purchase Summary', href: '#purchase', action: 'viewPurchase' },
    { title: 'Inventory Status', href: '/inventory', action: null },
    { title: 'Client Status', href: '/clients', action: null }
  ]

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))

    // Fetch report data
    const fetchReports = async () => {
      try {
        setLoading(true)

        const [salesRes, purchaseRes, accountingRes] = await Promise.all([
          fetch('/api/reports/sales'),
          fetch('/api/reports/purchase'),
          fetch('/api/reports/accounting')
        ])

        const sales = salesRes.ok ? await salesRes.json() : null
        const purchase = purchaseRes.ok ? await purchaseRes.json() : null
        const accounting = accountingRes.ok ? await accountingRes.json() : null

        setReportData({ sales, purchase, accounting })
      } catch (error) {
        console.error('Error fetching reports:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports across all business modules
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{currentDate}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Quick Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickReports.map((report, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                asChild
              >
                <Link href={report.href}>
                  <FileText className="h-6 w-6" />
                  <span className="text-sm text-center">{report.title}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCategories.map((category) => {
          const IconComponent = category.icon
          return (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${category.color} text-white`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <Badge variant="secondary">{category.count} reports</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
                <div className="flex space-x-2">
                  <Button asChild className="flex-1" disabled={loading}>
                    <Link href={category.href}>
                      {loading ? 'Loading...' : 'View Reports'}
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" disabled={loading}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Activity Log</span>
            <Button variant="outline" asChild>
              <Link href="/reports/activity-log">
                View Full Log
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Track system-wide activities, user actions, and audit trails for compliance and monitoring.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}