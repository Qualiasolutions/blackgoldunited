'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, Users, Calendar, Download, FileText, Loader2, TrendingDown } from 'lucide-react'
import Link from 'next/link'

const salesReports = [
  {
    id: 'daily-summary',
    title: 'Daily Sales Summary',
    description: 'Daily revenue, transactions, and performance metrics',
    frequency: 'Daily',
    status: 'active'
  },
  {
    id: 'monthly-analysis',
    title: 'Monthly Sales Analysis',
    description: 'Comprehensive monthly sales performance review',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'customer-analytics',
    title: 'Customer Analytics',
    description: 'Customer behavior, top clients, and retention metrics',
    frequency: 'Weekly',
    status: 'active'
  },
  {
    id: 'product-performance',
    title: 'Product Performance',
    description: 'Best selling products, trends, and inventory insights',
    frequency: 'Weekly',
    status: 'active'
  },
  {
    id: 'sales-forecast',
    title: 'Sales Forecast',
    description: 'Predictive analysis and future sales projections',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'commission-report',
    title: 'Commission Report',
    description: 'Sales team commissions and performance tracking',
    frequency: 'Monthly',
    status: 'active'
  }
]

export default function SalesReportsPage() {
  const [salesData, setSalesData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSalesData() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/reports/sales')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch sales data')
        }

        if (result.success) {
          setSalesData(result.data)
        }
      } catch (error) {
        console.error('Error fetching sales data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading sales reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <TrendingDown className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = salesData || {}

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
          <p className="text-muted-foreground">
            Track sales performance, revenue trends, and customer analytics
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
            Export All
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">AED {((stats.totalSales || 0) / 1000).toFixed(1)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Amount</p>
                <p className="text-2xl font-bold">AED {((stats.totalPaid || 0) / 1000).toFixed(1)}K</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold">AED {((stats.totalOutstanding || 0) / 1000).toFixed(1)}K</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold">{stats.activeClients || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Sales Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                      {report.frequency}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{report.title}</h3>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                  </div>
                  <Button size="sm" className="w-full text-xs">
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}