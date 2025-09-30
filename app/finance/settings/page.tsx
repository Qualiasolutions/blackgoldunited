'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings, DollarSign, Calendar, Bell, Shield, Save, RefreshCw, ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'

export default function FinanceSettingsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()

  const canManage = hasFullAccess('finance')

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
            <p className="text-gray-600">You need FULL access to Finance module to manage settings.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Finance Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/finance">
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

            {/* General Settings */}
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
                    Default Currency
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
                    Transaction Prefix
                  </label>
                  <Input
                    type="text"
                    defaultValue="FIN"
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Approval Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-xl mr-3">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Approval & Limits</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Approval Threshold (AED)
                  </label>
                  <Input
                    type="number"
                    defaultValue="10000"
                    className="border-gray-300 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Expenses above this amount require approval
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Income Verification Threshold (AED)
                  </label>
                  <Input
                    type="number"
                    defaultValue="50000"
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Multi-Level Approval
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="disabled">Disabled</option>
                    <option value="enabled">Enabled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-Approve Under (AED)
                  </label>
                  <Input
                    type="number"
                    defaultValue="1000"
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-xl mr-3">
                    <Bell className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Low Balance Alert</p>
                    <p className="text-xs text-gray-500">Alert when account balance is low</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Expense Approval</p>
                    <p className="text-xs text-gray-500">Notify when expense needs approval</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Income Received</p>
                    <p className="text-xs text-gray-500">Notify when income is received</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Daily Summary</p>
                    <p className="text-xs text-gray-500">Send daily financial summary</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Balance Threshold (AED)
                  </label>
                  <Input
                    type="number"
                    defaultValue="5000"
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Integration Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-xl mr-3">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Integration Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accounting System Sync
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400">
                    <option value="disabled">Disabled</option>
                    <option value="realtime">Real-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Feed Connection
                  </label>
                  <Badge variant="secondary">Not Connected</Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Connect to automatically import transactions
                  </p>
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