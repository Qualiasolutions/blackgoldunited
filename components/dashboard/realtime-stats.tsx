'use client'

import { useRealtimeStats } from '@/lib/hooks/useRealtimeStats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Users, Package, ShoppingCart, DollarSign } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change: { value: number; isPositive: boolean }
  icon: React.ReactNode
  prefix?: string
}

function StatCard({ title, value, change, icon, prefix = '' }: StatCardProps) {
  const formattedValue = typeof value === 'number'
    ? (value ?? 0).toLocaleString()
    : value

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{formattedValue}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          {change.isPositive ? (
            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
          )}
          <span className={change.isPositive ? 'text-green-500' : 'text-red-500'}>
            {change.isPositive ? '+' : ''}{change.value}%
          </span>
          <span className="ml-1">from last period</span>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivityCard({ activities }: { activities: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  ${(activity.amount ?? 0).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TopProductsCard({ products }: { products: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products by Value</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products found</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Code: {product.code} • Stock: {product.totalStock} • Warehouses: {product.warehouses}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  ${(product.price ?? 0).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function RealtimeStats() {
  const { stats, loading, error } = useRealtimeStats()

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading dashboard stats: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-muted-foreground">Live data - updates in real-time</span>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue.value}
          change={stats.totalRevenue.change}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          prefix="$"
        />
        <StatCard
          title="Active Clients"
          value={stats.activeClients.value}
          change={stats.activeClients.change}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Products in Stock"
          value={stats.productsInStock.value}
          change={stats.productsInStock.change}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders.value}
          change={stats.pendingOrders.change}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Activity and Products */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentActivityCard activities={stats.recentActivity} />
        <TopProductsCard products={stats.topProducts} />
      </div>
    </div>
  )
}