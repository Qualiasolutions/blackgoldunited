'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings, Calculator, Calendar, DollarSign, Shield, Save, RefreshCw, ArrowLeft, Lock, Bell } from 'lucide-react'
import Link from 'next/link'

export default function AccountingSettingsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()

  const canManage = hasFullAccess('accounting')

  if (!user) {
    return null
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You need FULL access to Accounting module to manage settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Accounting Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/accounting">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* General Accounting Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-xl mr-3">
                    <Settings className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>General Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accounting Method
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="accrual">Accrual Accounting</option>
                    <option value="cash">Cash Accounting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Currency
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiscal Year Start
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="1">January</option>
                    <option value="4">April</option>
                    <option value="7">July</option>
                    <option value="10">October</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Tax Rate (%)
                  </label>
                  <Input
                    type="number"
                    defaultValue="5"
                    step="0.1"
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Month
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="12">December</option>
                    <option value="3">March</option>
                    <option value="6">June</option>
                    <option value="9">September</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Journal Entry Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-xl mr-3">
                    <Calculator className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Journal Entry Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-Numbering Format
                  </label>
                  <Input
                    type="text"
                    defaultValue="JE-{YYYY}-{####}"
                    className="border-gray-300 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: JE-2025-0001
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Require Journal Approval
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="disabled">Disabled</option>
                    <option value="enabled">Enabled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allow Backdating
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="disabled">Disabled</option>
                    <option value="enabled">Enabled</option>
                    <option value="limited">Limited (Within 30 days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lock Period After Days
                  </label>
                  <Input
                    type="number"
                    defaultValue="90"
                    className="border-gray-300 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Prevent editing entries older than this
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-Balance Entries
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Depreciation Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-xl mr-3">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Depreciation Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Depreciation Method
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="STRAIGHT_LINE">Straight Line</option>
                    <option value="DECLINING_BALANCE">Declining Balance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-Calculate Depreciation
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depreciation Start Date
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="purchase">Purchase Date</option>
                    <option value="next_month">Start of Next Month</option>
                    <option value="next_quarter">Start of Next Quarter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Threshold (AED)
                  </label>
                  <Input
                    type="number"
                    defaultValue="1000"
                    className="border-gray-300 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum value to be treated as fixed asset
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reporting & Compliance */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-xl mr-3">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Reporting & Compliance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Financial Reporting Standard
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="ifrs">IFRS</option>
                    <option value="gaap">GAAP</option>
                    <option value="local">Local Standard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audit Trail
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Automated Reconciliation
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="csv">CSV (.csv)</option>
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="json">JSON (.json)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Reports</p>
                    <p className="text-xs text-gray-500">Send monthly reports automatically</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}