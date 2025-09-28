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
      <div className="bg-background min-h-full space-y-6">
        {/* Executive Dashboard Header */}
        <div className="mb-8">
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  Welcome back, {user.firstName}
                </h1>
                <p className="text-muted-foreground">
                  {currentDate} • Executive Dashboard Overview
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-success rounded-full"></div>
                    <span className="text-sm font-medium text-success">Operational</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">Just now</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Revenue"
            value="AED 2,847,650"
            description="This Month"
            icon={TrendingUp}
            trend={{ value: 12.5, label: "from last month", isPositive: true }}
            colorScheme="green"
          />
          <StatsCard
            title="Active Clients"
            value="1,247"
            description="Total Active"
            icon={Users}
            trend={{ value: 8.2, label: "from last month", isPositive: true }}
            colorScheme="blue"
          />
          <StatsCard
            title="Outstanding Invoices"
            value="AED 485,200"
            description="Pending Collection"
            icon={FileText}
            trend={{ value: 5.3, label: "from last month", isPositive: false }}
            colorScheme="orange"
          />
          <StatsCard
            title="Operational Efficiency"
            value="94.2%"
            description="System Performance"
            icon={BarChart3}
            trend={{ value: 2.1, label: "from last month", isPositive: true }}
            colorScheme="emerald"
          />
        </div>

        {/* Executive Search Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Global Search</h3>
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Search invoices, clients, orders..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full"
              />
              <Button className="w-full" size="sm">
                Search All Modules
              </Button>
            </div>
          </EnhancedCard>

          <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
                <FileText className="h-4 w-4 mb-1" />
                <span className="text-xs">New Invoice</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
                <Users className="h-4 w-4 mb-1" />
                <span className="text-xs">Add Client</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
                <BarChart3 className="h-4 w-4 mb-1" />
                <span className="text-xs">View Reports</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
                <Settings className="h-4 w-4 mb-1" />
                <span className="text-xs">Settings</span>
              </Button>
            </div>
          </EnhancedCard>
        </div>

        {/* Executive Module Access Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Link href="/sales">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Sales</span>
              </div>
            </EnhancedCard>
          </Link>

          <Link href="/clients">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Clients</span>
              </div>
            </EnhancedCard>
          </Link>

          <Link href="/inventory">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Inventory</span>
              </div>
            </EnhancedCard>
          </Link>

          <Link href="/purchase">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Purchase</span>
              </div>
            </EnhancedCard>
          </Link>

          <Link href="/finance">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Finance</span>
              </div>
            </EnhancedCard>
          </Link>

          <Link href="/reports">
            <EnhancedCard className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <PieChart className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Reports</span>
              </div>
            </EnhancedCard>
          </Link>
        </div>

        {/* Executive Analytics & Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Financial Overview */}
          <div className="lg:col-span-2">
            <EnhancedCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Financial Overview</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    This Month
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                  </Button>
                </div>
              </div>
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Analytics Dashboard</p>
                  <p className="text-xs text-muted-foreground mt-1">Revenue trends and forecasting</p>
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Business Insights */}
          <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Business Insights</h3>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Invoice Processing</span>
                  <span className="font-medium">98.2%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '98.2%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Client Satisfaction</span>
                  <span className="font-medium">94.7%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: '94.7%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">System Uptime</span>
                  <span className="font-medium">99.9%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '99.9%' }}></div>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </div>

        {/* Recent Transactions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Invoice #INV-2024-{1000 + item}</p>
                      <p className="text-xs text-muted-foreground">Client Payment Received</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-success">+AED {(Math.random() * 10000 + 5000).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                </div>
              ))}
            </div>
          </EnhancedCard>

          <EnhancedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">System Activity</h3>
              <Button variant="ghost" size="sm">View Logs</Button>
            </div>
            <div className="space-y-3">
              {[
                { action: "New client registered", time: "5 minutes ago", icon: Users },
                { action: "Invoice payment processed", time: "12 minutes ago", icon: DollarSign },
                { action: "Report generated", time: "25 minutes ago", icon: BarChart3 },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                  <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </EnhancedCard>
        </div>
      </div>
    </MainLayout>
  )
}