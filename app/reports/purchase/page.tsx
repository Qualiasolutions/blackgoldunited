'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, DollarSign, Truck, TrendingDown, Download, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'

const purchaseReports = [
  {
    id: 'purchase-summary',
    title: 'Purchase Summary',
    description: 'Daily, weekly, and monthly purchase analytics',
    frequency: 'Daily',
    status: 'active'
  },
  {
    id: 'supplier-performance',
    title: 'Supplier Performance',
    description: 'Supplier delivery times, quality metrics, and costs',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'cost-analysis',
    title: 'Cost Analysis',
    description: 'Purchase cost trends and budget variance analysis',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'po-status',
    title: 'Purchase Order Status',
    description: 'Track PO lifecycle from creation to delivery',
    frequency: 'Real-time',
    status: 'active'
  },
  {
    id: 'inventory-procurement',
    title: 'Inventory Procurement',
    description: 'Stock levels and reorder recommendations',
    frequency: 'Weekly',
    status: 'active'
  },
  {
    id: 'vendor-comparison',
    title: 'Vendor Comparison',
    description: 'Compare pricing and performance across vendors',
    frequency: 'Quarterly',
    status: 'active'
  }
]

export default function PurchaseReportsPage() {
  const [purchaseData, setPurchaseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPurchaseData() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/reports/purchase')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch purchase data')
        }

        if (result.success) {
          setPurchaseData(result.data)
        }
      } catch (error) {
        console.error('Error fetching purchase data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchPurchaseData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading purchase reports...</p>
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

  const stats = purchaseData || {}

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Reports</h1>
          <p className="text-muted-foreground">
            Track purchase orders, supplier performance, and procurement analytics
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
                <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold">AED {((stats.totalPurchases || 0) / 1000).toFixed(1)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">{stats.pendingOrdersCount || 0}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Suppliers</p>
                <p className="text-2xl font-bold">{stats.activeSuppliersCount || 0}</p>
              </div>
              <Truck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold">{((stats.savingsRate || 0) * 100).toFixed(1)}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Purchase Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseReports.map((report) => (
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