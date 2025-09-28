'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, DollarSign, Truck, TrendingDown, Download, FileText } from 'lucide-react'
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
  const [stats, setStats] = useState({
    totalPurchases: 0,
    monthlySpend: 0,
    activeSuppliers: 0,
    savingsRate: 0
  })

  useEffect(() => {
    // In a real app, fetch from Supabase
    setStats({
      totalPurchases: 89,
      monthlySpend: 850000,
      activeSuppliers: 34,
      savingsRate: 8.5
    })
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Reports</h1>
          <p className="text-muted-foreground">
            Monitor procurement, supplier performance, and cost optimization
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
                <p className="text-2xl font-bold">{stats.totalPurchases}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Spend</p>
                <p className="text-2xl font-bold">AED {(stats.monthlySpend / 1000)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Suppliers</p>
                <p className="text-2xl font-bold">{stats.activeSuppliers}</p>
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
                <p className="text-2xl font-bold">{stats.savingsRate}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-600" />
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
                    <FileText className="h-8 w-8 text-green-600" />
                    <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                      {report.frequency}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      Generate
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}