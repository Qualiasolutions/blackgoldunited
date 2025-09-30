'use client'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, Calculator, DollarSign, Calendar, Save, RefreshCw, ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'

export default function PayrollSettingsPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()
  const canManage = hasFullAccess('payroll')

  if (!user) return null

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You need FULL access to Payroll module to manage settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Payroll Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/payroll"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><div className="flex items-center"><div className="p-2 bg-blue-100 rounded-xl mr-3"><Settings className="h-6 w-6 text-blue-600" /></div><CardTitle>General Settings</CardTitle></div></CardHeader>
              <CardContent className="space-y-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Pay Cycle</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2"><option>Monthly</option><option>Bi-weekly</option><option>Weekly</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2"><option>AED</option><option>USD</option><option>EUR</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Pay Date</label><Input type="number" defaultValue="25" min="1" max="31" /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><div className="flex items-center"><div className="p-2 bg-green-100 rounded-xl mr-3"><Calculator className="h-6 w-6 text-green-600" /></div><CardTitle>Tax & Deductions</CardTitle></div></CardHeader>
              <CardContent className="space-y-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Income Tax Rate (%)</label><Input type="number" defaultValue="0" step="0.1" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Social Security (%)</label><Input type="number" defaultValue="5" step="0.1" /></div>
                <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-900">Auto Calculate Tax</p><p className="text-xs text-gray-500">Automatically calculate taxes</p></div><input type="checkbox" defaultChecked className="h-4 w-4" /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><div className="flex items-center"><div className="p-2 bg-purple-100 rounded-xl mr-3"><DollarSign className="h-6 w-6 text-purple-600" /></div><CardTitle>Overtime & Bonuses</CardTitle></div></CardHeader>
              <CardContent className="space-y-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Overtime Rate Multiplier</label><Input type="number" defaultValue="1.5" step="0.1" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Weekend Multiplier</label><Input type="number" defaultValue="2" step="0.1" /></div>
                <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-900">Auto Calculate Overtime</p></div><input type="checkbox" defaultChecked className="h-4 w-4" /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><div className="flex items-center"><div className="p-2 bg-orange-100 rounded-xl mr-3"><Calendar className="h-6 w-6 text-orange-600" /></div><CardTitle>Approval & Processing</CardTitle></div></CardHeader>
              <CardContent className="space-y-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Payroll Approval Required</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2"><option>Always</option><option>Over Threshold</option><option>Never</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Auto-Process Date</label><Input type="number" defaultValue="20" min="1" max="31" /><p className="text-xs text-gray-500 mt-1">Auto-process payroll on this date</p></div>
                <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-900">Send Payslips via Email</p></div><input type="checkbox" defaultChecked className="h-4 w-4" /></div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Reset to Defaults</Button>
            <Button className="bg-blue-600 hover:bg-blue-700"><Save className="h-4 w-4 mr-2" />Save Changes</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
