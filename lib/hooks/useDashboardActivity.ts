import { useState, useEffect } from 'react'

export interface Transaction {
  id: string
  type: 'invoice_payment' | 'purchase_order' | 'expense' | 'refund'
  title: string
  description: string
  amount: number
  module: string
  created_at: string
  status: 'completed' | 'pending' | 'failed'
}

export interface SystemActivity {
  id: string
  action: string
  description: string
  user: string
  module: string
  created_at: string
  type: 'success' | 'warning' | 'info' | 'error'
}

export interface DashboardActivityData {
  recentTransactions: Transaction[]
  systemActivity: SystemActivity[]
}

export function useDashboardActivity() {
  const [data, setData] = useState<DashboardActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/activity')

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard activity')
      }

      const activityData: DashboardActivityData = await response.json()
      setData(activityData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard activity')
    } finally {
      setLoading(false)
    }
  }

  const refreshActivity = () => {
    fetchActivity()
  }

  useEffect(() => {
    fetchActivity()
  }, [])

  return {
    data,
    loading,
    error,
    refreshActivity
  }
}