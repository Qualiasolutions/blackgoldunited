"use client"

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Eye, Edit, Trash, Plus, Mail, Phone, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/data-table/data-table'
import { Supplier } from '@/lib/types/bgu'
import { formatDate } from '@/lib/utils'

interface SupplierListProps {
  suppliers?: Supplier[]
}

const getStatusBadge = (status: Supplier['status']) => {
  const variants = {
    ACTIVE: 'success',
    INACTIVE: 'secondary',
    BLACKLISTED: 'destructive'
  } as const

  return (
    <Badge variant={variants[status]}>
      {status.toLowerCase()}
    </Badge>
  )
}

export function SupplierList({ suppliers = [] }: SupplierListProps) {
  // Mock data for demonstration
  const mockSuppliers: Supplier[] = [
    {
      id: '1',
      name: 'Industrial Equipment Co.',
      email: 'orders@industrial-eq.com',
      phone: '+1-555-1234',
      address: '456 Industrial Park, Detroit, MI 48201',
      contactPerson: 'Robert Miller',
      status: 'ACTIVE',
      paymentTerms: 'Net 30',
      createdAt: new Date('2024-01-10')
    },
    {
      id: '2',
      name: 'Steel Dynamics Inc',
      email: 'purchasing@steeldynamics.com',
      phone: '+1-555-5678',
      address: '789 Steel Mill Rd, Pittsburgh, PA 15201',
      contactPerson: 'Jennifer Davis',
      status: 'ACTIVE',
      paymentTerms: 'Net 15',
      createdAt: new Date('2024-01-15')
    },
    {
      id: '3',
      name: 'Global Tech Solutions',
      email: 'supply@globaltech.com',
      phone: '+1-555-9012',
      address: '321 Tech Valley, San Jose, CA 95101',
      contactPerson: 'Michael Chang',
      status: 'INACTIVE',
      paymentTerms: 'Net 45',
      createdAt: new Date('2023-12-20')
    },
    {
      id: '4',
      name: 'Unreliable Supplies Ltd',
      email: 'contact@unreliable.com',
      phone: '+1-555-0000',
      address: '999 Problem St, Nowhere, TX 00000',
      contactPerson: 'John Doe',
      status: 'BLACKLISTED',
      paymentTerms: 'COD',
      createdAt: new Date('2023-11-01')
    }
  ]

  const data = suppliers.length > 0 ? suppliers : mockSuppliers

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "name",
      header: "Supplier",
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex items-center space-x-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>{row.getValue("name")}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.contactPerson}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Contact Info",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{row.getValue("email")}</span>
          </div>
          {row.original.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{row.original.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <div className="text-sm max-w-xs truncate" title={row.getValue("address") as string}>
          {row.getValue("address")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "paymentTerms",
      header: "Payment Terms",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("paymentTerms")}</Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Added",
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.getValue("createdAt"))}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const supplier = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Supplier
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Building className="mr-2 h-4 w-4" />
                Create Purchase Order
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                {supplier.status === 'BLACKLISTED' ? 'Remove' : 'Blacklist'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-muted-foreground">
            Manage your supplier relationships and procurement sources.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Supplier Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-green-600"></div>
            <div>
              <p className="text-sm font-medium text-green-800">Active Suppliers</p>
              <p className="text-xs text-green-600">
                {data.filter(s => s.status === 'ACTIVE').length} suppliers
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-gray-600"></div>
            <div>
              <p className="text-sm font-medium text-gray-800">Inactive</p>
              <p className="text-xs text-gray-600">
                {data.filter(s => s.status === 'INACTIVE').length} suppliers
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-red-50 border-red-200">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-600"></div>
            <div>
              <p className="text-sm font-medium text-red-800">Blacklisted</p>
              <p className="text-xs text-red-600">
                {data.filter(s => s.status === 'BLACKLISTED').length} suppliers
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search suppliers..."
      />
    </div>
  )
}