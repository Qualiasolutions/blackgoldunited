"use client"

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Eye, Edit, Trash, Plus, Mail, Phone } from 'lucide-react'
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
import { Client } from '@/lib/types/bgu'
import { formatDate } from '@/lib/utils'

interface ClientListProps {
  clients?: Client[]
}

const getStatusBadge = (status: Client['status']) => {
  const variants = {
    ACTIVE: 'success',
    INACTIVE: 'secondary',
    PENDING: 'warning'
  } as const

  return (
    <Badge variant={variants[status]}>
      {status.toLowerCase()}
    </Badge>
  )
}

export function ClientList({ clients = [] }: ClientListProps) {
  // Mock data for demonstration
  const mockClients: Client[] = [
    {
      id: '1',
      name: 'ABC Corporation',
      email: 'contact@abc-corp.com',
      phone: '+1-555-0123',
      address: '123 Business Ave, NY 10001',
      contactPerson: 'John Smith',
      status: 'ACTIVE',
      creditLimit: 50000,
      paymentTerms: 'Net 30',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: '2',
      name: 'XYZ Industries',
      email: 'info@xyz-industries.com',
      phone: '+1-555-0456',
      address: '456 Industrial Blvd, CA 90210',
      contactPerson: 'Sarah Johnson',
      status: 'ACTIVE',
      creditLimit: 75000,
      paymentTerms: 'Net 15',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-25')
    },
    {
      id: '3',
      name: 'Tech Solutions Ltd',
      email: 'hello@techsolutions.com',
      phone: '+1-555-0789',
      address: '789 Tech Park, TX 75001',
      contactPerson: 'Mike Wilson',
      status: 'PENDING',
      creditLimit: 25000,
      paymentTerms: 'Net 30',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01')
    }
  ]

  const data = clients.length > 0 ? clients : mockClients

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "Company Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.contactPerson}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Contact",
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "creditLimit",
      header: "Credit Limit",
      cell: ({ row }) => {
        const amount = row.getValue("creditLimit") as number
        return amount ? `$${amount.toLocaleString()}` : 'N/A'
      },
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
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.getValue("createdAt"))}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const client = row.original

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
                Edit Client
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                Delete
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
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Manage your client relationships and contact information.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>
      
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search clients..."
      />
    </div>
  )
}