'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/layout/main-layout'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Calendar, RefreshCw, Play, Pause, Filter, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function RecurringInvoicesPage() {
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()
  const [recurringInvoices, setRecurringInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterFrequency, setFilterFrequency] = useState<string>('')

  useEffect(() => {
    fetchRecurringInvoices()
  }, [])

  const fetchRecurringInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sales/recurring')
      if (response.ok) {
        const result = await response.json()
        setRecurringInvoices(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching recurring invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const filteredInvoices = recurringInvoices.filter(inv => {
    const matchesSearch = inv.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || inv.status === filterStatus
    const matchesFrequency = !filterFrequency || inv.frequency === filterFrequency
    return matchesSearch && matchesStatus && matchesFrequency
  })

  const activeCount = recurringInvoices.filter(inv => inv.status === 'Active').length
  const pausedCount = recurringInvoices.filter(inv => inv.status === 'Paused').length
  const monthlyRevenue = recurringInvoices
    .filter(inv => inv.status === 'Active' && inv.frequency === 'MONTHLY')
    .reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <MainLayout user={{ name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role }}>
      <div className="bg-gradient-to-br from-white via-orange-50 to-white min-h-full">
        <div className="py-8 px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Recurring Invoices</h1>
                <p className="text-gray-600 mt-2">Manage automated recurring billing and subscriptions</p>
              </div>
              {hasFullAccess('sales') && (
                <Link href="/sales/recurring/create">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Recurring Invoice
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Templates</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                  )}
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">${monthlyRevenue.toLocaleString()}</p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Templates</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{recurringInvoices.length}</p>
                      <p className="text-xs text-gray-500">{activeCount} active</p>
                    </>
                  )}
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Play className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paused</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{pausedCount}</p>
                  )}
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Pause className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Search and Filter Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-orange-600" />
                <Input
                  placeholder="Search recurring invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-orange-600" />
                <select
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6 bg-white border-2 border-orange-100">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-orange-600" />
                <select
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:border-orange-400"
                  value={filterFrequency}
                  onChange={(e) => setFilterFrequency(e.target.value)}
                >
                  <option value="">All Frequencies</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
            </EnhancedCard>
          </div>

          {/* Recurring Invoices Table */}
          <EnhancedCard className="bg-white border-2 border-orange-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recurring Invoice Templates</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Template Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Frequency</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Next Billing</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                          <p className="text-gray-500 mt-2">Loading recurring invoices...</p>
                        </td>
                      </tr>
                    ) : filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-gray-100 hover:bg-orange-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {invoice.status === 'Active' ? (
                                <RefreshCw className="h-4 w-4 text-orange-600 mr-2" />
                              ) : (
                                <Pause className="h-4 w-4 text-gray-600 mr-2" />
                              )}
                              {invoice.templateName}
                            </div>
                          </td>
                          <td className="py-3 px-4">{invoice.clientName}</td>
                          <td className="py-3 px-4 font-medium">${invoice.amount.toLocaleString()}</td>
                          <td className="py-3 px-4">{invoice.frequency}</td>
                          <td className="py-3 px-4">{invoice.nextBilling || '-'}</td>
                          <td className="py-3 px-4">
                            <Badge className={invoice.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">Edit</Button>
                              <Button variant="outline" size="sm">
                                {invoice.status === 'Active' ? 'Pause' : 'Resume'}
                              </Button>
                              <Button variant="outline" size="sm">View</Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center">
                          <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No recurring invoices found</p>
                          <p className="text-gray-400 mt-2">
                            {searchTerm || filterStatus || filterFrequency
                              ? 'Try adjusting your filters'
                              : 'Set up your first recurring invoice to automate billing'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </EnhancedCard>
        </div>
      </div>
    </MainLayout>
  )
}