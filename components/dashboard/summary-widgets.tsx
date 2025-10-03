"use client"

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    isPositive: boolean
  }
  icon: React.ElementType
  color: string
}

interface StatsType {
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

function MetricCard({ title, value, change, icon: Icon, color }: MetricCardProps) {
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            {change.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={change.isPositive ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(change.value)}%
            </span>
            <span>from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface SummaryWidgetsProps {
  stats?: StatsType
}

export function SummaryWidgets({ stats }: SummaryWidgetsProps) {
  const [isLoading, setIsLoading] = useState(!stats)

  useEffect(() => {
    if (stats) {
      setIsLoading(false)
    }
  }, [stats])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6 text-center text-gray-500">
            No data available
          </CardContent>
        </Card>
      </div>
    )
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(Number(stats.totalRevenue.value)),
      change: stats.totalRevenue.change,
      icon: DollarSign,
      color: "green"
    },
    {
      title: "Active Clients",
      value: (stats.activeClients.value ?? 0).toLocaleString(),
      change: stats.activeClients.change,
      icon: Users,
      color: "blue"
    },
    {
      title: "Products in Stock",
      value: (stats.productsInStock.value ?? 0).toLocaleString(),
      change: stats.productsInStock.change,
      icon: Package,
      color: "purple"
    },
    {
      title: "Pending Orders",
      value: (stats.pendingOrders.value ?? 0).toLocaleString(),
      change: stats.pendingOrders.change,
      icon: ShoppingCart,
      color: "orange"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          icon={metric.icon}
          color={metric.color}
        />
      ))}
    </div>
  )
}