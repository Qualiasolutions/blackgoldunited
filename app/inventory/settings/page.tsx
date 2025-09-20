'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings, Package, AlertTriangle, BarChart3, Truck, Bell, Save, RefreshCw } from 'lucide-react'

export default function InventorySettingsPage() {
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
                <h1 className="text-3xl font-bold text-gray-900">Inventory Settings</h1>
                <p className="text-gray-600 mt-2">Configure inventory management preferences and defaults</p>
              </div>
              {hasFullAccess('inventory') && (
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
            {/* General Inventory Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-blue-100 rounded-xl mr-3">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">General Settings</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Unit of Measure
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lbs">Pounds (lbs)</option>
                    <option value="meters">Meters (m)</option>
                    <option value="liters">Liters (L)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Cost Method
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="fifo">FIFO (First In, First Out)</option>
                    <option value="lifo">LIFO (Last In, First Out)</option>
                    <option value="average">Weighted Average Cost</option>
                    <option value="standard">Standard Cost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Negative Stock Policy
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="allow">Allow Negative Stock</option>
                    <option value="warn">Warn on Negative Stock</option>
                    <option value="prevent">Prevent Negative Stock</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Enable barcode scanning
                  </span>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only" />
                    <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                    <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Stock Alert Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-red-100 rounded-xl mr-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Stock Alerts</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Stock Threshold (%)
                  </label>
                  <Input
                    type="number"
                    defaultValue="20"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter percentage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Critical Stock Threshold (%)
                  </label>
                  <Input
                    type="number"
                    defaultValue="5"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter percentage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overstock Threshold (%)
                  </label>
                  <Input
                    type="number"
                    defaultValue="150"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter percentage"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Email alerts for low stock
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Dashboard notifications
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

            {/* Valuation Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-100 rounded-xl mr-3">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Valuation</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inventory Valuation Method
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="cost">Cost Price</option>
                    <option value="market">Market Value</option>
                    <option value="lower">Lower of Cost or Market</option>
                    <option value="replacement">Replacement Cost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency for Valuation
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
                    Revaluation Frequency
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annually</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Include tax in valuation
                  </span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" />
                    <div className="w-10 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                    <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition"></div>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Movement Tracking */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-purple-100 rounded-xl mr-3">
                  <Truck className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Movement Tracking</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Track Stock Movements
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="detailed">Detailed Tracking</option>
                    <option value="summary">Summary Only</option>
                    <option value="minimal">Minimal Tracking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lot/Batch Tracking
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="none">No Tracking</option>
                    <option value="optional">Optional</option>
                    <option value="required">Required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number Tracking
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="none">No Tracking</option>
                    <option value="optional">Optional</option>
                    <option value="required">Required for Electronics</option>
                    <option value="all">Required for All Items</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Track expiration dates
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Location tracking within warehouses
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

            {/* Notifications */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-orange-100 rounded-xl mr-3">
                  <Bell className="h-6 w-6 text-orange-600" />
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
                    defaultValue="inventory@blackgoldunited.com"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter email addresses"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Frequency
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="daily">Daily Summary</option>
                    <option value="weekly">Weekly Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="none">No Scheduled Reports</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Stock movement notifications
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Reorder point notifications
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Expiration date warnings
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

            {/* Integration Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-indigo-100 rounded-xl mr-3">
                  <Settings className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Integrations</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accounting System Integration
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="none">No Integration</option>
                    <option value="quickbooks">QuickBooks</option>
                    <option value="xero">Xero</option>
                    <option value="sage">Sage</option>
                    <option value="internal">Internal Accounting Module</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-commerce Platform
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="none">No Integration</option>
                    <option value="shopify">Shopify</option>
                    <option value="woocommerce">WooCommerce</option>
                    <option value="magento">Magento</option>
                    <option value="custom">Custom API</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Real-time sync with sales
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-update purchase orders
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