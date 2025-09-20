"use client"

import { useState, useEffect } from 'react'
import { QuickActions } from './quick-actions'
import { SummaryWidgets } from './summary-widgets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface DashboardPageProps {
  user?: {
    name: string
    email: string
    role: string
  }
}

interface DashboardStats {
  totalRevenue: {
    value: number
    change: { value: number; isPositive: boolean }
  }
  activeClients: {
    value: number
    change: { value: number; isPositive: boolean }
  }
  productsInStock: {
    value: number
    change: { value: number; isPositive: boolean }
  }
  pendingOrders: {
    value: number
    change: { value: number; isPositive: boolean }
  }
  recentActivity: Array<{
    id: string
    type: string
    description: string
    amount: number
    timestamp: string
  }>
  topProducts: Array<{
    id: string
    name: string
    code: string
    price: number
    totalStock: number
    warehouses: number
  }>
}

export function DashboardPage({ user }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.name || 'User'}! Here's what's happening with your business.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
        <QuickActions />
      </div>

      {/* Business Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Business Overview</h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading dashboard data...</span>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
            <p>Error loading dashboard: {error}</p>
          </div>
        ) : stats ? (
          <SummaryWidgets stats={stats} />
        ) : null}
      </div>

      {/* Additional Sections */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Products */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">Code: {product.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${Number(product.price).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Stock: {product.totalStock}</p>
                    </div>
                  </div>
                ))}
                {(!stats.topProducts || stats.topProducts.length === 0) && (
                  <p className="text-gray-500 text-center py-4">
                    No products found. Add some products to see them here.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{activity.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      ${Number(activity.amount).toFixed(2)}
                    </Badge>
                  </div>
                ))}
                {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                  <p className="text-gray-500 text-center py-4">
                    No recent activity. Start creating invoices to see activity here.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}