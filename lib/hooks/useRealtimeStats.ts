'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  totalRevenue: {
    value: number
    change: { value: number; isPositive: boolean }
  }
  activeClients: {
    value: number
    change: { value: number; isPositive: boolean }
  }
  productsInStock: {
    value: number
    change: { value: number; isPositive: boolean }
  }
  pendingOrders: {
    value: number
    change: { value: number; isPositive: boolean }
  }
  recentActivity: Array<{
    id: string
    type: string
    description: string
    amount: number
    timestamp: string
  }>
  topProducts: Array<{
    id: string
    name: string
    code: string
    price: number
    totalStock: number
    warehouses: number
  }>
}

export function useRealtimeStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchStats()

    // Set up Supabase real-time subscriptions
    const supabase = createClient()

    // Subscribe to invoice changes
    const invoiceSubscription = supabase
      .channel('invoices_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          fetchStats() // Refetch stats when invoices change
        }
      )
      .subscribe()

    // Subscribe to client changes
    const clientSubscription = supabase
      .channel('clients_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    // Subscribe to product changes
    const productSubscription = supabase
      .channel('products_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    // Subscribe to stock changes
    const stockSubscription = supabase
      .channel('stocks_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stocks' },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    // Subscribe to purchase order changes
    const purchaseOrderSubscription = supabase
      .channel('purchase_orders_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_orders' },
        () => {
          fetchStats()
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

  return { stats, loading, error, refetch: fetchStats }
}