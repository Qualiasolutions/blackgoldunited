'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings, Users, CreditCard, FileText, Globe, Shield, Save, RefreshCw, Building2 } from 'lucide-react'

export default function SupplierSettingsPage() {
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
                <h1 className="text-3xl font-bold text-gray-900">Supplier Settings</h1>
                <p className="text-gray-600 mt-2">Configure supplier management and vendor relationship settings</p>
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
            {/* Supplier Registration Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-blue-100 rounded-xl mr-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Supplier Registration</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier ID Format
                  </label>
                  <Input
                    type="text"
                    defaultValue="SUP-{####}"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter ID format"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use {'{####}'} for auto-incrementing numbers</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Supplier Category
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="general">General Supplier</option>
                    <option value="preferred">Preferred Vendor</option>
                    <option value="strategic">Strategic Partner</option>
                    <option value="service">Service Provider</option>
                  </select>
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
                    Default Currency
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-generate supplier IDs
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Require tax ID for registration
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

            {/* Credit and Financial Settings */}
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
                    defaultValue="50000"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter default credit limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Check Required Above
                  </label>
                  <Input
                    type="number"
                    defaultValue="10000"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter threshold amount"
                  />
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
                    Late Payment Penalty (%)
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
                      Auto-approve within credit limit
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Track supplier performance metrics
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

            {/* Document Requirements */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-purple-100 rounded-xl mr-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Document Requirements</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Documents for Registration
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm text-gray-700">Business License</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm text-gray-700">Tax Registration Certificate</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">Insurance Certificate</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">Quality Certifications</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm text-gray-700">Banking Information</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Renewal Reminder (Days)
                  </label>
                  <Input
                    type="number"
                    defaultValue="30"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Storage Retention (Years)
                  </label>
                  <Input
                    type="number"
                    defaultValue="7"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Auto-archive expired documents
                  </span>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only" />
                    <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                    <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Performance Evaluation */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-orange-100 rounded-xl mr-3">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Performance Evaluation</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evaluation Frequency
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi-annual">Semi-Annual</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Performance Score (%)
                  </label>
                  <Input
                    type="number"
                    defaultValue="75"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Performance Criteria Weights
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Quality (%):</span>
                      <Input type="number" defaultValue="30" className="w-20 border-orange-200 text-sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Delivery (%):</span>
                      <Input type="number" defaultValue="25" className="w-20 border-orange-200 text-sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Cost (%):</span>
                      <Input type="number" defaultValue="25" className="w-20 border-orange-200 text-sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Service (%):</span>
                      <Input type="number" defaultValue="20" className="w-20 border-orange-200 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-generate performance reports
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Alert on poor performance
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

            {/* Security and Compliance */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-red-100 rounded-xl mr-3">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Security & Compliance</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Check Requirements
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="none">No Background Check</option>
                    <option value="basic">Basic Verification</option>
                    <option value="standard">Standard Background Check</option>
                    <option value="comprehensive">Comprehensive Check</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Clearance Level Required
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="none">No Clearance Required</option>
                    <option value="confidential">Confidential</option>
                    <option value="secret">Secret</option>
                    <option value="top-secret">Top Secret</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compliance Standards Required
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">ISO 9001 (Quality)</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">ISO 14001 (Environmental)</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">SOC 2 (Security)</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">GDPR Compliance</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Monitor supplier risk status
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-suspend non-compliant suppliers
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
                    Supplier Portal Access
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="enabled">Enabled for All</option>
                    <option value="selective">Selective Access</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EDI Integration Level
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="none">No EDI</option>
                    <option value="basic">Basic EDI</option>
                    <option value="advanced">Advanced EDI</option>
                    <option value="custom">Custom Integration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Sync Frequency
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="real-time">Real-time</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Enable API access for suppliers
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