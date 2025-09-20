'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, FileText, BarChart3, Calculator, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function AccountingPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()

  if (!hasModuleAccess('accounting')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the Accounting module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canCreate = hasFullAccess('accounting')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Accounting Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canCreate && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Journal Entry
                </Button>
              )}
              <Link href="/dashboard">
                <Button variant="outline">← Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Accounting Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$2.4M</div>
                <p className="text-xs text-muted-foreground">
                  +5.2% from last quarter
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                <Calculator className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">$890K</div>
                <p className="text-xs text-muted-foreground">
                  -2.1% from last quarter
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Owner's Equity</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">$1.51M</div>
                <p className="text-xs text-muted-foreground">
                  +8.7% from last quarter
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">186</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/finance">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Chart of Accounts</h3>
                      <p className="text-sm text-gray-600">Manage account structure and codes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Journal Entries</h3>
                    <p className="text-sm text-gray-600">Record financial transactions</p>
                    {canCreate && (
                      <Button size="sm" className="mt-2">
                        <Plus className="w-3 h-3 mr-1" />
                        New Entry
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Financial Reports</h3>
                    <p className="text-sm text-gray-600">Generate financial statements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart of Accounts */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Chart of Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { code: '1000', name: 'Cash and Cash Equivalents', type: 'ASSET', balance: 125000 },
                  { code: '1200', name: 'Accounts Receivable', type: 'ASSET', balance: 45000 },
                  { code: '1500', name: 'Inventory', type: 'ASSET', balance: 89000 },
                  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', balance: 23000 },
                  { code: '3000', name: 'Owner\'s Equity', type: 'EQUITY', balance: 236000 },
                  { code: '4000', name: 'Sales Revenue', type: 'REVENUE', balance: 450000 },
                  { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', balance: 180000 },
                  { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', balance: 95000 },
                ].map((account) => (
                  <div key={account.code} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                        {account.code}
                      </div>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-gray-600">{account.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        account.type === 'ASSET' || account.type === 'EXPENSE' ? 'text-green-600' :
                        account.type === 'LIABILITY' || account.type === 'EQUITY' || account.type === 'REVENUE' ? 'text-blue-600' :
                        'text-gray-900'
                      }`}>
                        ${account.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Journal Entries */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'JE-001', date: '2025-01-15', description: 'Sales revenue recognition', reference: 'INV-2025-001', debit: 45000, credit: 45000 },
                  { id: 'JE-002', date: '2025-01-14', description: 'Office rent payment', reference: 'RENT-JAN', debit: 8200, credit: 8200 },
                  { id: 'JE-003', date: '2025-01-13', description: 'Equipment purchase', reference: 'PO-2025-003', debit: 12500, credit: 12500 },
                  { id: 'JE-004', date: '2025-01-12', description: 'Utility bill payment', reference: 'UTIL-001', debit: 1850, credit: 1850 },
                ].map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 px-3 py-1 rounded text-sm font-mono">
                        {entry.id}
                      </div>
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-gray-600">{entry.date} • Ref: {entry.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${entry.debit.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Balanced entry</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Financial Reports Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="font-semibold text-green-600">ASSETS</div>
                  <div className="pl-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Current Assets</span>
                      <span>$259,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Fixed Assets</span>
                      <span>$2,141,000</span>
                    </div>
                  </div>

                  <div className="font-semibold text-red-600">LIABILITIES</div>
                  <div className="pl-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Current Liabilities</span>
                      <span>$340,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Long-term Liabilities</span>
                      <span>$550,000</span>
                    </div>
                  </div>

                  <div className="font-semibold text-blue-600">EQUITY</div>
                  <div className="pl-4">
                    <div className="flex justify-between text-sm">
                      <span>Owner's Equity</span>
                      <span>$1,510,000</span>
                    </div>
                  </div>

                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Total Assets</span>
                    <span>$2,400,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income Statement Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Revenue</span>
                    <span className="text-green-600 font-bold">$450,000</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Cost of Goods Sold</span>
                      <span className="text-red-600">($180,000)</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Gross Profit</span>
                      <span>$270,000</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Operating Expenses</span>
                      <span className="text-red-600">($95,000)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Administrative Expenses</span>
                      <span className="text-red-600">($38,000)</span>
                    </div>
                  </div>

                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Net Income</span>
                    <span className="text-green-600">$137,000</span>
                  </div>

                  <div className="text-sm text-gray-600">
                    Profit Margin: 30.4%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}