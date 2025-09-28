'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DashboardStats {
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

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch real data from the dashboard stats API
      const response = await fetch('/api/dashboard/stats')

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`)
      }

      const data = await response.json()

      // Transform the API response to match our interface
      const stats: DashboardStats = {
        totalRevenue: data.totalRevenue || { value: 0, change: { value: 0, isPositive: true } },
        activeClients: data.activeClients || { value: 0, change: { value: 0, isPositive: true } },
        productsInStock: data.productsInStock || { value: 0, change: { value: 0, isPositive: true } },
        pendingOrders: data.pendingOrders || { value: 0, change: { value: 0, isPositive: true } },
        recentActivity: data.recentActivity || [],
        topProducts: data.topProducts || []
      }

      setStats(stats)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  // Auto-refresh stats every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchDashboardStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchDashboardStats])

  const refreshStats = useCallback(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  return {
    stats,
    loading,
    error,
    refreshStats,
    lastUpdated: new Date().toISOString()
  }
}