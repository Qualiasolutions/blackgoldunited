'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DollarSign, Package, Users, ShoppingCart, FileText, Loader2 } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'invoice' | 'client' | 'product' | 'purchase_order' | 'stock_movement'
  action: 'created' | 'updated' | 'deleted' | 'status_changed'
  title: string
  description: string
  user?: string
  timestamp: string
  data?: any
}

export function RealtimeActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const addActivity = (activity: ActivityItem) => {
    setActivities(prev => [activity, ...prev].slice(0, 20)) // Keep only last 20 activities
  }

  useEffect(() => {
    setLoading(false) // No initial API call needed for real-time feed

    const supabase = createClient()

    // Invoice activities
    const invoiceSubscription = supabase
      .channel('invoice_activity')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invoices' },
        (payload) => {
          addActivity({
            id: `invoice-created-${payload.new.id}`,
            type: 'invoice',
            action: 'created',
            title: 'New Invoice Created',
            description: `Invoice ${payload.new.invoiceNumber} for $${(Number(payload.new.totalAmount) ?? 0).toLocaleString()}`,
            timestamp: new Date().toISOString(),
            data: payload.new
          })
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'invoices' },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            addActivity({
              id: `invoice-status-${payload.new.id}-${Date.now()}`,
              type: 'invoice',
              action: 'status_changed',
              title: 'Invoice Status Updated',
              description: `Invoice ${payload.new.invoiceNumber} status changed to ${payload.new.status}`,
              timestamp: new Date().toISOString(),
              data: payload.new
            })
          }
        }
      )
      .subscribe()

    // Client activities
    const clientSubscription = supabase
      .channel('client_activity')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'clients' },
        (payload) => {
          addActivity({
            id: `client-created-${payload.new.id}`,
            type: 'client',
            action: 'created',
            title: 'New Client Added',
            description: `${payload.new.companyName} added to client database`,
            timestamp: new Date().toISOString(),
            data: payload.new
          })
        }
      )
      .subscribe()

    // Product activities
    const productSubscription = supabase
      .channel('product_activity')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          addActivity({
            id: `product-created-${payload.new.id}`,
            type: 'product',
            action: 'created',
            title: 'New Product Added',
            description: `${payload.new.name} added to inventory`,
            timestamp: new Date().toISOString(),
            data: payload.new
          })
        }
      )
      .subscribe()

    // Stock movement activities
    const stockSubscription = supabase
      .channel('stock_activity')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stocks' },
        (payload) => {
          const oldQty = Number(payload.old.quantity) || 0
          const newQty = Number(payload.new.quantity) || 0
          const diff = newQty - oldQty

          if (diff !== 0) {
            addActivity({
              id: `stock-movement-${payload.new.id}-${Date.now()}`,
              type: 'stock_movement',
              action: 'updated',
              title: 'Stock Level Changed',
              description: `Stock ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)} units`,
              timestamp: new Date().toISOString(),
              data: { ...payload.new, change: diff }
            })
          }
        }
      )
      .subscribe()

    // Purchase Order activities
    const purchaseOrderSubscription = supabase
      .channel('purchase_order_activity')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'purchase_orders' },
        (payload) => {
          addActivity({
            id: `po-created-${payload.new.id}`,
            type: 'purchase_order',
            action: 'created',
            title: 'Purchase Order Created',
            description: `PO ${payload.new.poNumber} for $${(Number(payload.new.totalAmount) ?? 0).toLocaleString()}`,
            timestamp: new Date().toISOString(),
            data: payload.new
          })
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(invoiceSubscription)
      supabase.removeChannel(clientSubscription)
      supabase.removeChannel(productSubscription)
      supabase.removeChannel(stockSubscription)
      supabase.removeChannel(purchaseOrderSubscription)
    }
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'client':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'product':
        return <Package className="h-4 w-4 text-purple-600" />
      case 'purchase_order':
        return <ShoppingCart className="h-4 w-4 text-orange-600" />
      case 'stock_movement':
        return <FileText className="h-4 w-4 text-gray-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'bg-green-100 text-green-800'
      case 'client':
        return 'bg-blue-100 text-blue-800'
      case 'product':
        return 'bg-purple-100 text-purple-800'
      case 'purchase_order':
        return 'bg-orange-100 text-orange-800'
      case 'stock_movement':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Real-time Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading activity feed...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Real-time Activity</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">
                Activity will appear here as it happens in real-time
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-100">
                    {getActivityIcon(activity.type)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <Badge variant="secondary" className={`text-xs ${getActivityColor(activity.type)}`}>
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleTimeString()} •
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                    {activity.user && (
                      <p className="text-xs text-gray-500">
                        by {activity.user}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Real-time status */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            Listening for real-time updates
          </div>
        </div>
      </CardContent>
    </Card>
  )
}