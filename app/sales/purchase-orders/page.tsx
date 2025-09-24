import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ShoppingCart, FileText, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Purchase Orders | BlackGoldUnited ERP',
  description: 'Manage purchase orders and procurement',
}

export default function PurchaseOrdersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage purchase orders and procurement processes
          </p>
        </div>
        <Button asChild>
          <Link href="/sales/purchase-orders/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">
              Orders created this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">
              Active orders value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase Orders</CardTitle>
          <CardDescription>
            A list of your recent purchase orders with their current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No purchase orders yet</h3>
            <p className="mt-2 text-muted-foreground">
              Get started by creating your first purchase order.
            </p>
            <Button asChild className="mt-4">
              <Link href="/sales/purchase-orders/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Purchase Order
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}