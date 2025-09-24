import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Send } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Create Purchase Order | BlackGoldUnited ERP',
  description: 'Create a new purchase order',
}

export default function CreatePurchaseOrderPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/sales/purchase-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Purchase Order</h1>
            <p className="text-muted-foreground">
              Create a new purchase order for procurement
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for the purchase order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="po-number">PO Number</Label>
                  <Input
                    id="po-number"
                    placeholder="Auto-generated"
                    disabled
                    defaultValue="PO-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="po-date">PO Date</Label>
                  <Input
                    id="po-date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier1">ABC Supplies Ltd.</SelectItem>
                    <SelectItem value="supplier2">Global Materials Inc.</SelectItem>
                    <SelectItem value="supplier3">Premium Equipment Co.</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery-date">Expected Delivery Date</Label>
                <Input id="delivery-date" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or special instructions..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>
                Add items to your purchase order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Line Item Row */}
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="space-y-2">
                    <Label htmlFor="item-1">Item/Service</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="item1">Office Supplies</SelectItem>
                        <SelectItem value="item2">Computer Equipment</SelectItem>
                        <SelectItem value="item3">Raw Materials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity-1">Quantity</Label>
                    <Input id="quantity-1" type="number" placeholder="1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit-price-1">Unit Price</Label>
                    <Input id="unit-price-1" type="number" placeholder="0.00" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-1">Tax %</Label>
                    <Input id="tax-1" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Total</Label>
                    <Input value="$0.00" disabled />
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Add Line Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>$0.00</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button variant="outline" className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Send to Supplier
              </Button>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Status: Draft</p>
                <p>Created: {new Date().toLocaleDateString()}</p>
                <p>Last Modified: {new Date().toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}