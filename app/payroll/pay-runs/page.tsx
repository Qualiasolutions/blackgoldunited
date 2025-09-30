'use client'

import { useEffect, useState } from 'react'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Download, Eye, Play, ArrowLeft, Loader2, Calendar, DollarSign, Users, Lock } from 'lucide-react'
import Link from 'next/link'

interface PayRun {
  id: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  total_employees: number
  total_gross: number
  total_deductions: number
  total_net: number
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  created_at: string
}

export default function PayRunsPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [payRuns, setPayRuns] = useState<PayRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const canManage = hasFullAccess('payroll')
  const canRead = hasModuleAccess('payroll')

  useEffect(() => {
    if (canRead) {
      fetchPayRuns()
    }
  }, [canRead])

  const fetchPayRuns = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (searchTerm) params.set('query', searchTerm)

      const response = await fetch(`/api/payroll/pay-runs?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch pay runs')
      }

      if (result.success && result.data) {
        setPayRuns(result.data)
      }
    } catch (error) {
      console.error('Error fetching pay runs:', error)
      setError(error instanceof Error ? error.message : 'Failed to load pay runs')
    } finally {
      setLoading(false)
    }
  }

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

  const totalGross = payRuns.reduce((sum, pr) => sum + Number(pr.total_gross), 0)
  const totalNet = payRuns.reduce((sum, pr) => sum + Number(pr.total_net), 0)
  const completedCount = payRuns.filter(pr => pr.status === 'COMPLETED').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Payroll Runs</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canManage && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Pay Run
                </Button>
              )}
              <Link href="/payroll">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Gross</p>
                    <p className="text-2xl font-bold text-green-600">AED {(totalGross / 1000).toFixed(1)}K</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Net</p>
                    <p className="text-2xl font-bold text-blue-600">AED {(totalNet / 1000).toFixed(1)}K</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold">{completedCount}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Pay Runs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">{error}</div>
              ) : payRuns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No pay runs found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Date</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Employees</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Net</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payRuns.map((payRun) => (
                        <tr key={payRun.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payRun.pay_period_start).toLocaleDateString()} - {new Date(payRun.pay_period_end).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payRun.pay_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold">
                            {payRun.total_employees}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-blue-600">
                            AED {Number(payRun.total_net).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              payRun.status === 'COMPLETED' ? 'default' :
                              payRun.status === 'PROCESSING' ? 'secondary' :
                              'outline'
                            }>
                              {payRun.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canManage && payRun.status === 'DRAFT' && (
                                <Button size="sm" variant="ghost">
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
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