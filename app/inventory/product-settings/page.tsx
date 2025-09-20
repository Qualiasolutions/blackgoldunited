'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Package2, Tags, Layers, Image, Filter, Download, Edit, Save, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function InventoryProductSettingsPage() {
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
                <h1 className="text-3xl font-bold text-gray-900">Product Settings</h1>
                <p className="text-gray-600 mt-2">Configure product attributes, categories, and classification settings</p>
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

          {/* Settings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Layers className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attributes</p>
                  <p className="text-2xl font-bold text-gray-900">28</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Tags className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Product Types</p>
                  <p className="text-2xl font-bold text-gray-900">6</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Package2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Templates</p>
                  <p className="text-2xl font-bold text-gray-900">15</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Image className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Settings Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Categories */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-xl mr-3">
                    <Layers className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Product Categories</h3>
                </div>
                <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900">Electronics</p>
                      <p className="text-sm text-gray-500">156 products</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900">Office Supplies</p>
                      <p className="text-sm text-gray-500">89 products</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900">Software</p>
                      <p className="text-sm text-gray-500">34 products</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900">Services</p>
                      <p className="text-sm text-gray-500">12 products</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Product Attributes */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-xl mr-3">
                    <Tags className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Product Attributes</h3>
                </div>
                <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attribute
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Brand</p>
                    <p className="text-sm text-gray-500">Text field - Required</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Badge className="bg-blue-100 text-blue-800">Text</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Color</p>
                    <p className="text-sm text-gray-500">Dropdown - Optional</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Badge className="bg-purple-100 text-purple-800">Dropdown</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Weight</p>
                    <p className="text-sm text-gray-500">Number field - Required</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Badge className="bg-green-100 text-green-800">Number</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Warranty Period</p>
                    <p className="text-sm text-gray-500">Date field - Optional</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Badge className="bg-orange-100 text-orange-800">Date</Badge>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Product Templates */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-xl mr-3">
                    <Package2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Product Templates</h3>
                </div>
                <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Electronics Template</h4>
                    <Badge className="bg-blue-100 text-blue-800">5 fields</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Standard template for electronic products with brand, model, warranty</p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Use</Button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Office Supplies Template</h4>
                    <Badge className="bg-green-100 text-green-800">3 fields</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Basic template for office supplies with brand, color, quantity</p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Use</Button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Software Template</h4>
                    <Badge className="bg-purple-100 text-purple-800">4 fields</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Template for software products with license type, version, support</p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Use</Button>
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* General Product Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-orange-100 rounded-xl mr-3">
                  <Package2 className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">General Product Settings</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Product Type
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="physical">Physical Product</option>
                    <option value="digital">Digital Product</option>
                    <option value="service">Service</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU Generation Method
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="manual">Manual Entry</option>
                    <option value="auto-sequential">Auto Sequential</option>
                    <option value="auto-category">Auto by Category</option>
                    <option value="custom-pattern">Custom Pattern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU Prefix
                  </label>
                  <Input
                    type="text"
                    defaultValue="BGU"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter SKU prefix"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Upload Requirements
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="optional">Optional</option>
                    <option value="required">Required</option>
                    <option value="category-based">Based on Category</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-generate product descriptions
                    </span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" />
                      <div className="w-10 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Require product approval
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Enable product variants
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

            {/* Import/Export Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-indigo-100 rounded-xl mr-3">
                  <Download className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Import/Export</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Import Format
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="csv">CSV</option>
                    <option value="excel">Excel (XLSX)</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duplicate Handling
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="skip">Skip Duplicates</option>
                    <option value="update">Update Existing</option>
                    <option value="create-variant">Create as Variant</option>
                    <option value="ask">Ask Each Time</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <Button variant="outline" className="w-full border-orange-300 text-orange-600">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>

                  <Button variant="outline" className="w-full border-orange-300 text-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Bulk Import Products
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Validate data on import
                    </span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-10 h-6 bg-orange-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 right-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Send import notifications
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

            {/* Pricing Settings */}
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-100 rounded-xl mr-3">
                  <Tags className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Pricing Configuration</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Pricing Strategy
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="cost-plus">Cost Plus Margin</option>
                    <option value="market-based">Market Based</option>
                    <option value="value-based">Value Based</option>
                    <option value="competitive">Competitive Pricing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Markup Percentage
                  </label>
                  <Input
                    type="number"
                    defaultValue="40"
                    className="border-orange-200 focus:border-orange-400"
                    placeholder="Enter default markup %"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Rounding Method
                  </label>
                  <select className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400">
                    <option value="none">No Rounding</option>
                    <option value="nearest-cent">Nearest Cent</option>
                    <option value="nearest-dollar">Nearest Dollar</option>
                    <option value="psychological">Psychological (.99, .95)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Enable dynamic pricing
                    </span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" />
                      <div className="w-10 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                      <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Show cost price to users
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