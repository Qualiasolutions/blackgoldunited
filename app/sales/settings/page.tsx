'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Settings,
  ArrowLeft,
  Save,
  AlertCircle,
  FileText,
  DollarSign,
  Mail,
  Bell,
  Shield,
  Users,
  Calculator
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface SalesSettings {
  // Invoice Settings (matching database schema)
  invoicePrefix: string
  invoiceStartNumber: number
  defaultTaxRate: number
  defaultPaymentTerms: number // in days
  autoSendEmail: boolean
}

export default function SalesSettingsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()
  const [settings, setSettings] = useState<SalesSettings>({
    invoicePrefix: 'INV',
    invoiceStartNumber: 1,
    defaultTaxRate: 0,
    defaultPaymentTerms: 30,
    autoSendEmail: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const canManage = hasFullAccess('sales')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/sales/settings')
      const result = await response.json()

      if (result.success && result.data) {
        setSettings(result.data)
      } else {
        console.error('Failed to fetch settings:', result.error)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof SalesSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveSettings = async () => {
    if (!canManage) return

    setSaving(true)
    try {
      const response = await fetch('/api/sales/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        throw new Error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage(`Error: ${error instanceof Error ? error.message : 'Please try again.'}`)
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setSaving(false)
    }
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to manage Sales settings.</p>
            <Link href="/sales" className="mt-4 inline-block">
              <Button variant="outline">← Back to Sales</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/sales">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Sales
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Settings</h1>
                <p className="text-sm text-gray-600">Configure sales module preferences</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {message && (
                <div className={`text-sm px-3 py-1 rounded ${
                  message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {message}
                </div>
              )}
              <Button onClick={saveSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="space-y-6">

            {/* Invoice Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Invoice Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                    <Input
                      id="invoicePrefix"
                      value={settings.invoicePrefix}
                      onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                      placeholder="INV"
                    />
                    <p className="text-xs text-gray-500 mt-1">Appears before invoice numbers (e.g., INV-001)</p>
                  </div>
                  <div>
                    <Label htmlFor="invoiceStartNumber">Start Number</Label>
                    <Input
                      id="invoiceStartNumber"
                      type="number"
                      value={settings.invoiceStartNumber}
                      onChange={(e) => handleInputChange('invoiceStartNumber', Number(e.target.value))}
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">First invoice number to use</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    value={settings.defaultTaxRate}
                    onChange={(e) => handleInputChange('defaultTaxRate', Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default tax percentage for new invoices</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="defaultPaymentTerms">Default Payment Terms (days)</Label>
                  <Input
                    id="defaultPaymentTerms"
                    type="number"
                    value={settings.defaultPaymentTerms}
                    onChange={(e) => handleInputChange('defaultPaymentTerms', Number(e.target.value))}
                    min="0"
                    max="365"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of days before payment is due (e.g., 30 for Net 30)</p>
                </div>
              </CardContent>
            </Card>

            {/* Email Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoSendEmail">Auto-send invoice emails</Label>
                    <p className="text-xs text-gray-500 mt-1">Automatically email invoices to clients when created</p>
                  </div>
                  <Switch
                    id="autoSendEmail"
                    checked={settings.autoSendEmail}
                    onCheckedChange={(checked) => handleInputChange('autoSendEmail', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Help & Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Help & Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Invoice Prefix:</strong> Customize the prefix that appears before invoice numbers (e.g., INV for INV-001)</p>
                  <p><strong>Start Number:</strong> Set the initial invoice number. Subsequent invoices will auto-increment from this number</p>
                  <p><strong>Tax Rate:</strong> The default tax percentage that will be applied to new invoices. Can be overridden per invoice.</p>
                  <p><strong>Payment Terms:</strong> Default number of days clients have to pay invoices (commonly 15, 30, 45, or 60 days)</p>
                  <p><strong>Auto-send Emails:</strong> When enabled, invoice PDFs will be automatically emailed to clients upon creation</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}