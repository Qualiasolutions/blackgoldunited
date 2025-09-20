"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/data-table/data-table'
import { Eye, Edit, Trash2, Plus, Search, Loader2 } from 'lucide-react'

interface Client {
  id: string
  clientCode: string
  companyName: string
  contactPerson?: string
  email?: string
  phone?: string
  city?: string
  country?: string
  creditLimit?: number
  paymentTerms?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetchClients()

    // Set up real-time subscription for clients
    const supabase = createClient()
    const subscription = supabase
      .channel('clients_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          console.log('Client change detected:', payload)
          // Refetch clients when any change occurs
          fetchClients()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sales/clients')
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      const data = await response.json()
      setClients(data.clients || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Filter clients based on search and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.email || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && client.isActive) ||
                         (filterStatus === 'inactive' && !client.isActive)

    return matchesSearch && matchesStatus
  })

  const columns = [
    {
      header: 'Client Code',
      accessorKey: 'clientCode',
      cell: ({ row }: any) => (
        <div className="font-medium text-blue-600">{row.original.clientCode}</div>
      )
    },
    {
      header: 'Company',
      accessorKey: 'companyName',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.companyName}</div>
          <div className="text-sm text-gray-500">{row.original.contactPerson || 'No contact person'}</div>
        </div>
      )
    },
    {
      header: 'Contact',
      accessorKey: 'email',
      cell: ({ row }: any) => (
        <div>
          <div className="text-sm">{row.original.email || 'No email'}</div>
          <div className="text-sm text-gray-500">{row.original.phone || 'No phone'}</div>
        </div>
      )
    },
    {
      header: 'Location',
      accessorKey: 'city',
      cell: ({ row }: any) => (
        <div className="text-sm">
          {row.original.city && row.original.country ?
            `${row.original.city}, ${row.original.country}` :
            'No location set'
          }
        </div>
      )
    },
    {
      header: 'Credit Limit',
      accessorKey: 'creditLimit',
      cell: ({ row }: any) => (
        <div className="text-right">
          <div className="font-medium">
            {row.original.creditLimit ? `€${Number(row.original.creditLimit).toLocaleString()}` : 'Not set'}
          </div>
          <div className="text-sm text-gray-500">
            {row.original.paymentTerms ? `${row.original.paymentTerms} days` : 'No terms'}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }: any) => {
        const client = row.original

        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('View client:', client.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('Edit client:', client.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('Delete client:', client.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading clients...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
        <p>Error loading clients: {error}</p>
        <Button onClick={fetchClients} className="mt-2">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your client relationships and contacts</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
              Live data
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.filter(c => c.isActive).length}</div>
            <div className="text-sm text-gray-500 mt-1">
              {clients.length > 0 ? ((clients.filter(c => c.isActive).length / clients.length) * 100).toFixed(1) : 0}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Credit Limits Set</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.creditLimit && c.creditLimit > 0).length}
            </div>
            <div className="text-sm text-blue-600 mt-1">
              Clients with limits
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Credit Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{clients.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Available credit
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clients by name, contact, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All ({clients.length})
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                size="sm"
              >
                Active ({clients.filter(c => c.isActive).length})
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
                size="sm"
              >
                Inactive ({clients.filter(c => !c.isActive).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>Client Directory ({filteredClients.length} clients)</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredClients}
            searchKey="companyName"
          />
        </CardContent>
      </Card>
    </div>
  )
}