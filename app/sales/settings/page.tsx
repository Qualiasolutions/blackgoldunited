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
import { createClient } from '@/lib/supabase/client'

interface SalesSettings {
  // Invoice Settings
  invoicePrefix: string
  invoiceNumbering: 'AUTO' | 'MANUAL'
  invoiceStartNumber: number
  invoiceTerms: string
  defaultTaxRate: number

  // Payment Settings
  paymentTerms: string
  lateFee: number
  lateFeeType: 'FIXED' | 'PERCENTAGE'

  // Email Settings
  autoSendInvoices: boolean
  emailTemplate: string
  reminderEnabled: boolean
  reminderDays: number

  // General Settings
  currency: string
  dateFormat: string
  timeZone: string

  // Notifications
  notifyOnPayment: boolean
  notifyOnOverdue: boolean
  notifyOnQuote: boolean
}

export default function SalesSettingsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()
  const [settings, setSettings] = useState<SalesSettings>({
    invoicePrefix: 'INV',
    invoiceNumbering: 'AUTO',
    invoiceStartNumber: 1000,
    invoiceTerms: 'Payment due within 30 days',
    defaultTaxRate: 0,
    paymentTerms: 'Net 30',
    lateFee: 0,
    lateFeeType: 'PERCENTAGE',
    autoSendInvoices: false,
    emailTemplate: '',
    reminderEnabled: false,
    reminderDays: 3,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeZone: 'UTC',
    notifyOnPayment: true,
    notifyOnOverdue: true,
    notifyOnQuote: true
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
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sales_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }

      if (data) {
        setSettings({
          invoicePrefix: data.invoicePrefix || 'INV',
          invoiceNumbering: data.invoiceNumbering || 'AUTO',
          invoiceStartNumber: data.invoiceStartNumber || 1000,
          invoiceTerms: data.invoiceTerms || 'Payment due within 30 days',
          defaultTaxRate: data.defaultTaxRate || 0,
          paymentTerms: data.paymentTerms || 'Net 30',
          lateFee: data.lateFee || 0,
          lateFeeType: data.lateFeeType || 'PERCENTAGE',
          autoSendInvoices: data.autoSendInvoices || false,
          emailTemplate: data.emailTemplate || '',
          reminderEnabled: data.reminderEnabled || false,
          reminderDays: data.reminderDays || 3,
          currency: data.currency || 'USD',
          dateFormat: data.dateFormat || 'MM/DD/YYYY',
          timeZone: data.timeZone || 'UTC',
          notifyOnPayment: data.notifyOnPayment ?? true,
          notifyOnOverdue: data.notifyOnOverdue ?? true,
          notifyOnQuote: data.notifyOnQuote ?? true
        })
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
      const supabase = createClient()

      const { error } = await supabase
        .from('sales_settings')
        .upsert([{
          ...settings,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.id
        }])

      if (error) throw error

      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('Error saving settings. Please try again.')
      setTimeout(() => setMessage(''), 3000)
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
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left Column */}
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
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="invoiceNumbering">Numbering System</Label>
                    <select
                      id="invoiceNumbering"
                      value={settings.invoiceNumbering}
                      onChange={(e) => handleInputChange('invoiceNumbering', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AUTO">Auto-increment</option>
                      <option value="MANUAL">Manual entry</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="invoiceTerms">Default Terms</Label>
                    <Textarea
                      id="invoiceTerms"
                      value={settings.invoiceTerms}
                      onChange={(e) => handleInputChange('invoiceTerms', e.target.value)}
                      placeholder="Payment due within 30 days"
                      rows={2}
                    />
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
                    <Label htmlFor="paymentTerms">Default Payment Terms</Label>
                    <select
                      id="paymentTerms"
                      value={settings.paymentTerms}
                      onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Due on receipt">Due on receipt</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lateFee">Late Fee</Label>
                      <Input
                        id="lateFee"
                        type="number"
                        value={settings.lateFee}
                        onChange={(e) => handleInputChange('lateFee', Number(e.target.value))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lateFeeType">Fee Type</Label>
                      <select
                        id="lateFeeType"
                        value={settings.lateFeeType}
                        onChange={(e) => handleInputChange('lateFeeType', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="FIXED">Fixed Amount</option>
                        <option value="PERCENTAGE">Percentage</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <select
                        id="currency"
                        value={settings.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <select
                        id="dateFormat"
                        value={settings.dateFormat}
                        onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="timeZone">Time Zone</Label>
                      <select
                        id="timeZone"
                        value={settings.timeZone}
                        onChange={(e) => handleInputChange('timeZone', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">

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
                    <Label htmlFor="autoSendInvoices">Auto-send invoices</Label>
                    <Switch
                      id="autoSendInvoices"
                      checked={settings.autoSendInvoices}
                      onCheckedChange={(checked) => handleInputChange('autoSendInvoices', checked)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailTemplate">Email Template</Label>
                    <Textarea
                      id="emailTemplate"
                      value={settings.emailTemplate}
                      onChange={(e) => handleInputChange('emailTemplate', e.target.value)}
                      placeholder="Dear {client_name}, Please find attached your invoice..."
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="reminderEnabled">Payment reminders</Label>
                    <Switch
                      id="reminderEnabled"
                      checked={settings.reminderEnabled}
                      onCheckedChange={(checked) => handleInputChange('reminderEnabled', checked)}
                    />
                  </div>

                  {settings.reminderEnabled && (
                    <div>
                      <Label htmlFor="reminderDays">Reminder days before due</Label>
                      <Input
                        id="reminderDays"
                        type="number"
                        value={settings.reminderDays}
                        onChange={(e) => handleInputChange('reminderDays', Number(e.target.value))}
                        min="1"
                        max="30"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifyOnPayment">Payment received</Label>
                    <Switch
                      id="notifyOnPayment"
                      checked={settings.notifyOnPayment}
                      onCheckedChange={(checked) => handleInputChange('notifyOnPayment', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifyOnOverdue">Overdue invoices</Label>
                    <Switch
                      id="notifyOnOverdue"
                      checked={settings.notifyOnOverdue}
                      onCheckedChange={(checked) => handleInputChange('notifyOnOverdue', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifyOnQuote">New quote requests</Label>
                    <Switch
                      id="notifyOnQuote"
                      checked={settings.notifyOnQuote}
                      onCheckedChange={(checked) => handleInputChange('notifyOnQuote', checked)}
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
                    <p><strong>Invoice Prefix:</strong> Appears before invoice numbers (e.g., INV-001)</p>
                    <p><strong>Auto-increment:</strong> Automatically generates sequential numbers</p>
                    <p><strong>Payment Terms:</strong> Default terms shown on new invoices</p>
                    <p><strong>Late Fees:</strong> Automatically calculated based on payment terms</p>
                    <p><strong>Email Templates:</strong> Use {'{client_name}'}, {'{invoice_number}'}, {'{amount}'} for dynamic content</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}