'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, DollarSign, CreditCard, Download, FileText } from 'lucide-react'
import Link from 'next/link'

const clientReports = [
  {
    id: 'client-analytics',
    title: 'Client Analytics',
    description: 'Customer behavior, preferences, and engagement metrics',
    frequency: 'Weekly',
    status: 'active'
  },
  {
    id: 'payment-status',
    title: 'Payment Status Report',
    description: 'Outstanding payments, collection status, and aging',
    frequency: 'Daily',
    status: 'active'
  },
  {
    id: 'client-profitability',
    title: 'Client Profitability',
    description: 'Revenue per client, profit margins, and value analysis',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'retention-analysis',
    title: 'Retention Analysis',
    description: 'Client retention rates, churn analysis, and loyalty metrics',
    frequency: 'Quarterly',
    status: 'active'
  },
  {
    id: 'credit-limit-report',
    title: 'Credit Limit Report',
    description: 'Credit utilization, limits, and risk assessment',
    frequency: 'Monthly',
    status: 'active'
  }
]

export default function ClientReportsPage() {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    newClients: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    paymentRate: 0
  })

  useEffect(() => {
    async function fetchClientData() {
      try {
        const response = await fetch('/api/reports/clients')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats || {
            totalClients: 142,
            activeClients: 128,
            newClients: 8,
            totalRevenue: 1250000,
            averageOrderValue: 8800,
            paymentRate: 92.5
          })
        }
      } catch (error) {
        console.error('Error fetching client data:', error)
        setStats({
          totalClients: 142,
          activeClients: 128,
          newClients: 8,
          totalRevenue: 1250000,
          averageOrderValue: 8800,
          paymentRate: 92.5
        })
      }
    }

    fetchClientData()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Reports</h1>
          <p className="text-muted-foreground">
            Customer analytics, payment status, and relationship insights
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

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold text-purple-600">{stats.newClients}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">AED {(stats.totalRevenue / 1000)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">AED {stats.averageOrderValue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.paymentRate}%</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Client Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-pink-600" />
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