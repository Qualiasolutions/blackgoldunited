'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DashboardStats {
  totalRevenue: number
  totalInvoices: number
  totalClients: number
  pendingInvoices: number
  recentActivity: Array<{
    id: string
    type: 'invoice' | 'payment' | 'client'
    description: string
    amount?: number
    timestamp: string
  }>
  salesChart: Array<{
    date: string
    amount: number
  }>
  paymentChart: Array<{
    date: string
    amount: number
    status: 'successful' | 'pending' | 'failed'
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

      // For now, return mock data since we haven't set up the full database schema
      // In a real implementation, this would query actual Supabase tables
      const mockStats: DashboardStats = {
        totalRevenue: 85420.50,
        totalInvoices: 142,
        totalClients: 38,
        pendingInvoices: 12,
        recentActivity: [
          {
            id: '1',
            type: 'invoice',
            description: 'Invoice #INV-2025-001 created for Acme Corp',
            amount: 5500.00,
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'payment',
            description: 'Payment received from TechStart Ltd',
            amount: 2800.00,
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '3',
            type: 'client',
            description: 'New client Digital Solutions Inc added',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ],
        salesChart: [
          { date: '2025-09-14', amount: 12500 },
          { date: '2025-09-15', amount: 18700 },
          { date: '2025-09-16', amount: 15300 },
          { date: '2025-09-17', amount: 22100 },
          { date: '2025-09-18', amount: 19400 },
          { date: '2025-09-19', amount: 24800 },
          { date: '2025-09-20', amount: 16900 }
        ],
        paymentChart: [
          { date: '2025-09-20', amount: 8500, status: 'successful' },
          { date: '2025-09-19', amount: 12300, status: 'successful' },
          { date: '2025-09-18', amount: 6700, status: 'pending' },
          { date: '2025-09-17', amount: 9400, status: 'successful' }
        ]
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setStats(mockStats)
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

  const refreshStats = useCallback(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  return {
    stats,
    loading,
    error,
    refreshStats
  }
}