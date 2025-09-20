"use client"

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Eye, Edit, Trash, Plus } from 'lucide-react'
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
import { Invoice } from '@/lib/types/bgu'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceListProps {
  invoices?: Invoice[]
}

const getStatusBadge = (status: Invoice['status']) => {
  const variants = {
    DRAFT: 'secondary',
    SENT: 'info',
    PAID: 'success',
    OVERDUE: 'destructive',
    CANCELLED: 'outline'
  } as const

  return (
    <Badge variant={variants[status]}>
      {status.toLowerCase()}
    </Badge>
  )
}

export function InvoiceList({ invoices = [] }: InvoiceListProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([])

  // Mock data for demonstration
  const mockInvoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-001',
      clientId: '1',
      clientName: 'ABC Corporation',
      amount: 15000,
      status: 'PAID',
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      items: []
    },
    {
      id: '2',
      invoiceNumber: 'INV-002',
      clientId: '2',
      clientName: 'XYZ Industries',
      amount: 25000,
      status: 'SENT',
      issueDate: new Date('2024-01-20'),
      dueDate: new Date('2024-02-20'),
      items: []
    },
    {
      id: '3',
      invoiceNumber: 'INV-003',
      clientId: '3',
      clientName: 'Tech Solutions Ltd',
      amount: 8500,
      status: 'OVERDUE',
      issueDate: new Date('2024-01-10'),
      dueDate: new Date('2024-02-10'),
      items: []
    }
  ]

  const data = invoices.length > 0 ? invoices : mockInvoices

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("invoiceNumber")}</div>
      ),
    },
    {
      accessorKey: "clientName",
      header: "Client",
      cell: ({ row }) => (
        <div>{row.getValue("clientName")}</div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-medium">
          {formatCurrency(row.getValue("amount"))}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "issueDate",
      header: "Issue Date",
      cell: ({ row }) => (
        <div>{formatDate(row.getValue("issueDate"))}</div>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <div>{formatDate(row.getValue("dueDate"))}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original

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
                View
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
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
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            Manage all your invoices in one place.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>
      
      <DataTable
        columns={columns}
        data={data}
        searchKey="clientName"
        searchPlaceholder="Search by client name..."
      />
    </div>
  )
}