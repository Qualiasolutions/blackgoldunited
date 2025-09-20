'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, X, AlertTriangle, DollarSign, Package, Users } from 'lucide-react'

interface Notification {
  id: string
  type: 'invoice' | 'stock' | 'client' | 'purchase_order'
  title: string
  message: string
  data?: any
  timestamp: string
  read: boolean
}

export function RealtimeNotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Set up real-time subscriptions for various events
    const invoiceSubscription = supabase
      .channel('invoice_notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invoices' },
        (payload) => {
          const newNotification: Notification = {
            id: `invoice-${payload.new.id}-${Date.now()}`,
            type: 'invoice',
            title: 'New Invoice Created',
            message: `Invoice ${payload.new.invoiceNumber} has been created for $${Number(payload.new.totalAmount).toLocaleString()}`,
            data: payload.new,
            timestamp: new Date().toISOString(),
            read: false
          }
          setNotifications(prev => [newNotification, ...prev].slice(0, 10)) // Keep only last 10
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'invoices' },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            const newNotification: Notification = {
              id: `invoice-status-${payload.new.id}-${Date.now()}`,
              type: 'invoice',
              title: 'Invoice Status Changed',
              message: `Invoice ${payload.new.invoiceNumber} status changed to ${payload.new.status}`,
              data: payload.new,
              timestamp: new Date().toISOString(),
              read: false
            }
            setNotifications(prev => [newNotification, ...prev].slice(0, 10))
          }
        }
      )
      .subscribe()

    // Stock level alerts
    const stockSubscription = supabase
      .channel('stock_notifications')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stocks' },
        (payload) => {
          const oldQty = Number(payload.old.quantity) || 0
          const newQty = Number(payload.new.quantity) || 0

          // Check if stock went below reorder level
          if (oldQty > 5 && newQty <= 5) { // Simplified reorder level check
            const newNotification: Notification = {
              id: `stock-low-${payload.new.id}-${Date.now()}`,
              type: 'stock',
              title: 'Low Stock Alert',
              message: `Stock quantity for product is now ${newQty} units - below reorder level`,
              data: payload.new,
              timestamp: new Date().toISOString(),
              read: false
            }
            setNotifications(prev => [newNotification, ...prev].slice(0, 10))
          }

          // Check if stock went to zero
          if (newQty === 0 && oldQty > 0) {
            const newNotification: Notification = {
              id: `stock-out-${payload.new.id}-${Date.now()}`,
              type: 'stock',
              title: 'Out of Stock Alert',
              message: `Product is now out of stock - immediate attention required`,
              data: payload.new,
              timestamp: new Date().toISOString(),
              read: false
            }
            setNotifications(prev => [newNotification, ...prev].slice(0, 10))
          }
        }
      )
      .subscribe()

    // New client registrations
    const clientSubscription = supabase
      .channel('client_notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'clients' },
        (payload) => {
          const newNotification: Notification = {
            id: `client-${payload.new.id}-${Date.now()}`,
            type: 'client',
            title: 'New Client Registered',
            message: `${payload.new.companyName} has been added to the client database`,
            data: payload.new,
            timestamp: new Date().toISOString(),
            read: false
          }
          setNotifications(prev => [newNotification, ...prev].slice(0, 10))
        }
      )
      .subscribe()

    // Purchase order status changes
    const purchaseOrderSubscription = supabase
      .channel('purchase_order_notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'purchase_orders' },
        (payload) => {
          const newNotification: Notification = {
            id: `po-${payload.new.id}-${Date.now()}`,
            type: 'purchase_order',
            title: 'New Purchase Order',
            message: `Purchase Order ${payload.new.poNumber} created for $${Number(payload.new.totalAmount).toLocaleString()}`,
            data: payload.new,
            timestamp: new Date().toISOString(),
            read: false
          }
          setNotifications(prev => [newNotification, ...prev].slice(0, 10))
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(invoiceSubscription)
      supabase.removeChannel(stockSubscription)
      supabase.removeChannel(clientSubscription)
      supabase.removeChannel(purchaseOrderSubscription)
    }
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'stock':
        return <Package className="h-4 w-4 text-red-600" />
      case 'client':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'purchase_order':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Real-time Notifications</h3>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-xs"
                >
                  Clear all
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No recent notifications</p>
                <p className="text-xs text-gray-400 mt-1">
                  You'll see real-time updates here
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Real-time status indicator */}
          <div className="p-2 border-t bg-gray-50">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Live notifications enabled
            </div>
          </div>
        </div>
      )}
    </div>
  )
}