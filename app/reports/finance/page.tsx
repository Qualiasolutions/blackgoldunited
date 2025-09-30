'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, TrendingDown, Wallet, Download, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function FinanceReportPage() {
  const { user } = useAuth()
  const [financeData, setFinanceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFinanceData() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/finance/reports?reportType=financial_position')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch finance data')
        }

        if (result.success) {
          setFinanceData(result.data)
        }
      } catch (error) {
        console.error('Error fetching finance data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchFinanceData()
    }
  }, [user])

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading finance reports...</p>
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

  const stats = financeData?.summary || {}

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Reports</h1>
          <p className="text-muted-foreground">
            Financial analytics and reporting dashboard
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
            Export Report
          </Button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  AED {((stats.totalIncome || 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  AED {((stats.totalExpenses || 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Cash Flow</p>
                <p className="text-2xl font-bold text-blue-600">
                  AED {((stats.netCashFlow || 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-purple-600">
                  AED {((stats.currentBalance || 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <Card>
        <CardHeader>
          <CardTitle>Available Finance Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'balance_sheet', title: 'Balance Sheet', desc: 'Financial position statement', icon: FileText },
              { id: 'income_statement', title: 'Income Statement', desc: 'Revenue and expenses', icon: TrendingUp },
              { id: 'cash_flow', title: 'Cash Flow', desc: 'Cash movement analysis', icon: Wallet },
              { id: 'trial_balance', title: 'Trial Balance', desc: 'Account verification', icon: FileText },
              { id: 'general_ledger', title: 'General Ledger', desc: 'All transactions', icon: FileText },
              { id: 'account_summary', title: 'Account Summary', desc: 'Account balances', icon: DollarSign },
            ].map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <report.icon className="h-6 w-6 text-blue-600" />
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{report.title}</h3>
                    <p className="text-xs text-muted-foreground">{report.desc}</p>
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