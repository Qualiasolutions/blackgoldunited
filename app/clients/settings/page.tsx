'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings, Users, CreditCard, Mail, Bell, Shield, Database, Globe, Save, RefreshCw } from 'lucide-react'

export default function ClientsSettingsPage() {
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
                <h1 className="text-3xl font-bold text-gray-900">Client Management Settings</h1>
                <p className="text-gray-600 mt-2">Configure client module preferences and defaults</p>
              </div>
              {hasFullAccess('clients') && (
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
            {/* Client Default Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-blue-100 rounded-xl mr-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Client Defaults</h3>
              </div>

              <div className="space-y-6">
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
                    Default Currency
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
                    Default Client Status
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="active">Active</option>
                    <option value="prospect">Prospect</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </EnhancedCard>

            {/* Credit & Financial Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-100 rounded-xl mr-3">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Credit & Financial</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Credit Limit
                  </label>
                  <Input
                    type="number"
                    defaultValue="10000"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter default credit limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Check Required
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="always">Always Required</option>
                    <option value="threshold">Above Threshold Only</option>
                    <option value="never">Never Required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Threshold Amount
                  </label>
                  <Input
                    type="number"
                    defaultValue="5000"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Auto-approve within credit limit
                  </span>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only" />
                    <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                    <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Communication Preferences */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-purple-100 rounded-xl mr-3">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Communication</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Email Template
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="welcome">Welcome Email</option>
                    <option value="invoice">Invoice Email</option>
                    <option value="reminder">Payment Reminder</option>
                    <option value="follow-up">Follow-up Email</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-send Invoice Emails
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="always">Always Send</option>
                    <option value="ask">Ask Each Time</option>
                    <option value="never">Never Send</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Send welcome emails to new clients
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      CC admin on client communications
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

            {/* Security & Access Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-red-100 rounded-xl mr-3">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Security & Access</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Data Retention (Years)
                  </label>
                  <Input
                    type="number"
                    defaultValue="7"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Fields for Client Creation
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm text-gray-700">Company Name</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm text-gray-700">Contact Person</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">Tax ID Number</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm text-gray-700">Email Address</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Enable client portal access
                  </span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" />
                    <div className="w-10 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                    <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition"></div>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Data Management */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-orange-100 rounded-xl mr-3">
                  <Database className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Data Management</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duplicate Detection Method
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="email">Email Address</option>
                    <option value="company">Company Name</option>
                    <option value="tax-id">Tax ID</option>
                    <option value="all">All Fields</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-merge Duplicate Clients
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="never">Never Auto-merge</option>
                    <option value="suggest">Suggest Merge</option>
                    <option value="auto">Auto-merge Exact Matches</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Archive inactive clients automatically
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="ml-6">
                    <label className="block text-xs text-gray-600 mb-1">
                      Archive after (months of inactivity)
                    </label>
                    <Input
                      type="number"
                      defaultValue="12"
                      className="w-20 border-orange-200 focus:border-orange-400 text-sm"
                    />
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Integration Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-indigo-100 rounded-xl mr-3">
                  <Globe className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Integrations</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CRM Integration
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="none">No Integration</option>
                    <option value="salesforce">Salesforce</option>
                    <option value="hubspot">HubSpot</option>
                    <option value="pipedrive">Pipedrive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sync Frequency
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="real-time">Real-time</option>
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Daily</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Enable API access for clients
                    </span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" />
                      <div className="w-10 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-sync with accounting system
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