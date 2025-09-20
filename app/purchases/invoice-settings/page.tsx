'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings, FileText, Calculator, Calendar, Bell, CreditCard, Save, RefreshCw, AlertTriangle } from 'lucide-react'

export default function PurchaseInvoiceSettingsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()

  if (!user) {
    return null
  }

  return (
    <MainLayout user={{ name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role }}>
      <div className="bg-gradient-to-br from-white via-orange-50 to-white min-h-full">
        <div className="py-8 px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Purchase Invoice Settings</h1>
                <p className="text-gray-600 mt-2">Configure purchase invoice processing and approval workflows</p>
              </div>
              {hasFullAccess('purchase') && (
                <div className="flex space-x-3">
                  <Button variant="outline" className="border-orange-300 text-orange-600">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Invoice Processing Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-blue-100 rounded-xl mr-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Invoice Processing</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Invoice Currency
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number Format
                  </label>
                  <Input
                    type="text"
                    defaultValue="INV-{YYYY}-{####}"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter invoice format"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use {'{YYYY}'} for year, {'{MM}'} for month, {'{####}'} for sequence</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Payment Terms (Days)
                  </label>
                  <Input
                    type="number"
                    defaultValue="30"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Matching Method
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="2-way">2-Way Matching (PO + Invoice)</option>
                    <option value="3-way">3-Way Matching (PO + GRN + Invoice)</option>
                    <option value="manual">Manual Verification</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-generate invoice numbers
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Require purchase order reference
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Approval Workflow Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-100 rounded-xl mr-3">
                  <Settings className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Approval Workflow</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Required Above Amount
                  </label>
                  <Input
                    type="number"
                    defaultValue="1000"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter threshold amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Approver
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="manager">Department Manager</option>
                    <option value="finance">Finance Manager</option>
                    <option value="ceo">CEO</option>
                    <option value="custom">Custom Approver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Approver (Above $5,000)
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="finance">Finance Director</option>
                    <option value="ceo">CEO</option>
                    <option value="board">Board Member</option>
                    <option value="none">No Secondary Approval</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Timeout (Hours)
                  </label>
                  <Input
                    type="number"
                    defaultValue="48"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-approve exact PO matches
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Escalate overdue approvals
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Tax and Accounting Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-purple-100 rounded-xl mr-3">
                  <Calculator className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Tax & Accounting</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Tax Rate (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue="0.00"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Calculation Method
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="exclusive">Tax Exclusive</option>
                    <option value="inclusive">Tax Inclusive</option>
                    <option value="auto">Auto-detect from Supplier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Expense Account
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="5000">5000 - General Expenses</option>
                    <option value="5100">5100 - Office Supplies</option>
                    <option value="5200">5200 - Equipment</option>
                    <option value="5300">5300 - Professional Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withholding Tax Rate (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue="0.00"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-calculate taxes
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Post to accounting immediately
                    </span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" />
                      <div className="w-10 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition"></div>
                    </div>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Payment Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-orange-100 rounded-xl mr-3">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Payment Settings</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Payment Method
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="bank-transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="credit-card">Credit Card</option>
                    <option value="wire-transfer">Wire Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Early Payment Discount (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue="2.00"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Early Payment Days
                  </label>
                  <Input
                    type="number"
                    defaultValue="10"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Late Payment Fee (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue="1.50"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-schedule payments
                    </span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" />
                      <div className="w-10 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Apply early payment discounts
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Notification Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-yellow-100 rounded-xl mr-3">
                  <Bell className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Notifications</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Recipients
                  </label>
                  <Input
                    type="email"
                    defaultValue="accounting@blackgoldunited.com"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter email addresses"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Reminder Days Before Due
                  </label>
                  <Input
                    type="number"
                    defaultValue="7"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      New invoice notifications
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Approval pending notifications
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Payment due reminders
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Overdue payment alerts
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Document Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-indigo-100 rounded-xl mr-3">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Document Management</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Retention Period (Years)
                  </label>
                  <Input
                    type="number"
                    defaultValue="7"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Storage Location
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="local">Local Server</option>
                    <option value="cloud">Cloud Storage</option>
                    <option value="hybrid">Hybrid Storage</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Require invoice attachments
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-archive paid invoices
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      OCR processing for scanned invoices
                    </span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" />
                      <div className="w-10 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition"></div>
                    </div>
                  </div>
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button variant="outline" className="border-gray-300 text-gray-700">
              Cancel
            </Button>
            <Button variant="outline" className="border-orange-300 text-orange-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}