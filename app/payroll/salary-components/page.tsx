'use client'
import { useEffect, useState } from 'react'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Eye, Edit, Trash2, ArrowLeft, Loader2, Layers, TrendingUp, TrendingDown, Lock } from 'lucide-react'
import Link from 'next/link'

export default function SalaryComponentsPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [components, setComponents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const canManage = hasFullAccess('payroll')
  const canRead = hasModuleAccess('payroll')

  useEffect(() => {
    if (canRead) {
      fetch('/api/payroll/salary-components')
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data) setComponents(result.data)
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [canRead])

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access Payroll module.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const earnings = components.filter(c => c.component_type === 'EARNING').length
  const deductions = components.filter(c => c.component_type === 'DEDUCTION').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Salary Components</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canManage && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />New Component
                </Button>
              )}
              <Link href="/payroll">
                <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total</p><p className="text-2xl font-bold">{components.length}</p></div><Layers className="h-8 w-8 text-blue-600" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Earnings</p><p className="text-2xl font-bold text-green-600">{earnings}</p></div><TrendingUp className="h-8 w-8 text-green-600" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Deductions</p><p className="text-2xl font-bold text-red-600">{deductions}</p></div><TrendingDown className="h-8 w-8 text-red-600" /></div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>All Components</CardTitle></CardHeader>
            <CardContent>
              {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div> : error ? <div className="text-center py-12 text-red-600">{error}</div> : components.length === 0 ? <div className="text-center py-12 text-gray-500">No components found</div> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calculation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {components.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.component_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap"><Badge variant={c.component_type === 'EARNING' ? 'default' : 'secondary'}>{c.component_type}</Badge></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.calculation_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap"><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                              {canManage && (<><Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button><Button size="sm" variant="ghost"><Trash2 className="h-4 w-4 text-red-600" /></Button></>)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
