'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, TrendingDown, TrendingUp, AlertTriangle, Download, FileText } from 'lucide-react'
import Link from 'next/link'

const storeReports = [
  {
    id: 'inventory-status',
    title: 'Inventory Status Report',
    description: 'Current stock levels, availability, and warehouse locations',
    frequency: 'Real-time',
    status: 'active'
  },
  {
    id: 'stock-movement',
    title: 'Stock Movement Analysis',
    description: 'Inventory in/out trends, turnover rates, and velocity',
    frequency: 'Daily',
    status: 'active'
  },
  {
    id: 'reorder-recommendations',
    title: 'Reorder Recommendations',
    description: 'Items below reorder level and procurement suggestions',
    frequency: 'Daily',
    status: 'active'
  },
  {
    id: 'warehouse-utilization',
    title: 'Warehouse Utilization',
    description: 'Storage capacity, occupancy rates, and optimization',
    frequency: 'Weekly',
    status: 'active'
  },
  {
    id: 'dead-stock-analysis',
    title: 'Dead Stock Analysis',
    description: 'Slow-moving and obsolete inventory identification',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'valuation-report',
    title: 'Inventory Valuation',
    description: 'Total inventory value, cost analysis, and variance',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'abc-analysis',
    title: 'ABC Analysis',
    description: 'Product categorization by value and importance',
    frequency: 'Quarterly',
    status: 'active'
  }
]

export default function StoreReportsPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    turnoverRate: 0,
    warehouseUtilization: 0
  })

  useEffect(() => {
    async function fetchStoreData() {
      try {
        const response = await fetch('/api/reports/inventory')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats || {
            totalProducts: 1240,
            activeProducts: 1180,
            lowStockItems: 45,
            totalValue: 2850000,
            turnoverRate: 6.8,
            warehouseUtilization: 78.5
          })
        }
      } catch (error) {
        console.error('Error fetching store data:', error)
        setStats({
          totalProducts: 1240,
          activeProducts: 1180,
          lowStockItems: 45,
          totalValue: 2850000,
          turnoverRate: 6.8,
          warehouseUtilization: 78.5
        })
      }
    }

    fetchStoreData()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Reports</h1>
          <p className="text-muted-foreground">
            Inventory levels, stock movements, and warehouse analytics
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

      {/* Store Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeProducts}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">AED {(stats.totalValue / 1000)}K</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Turnover Rate</p>
                <p className="text-2xl font-bold">{stats.turnoverRate}x</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold">{stats.warehouseUtilization}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Store Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {storeReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-teal-600" />
                    <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                      {report.frequency}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{report.title}</h3>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1 text-xs">
                      Generate
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3" />
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