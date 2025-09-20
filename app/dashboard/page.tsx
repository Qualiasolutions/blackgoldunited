'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { useState } from 'react'
import {
  Search,
  Plus,
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  ArrowRight,
  Bell,
  Settings,
  Filter
} from 'lucide-react'
import { StatsCard } from '@/components/ui/stats-card'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/layout/main-layout'

export default function DashboardPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [clientSearch, setClientSearch] = useState('')

  if (!user) {
    return null
  }

  // Format current date like in the screenshot
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return (
    <MainLayout user={{ name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role }}>
      <div className="bg-gray-50 min-h-full">
        {/* Main Dashboard Content */}
        <div className="py-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Hi {user.firstName}, Welcome Back!
            </h2>
            <p className="text-gray-600">
              {currentDate} - Your BGU Dashboard overview
            </p>
          </div>

          {/* Search Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Invoice Search */}
            <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invoice Search</h3>
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Search invoices..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full"
              />
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                SEARCH
              </Button>
            </div>
          </EnhancedCard>

          {/* Client Search */}
          <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Client Search</h3>
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Search clients..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full"
              />
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                SEARCH
              </Button>
            </div>
          </EnhancedCard>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/sales/invoices/create">
            <EnhancedCard
              variant="interactive"
              colorScheme="blue"
              className="h-32 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all duration-200"
            >
              <div className="bg-blue-100 p-3 rounded-lg mb-2">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <span className="font-medium text-blue-900">Create Invoice</span>
            </EnhancedCard>
          </Link>

          <Link href="/sales/invoices">
            <EnhancedCard
              variant="interactive"
              colorScheme="green"
              className="h-32 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all duration-200"
            >
              <div className="bg-green-100 p-3 rounded-lg mb-2">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <span className="font-medium text-green-900">Invoices</span>
            </EnhancedCard>
          </Link>

          <Link href="/clients">
            <EnhancedCard
              variant="interactive"
              colorScheme="purple"
              className="h-32 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all duration-200"
            >
              <div className="bg-purple-100 p-3 rounded-lg mb-2">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <span className="font-medium text-purple-900">Clients</span>
            </EnhancedCard>
          </Link>

          <Link href="/clients/create">
            <EnhancedCard
              variant="interactive"
              colorScheme="orange"
              className="h-32 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all duration-200"
            >
              <div className="bg-orange-100 p-3 rounded-lg mb-2">
                <Plus className="h-6 w-6 text-orange-600" />
              </div>
              <span className="font-medium text-orange-900">New Client</span>
            </EnhancedCard>
          </Link>
          </div>

          {/* Sales Section */}
          <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Sales</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                All Invoices
              </Button>
              <Button variant="outline" size="sm">
                Profit & Loss
              </Button>
              <Button variant="outline" size="sm">
                Recent Invoices
              </Button>
              <Button variant="outline" size="sm">
                Overdue Invoices
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-600">Invoices from</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                18/09/2025 to 18/09/2025
              </Badge>
              <Button size="sm" variant="ghost" className="text-blue-600">
                Today
              </Button>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line Chart Placeholder */}
            <EnhancedCard className="p-6">
              <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No data available</p>
                  <p className="text-sm text-gray-400">Sales chart will appear here</p>
                </div>
              </div>
            </EnhancedCard>

            {/* Pie Chart Placeholder */}
            <EnhancedCard className="p-6">
              <div className="h-64 bg-gradient-to-br from-yellow-50 to-red-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No data available</p>
                  <p className="text-sm text-gray-400">Revenue breakdown chart</p>
                </div>
              </div>
            </EnhancedCard>
          </div>
          </div>

          {/* Payments Section */}
          <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Payments</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                Successful
              </Button>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                Recent Payments
              </Button>
              <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                View All
              </Button>
            </div>
          </div>

          {/* Payment Chart Placeholder */}
          <EnhancedCard className="p-6">
            <div className="h-32 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Payments from 18/09/2025 to 18/09/2025</p>
                <p className="text-xs text-gray-400 mt-1">Payment tracking chart will appear here</p>
              </div>
            </div>
          </EnhancedCard>
          </div>

          {/* Recent Activity */}
          <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          <EnhancedCard className="p-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">
                Your recent transactions and updates will appear here
              </p>
              {hasFullAccess('sales') && (
                <Link href="/sales/invoices/create" className="mt-4 inline-block">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Create First Invoice
                  </Button>
                </Link>
              )}
            </div>
          </EnhancedCard>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}