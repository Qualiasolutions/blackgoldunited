'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, TrendingDown, Calculator, Download, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'

const accountingReports = [
  {
    id: 'profit-loss',
    title: 'Profit & Loss Statement',
    description: 'Comprehensive P&L statement with revenue and expense breakdown',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'balance-sheet',
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity position',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow Statement',
    description: 'Operating, investing, and financing cash flows',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'trial-balance',
    title: 'Trial Balance',
    description: 'All account balances for verification',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'accounts-receivable',
    title: 'Accounts Receivable',
    description: 'Outstanding customer payments and aging analysis',
    frequency: 'Weekly',
    status: 'active'
  },
  {
    id: 'accounts-payable',
    title: 'Accounts Payable',
    description: 'Outstanding supplier payments and cash flow planning',
    frequency: 'Weekly',
    status: 'active'
  },
  {
    id: 'budget-variance',
    title: 'Budget Variance Analysis',
    description: 'Actual vs budgeted performance analysis',
    frequency: 'Monthly',
    status: 'active'
  },
  {
    id: 'tax-report',
    title: 'Tax Report',
    description: 'VAT calculations and tax compliance reporting',
    frequency: 'Quarterly',
    status: 'active'
  }
]

export default function AccountingReportsPage() {
  const [financialStats, setFinancialStats] = useState({
    revenue: 0,
    expenses: 0,
    netIncome: 0,
    cashPosition: 0,
    receivables: 0,
    payables: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFinancialData() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/reports/accounting')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch accounting data')
        }

        if (result.success && result.data) {
          setFinancialStats({
            revenue: Number(result.data.totalRevenue) || 0,
            expenses: Number(result.data.totalExpenses) || 0,
            netIncome: Number(result.data.netIncome) || 0,
            cashPosition: Number(result.data.cashPosition) || 0,
            receivables: Number(result.data.accountsReceivable) || 0,
            payables: Number(result.data.accountsPayable) || 0
          })
        }
      } catch (error) {
        console.error('Error fetching financial data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialData()
  }, [])

  const profitMargin = financialStats.revenue > 0 ?
    ((financialStats.netIncome / financialStats.revenue) * 100).toFixed(1) : '0'

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading accounting reports...</p>
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting Reports</h1>
          <p className="text-muted-foreground">
            Financial statements, P&L, balance sheets, and compliance reports
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

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  AED {(financialStats.revenue / 1000)}K
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                <p className="text-xl font-bold text-red-600">
                  AED {(financialStats.expenses / 1000)}K
                </p>
              </div>
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                <p className="text-xl font-bold text-blue-600">
                  AED {(financialStats.netIncome / 1000)}K
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cash Position</p>
                <p className="text-xl font-bold">AED {(financialStats.cashPosition / 1000)}K</p>
              </div>
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receivables</p>
                <p className="text-xl font-bold">AED {(financialStats.receivables / 1000)}K</p>
              </div>
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                <p className="text-xl font-bold text-green-600">{profitMargin}%</p>
              </div>
              <Calculator className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Accounting Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {accountingReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-purple-600" />
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