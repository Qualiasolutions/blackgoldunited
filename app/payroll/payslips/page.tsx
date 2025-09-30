'use client'

import { useEffect, useState } from 'react'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Download, Eye, FileText, ArrowLeft, Loader2, Calendar, DollarSign, Lock } from 'lucide-react'
import Link from 'next/link'

interface Payslip {
  id: string
  employee_id: string
  pay_run_id: string
  pay_period_start: string
  pay_period_end: string
  gross_salary: number
  total_deductions: number
  net_salary: number
  status: 'DRAFT' | 'SENT' | 'VIEWED'
  created_at: string
}

export default function PayslipsPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const canManage = hasFullAccess('payroll')
  const canRead = hasModuleAccess('payroll')

  useEffect(() => {
    if (canRead) {
      fetchPayslips()
    }
  }, [canRead])

  const fetchPayslips = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (searchTerm) params.set('query', searchTerm)

      const response = await fetch(`/api/payroll/pay-slips?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payslips')
      }

      if (result.success && result.data) {
        setPayslips(result.data)
      }
    } catch (error) {
      console.error('Error fetching payslips:', error)
      setError(error instanceof Error ? error.message : 'Failed to load payslips')
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

  const totalGross = payslips.reduce((sum, ps) => sum + Number(ps.gross_salary), 0)
  const totalNet = payslips.reduce((sum, ps) => sum + Number(ps.net_salary), 0)
  const sentCount = payslips.filter(ps => ps.status === 'SENT').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Payslips</h1>
            </div>
            <div className="flex items-center space-x-4">
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
                    <p className="text-sm font-medium text-gray-600">Total Payslips</p>
                    <p className="text-2xl font-bold">{payslips.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sent</p>
                    <p className="text-2xl font-bold text-green-600">{sentCount}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Net</p>
                    <p className="text-2xl font-bold text-purple-600">AED {(totalNet / 1000).toFixed(1)}K</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Search payslips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:col-span-2"
                />
                <Button onClick={fetchPayslips}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Payslips</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">{error}</div>
              ) : payslips.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No payslips found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Period</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payslips.map((payslip) => (
                        <tr key={payslip.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payslip.pay_period_start).toLocaleDateString()} - {new Date(payslip.pay_period_end).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                            AED {Number(payslip.gross_salary).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                            AED {Number(payslip.total_deductions).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                            AED {Number(payslip.net_salary).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              payslip.status === 'SENT' ? 'default' :
                              payslip.status === 'VIEWED' ? 'secondary' :
                              'outline'
                            }>
                              {payslip.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Download className="h-4 w-4" />
                              </Button>
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