'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SalesStats {
  totalRevenue: number
  revenueGrowth: number
  activeClients: number
  newClients: number
  pendingInvoices: number
  pendingAmount: number
  conversionRate: number
  conversionGrowth: number
  invoicesCount: number
  invoicesAmount: number
  rfqCount: number
  rfqAmount: number
  creditNotesCount: number
  creditNotesAmount: number
  refundsCount: number
  refundsAmount: number
  recurringCount: number
  recurringAmount: number
  paymentsCount: number
  paymentsAmount: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    amount: number
    timestamp: string
  }>
}

export function useSalesStats() {
  const [stats, setStats] = useState<SalesStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const supabase = createClient()

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Not authenticated')
      }

      // Initialize stats object
      const statsData: SalesStats = {
        totalRevenue: 0,
        revenueGrowth: 0,
        activeClients: 0,
        newClients: 0,
        pendingInvoices: 0,
        pendingAmount: 0,
        conversionRate: 0,
        conversionGrowth: 0,
        invoicesCount: 0,
        invoicesAmount: 0,
        rfqCount: 0,
        rfqAmount: 0,
        creditNotesCount: 0,
        creditNotesAmount: 0,
        refundsCount: 0,
        refundsAmount: 0,
        recurringCount: 0,
        recurringAmount: 0,
        paymentsCount: 0,
        paymentsAmount: 0,
        recentActivity: []
      }

      // Fetch invoices data
      try {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id, total_amount, paid_amount, status, created_at, invoice_number, client_id')
          .is('deleted_at', null)

        if (invoices) {
          statsData.invoicesCount = invoices.length
          statsData.invoicesAmount = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0)
          statsData.totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.paid_amount) || Number(inv.total_amount) || 0), 0)

          // Calculate pending invoices
          const pendingInvoices = invoices.filter(inv =>
            ['DRAFT', 'SENT', 'OVERDUE'].includes(inv.status)
          )
          statsData.pendingInvoices = pendingInvoices.length
          statsData.pendingAmount = pendingInvoices.reduce((sum, inv) =>
            sum + (Number(inv.total_amount) - Number(inv.paid_amount || 0)), 0
          )

          // Add to recent activity
          statsData.recentActivity.push(
            ...invoices.slice(0, 3).map((inv) => ({
              id: inv.id,
              type: 'invoice',
              description: `Invoice ${inv.invoice_number || 'N/A'} created`,
              amount: Number(inv.total_amount) || 0,
              timestamp: inv.created_at || new Date().toISOString()
            }))
          )
        }
      } catch (err) {
        console.warn('Error fetching invoices:', err)
      }

      // Fetch clients data
      try {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, company_name, is_active, created_at')
          .is('deleted_at', null)

        if (clients) {
          statsData.activeClients = clients.filter(c => c.is_active !== false).length

          // Calculate new clients this month
          const thisMonth = new Date()
          thisMonth.setDate(1)
          const newClientsThisMonth = clients.filter(c =>
            new Date(c.created_at) >= thisMonth
          )
          statsData.newClients = newClientsThisMonth.length
        }
      } catch (err) {
        console.warn('Error fetching clients:', err)
      }

      // Fetch quotations (RFQ) data
      try {
        const { data: quotations } = await supabase
          .from('quotations')
          .select('id, total_amount, status, created_at')
          .is('deleted_at', null)

        if (quotations) {
          statsData.rfqCount = quotations.length
          statsData.rfqAmount = quotations.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0)

          // Add to recent activity
          statsData.recentActivity.push(
            ...quotations.slice(0, 2).map((q) => ({
              id: q.id,
              type: 'rfq',
              description: `RFQ created`,
              amount: Number(q.total_amount) || 0,
              timestamp: q.created_at || new Date().toISOString()
            }))
          )
        }
      } catch (err) {
        console.warn('Error fetching quotations:', err)
      }

      // Fetch credit notes data
      try {
        const { data: creditNotes } = await supabase
          .from('credit_notes')
          .select('id, amount, status, created_at')
          .is('deleted_at', null)

        if (creditNotes) {
          statsData.creditNotesCount = creditNotes.length
          statsData.creditNotesAmount = creditNotes.reduce((sum, cn) => sum + (Number(cn.amount) || 0), 0)
        }
      } catch (err) {
        console.warn('Error fetching credit notes:', err)
      }

      // Fetch payments data
      try {
        const { data: payments } = await supabase
          .from('invoice_payments')
          .select('id, amount, payment_date, created_at')
          .is('deleted_at', null)

        if (payments) {
          statsData.paymentsCount = payments.length
          statsData.paymentsAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

          // Add to recent activity
          statsData.recentActivity.push(
            ...payments.slice(0, 2).map((p) => ({
              id: p.id,
              type: 'payment',
              description: `Payment received`,
              amount: Number(p.amount) || 0,
              timestamp: p.created_at || new Date().toISOString()
            }))
          )
        }
      } catch (err) {
        console.warn('Error fetching payments:', err)
      }

      // Calculate growth percentages based on real data
      try {
        // Get previous month's data for comparison
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        lastMonth.setDate(1)

        const thisMonth = new Date()
        thisMonth.setDate(1)

        const { data: lastMonthInvoices } = await supabase
          .from('invoices')
          .select('total_amount, paid_amount')
          .gte('created_at', lastMonth.toISOString())
          .lt('created_at', thisMonth.toISOString())
          .is('deleted_at', null)

        if (lastMonthInvoices && lastMonthInvoices.length > 0) {
          const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) =>
            sum + (Number(inv.paid_amount) || Number(inv.total_amount) || 0), 0
          )

          // Fetch current month's invoices for comparison
          const { data: currentMonthInvoices } = await supabase
            .from('invoices')
            .select('total_amount, paid_amount, created_at')
            .gte('created_at', thisMonth.toISOString())
            .is('deleted_at', null)

          const thisMonthRevenue = (currentMonthInvoices || []).reduce((sum, inv) =>
            sum + (Number(inv.paid_amount) || Number(inv.total_amount) || 0), 0
          )

          if (lastMonthRevenue > 0) {
            statsData.revenueGrowth = Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
          }
        }

        // Calculate conversion rate (converted quotes to invoices)
        const { data: allQuotations } = await supabase
          .from('quotations')
          .select('id, status')
          .is('deleted_at', null)

        if (allQuotations && allQuotations.length > 0) {
          const convertedQuotes = allQuotations.filter(q => q.status === 'CONVERTED').length
          statsData.conversionRate = Math.round((convertedQuotes / allQuotations.length) * 100)
        }

        // Calculate conversion growth (comparing to last month)
        const { data: lastMonthQuotations } = await supabase
          .from('quotations')
          .select('id, status')
          .gte('created_at', lastMonth.toISOString())
          .lt('created_at', thisMonth.toISOString())
          .is('deleted_at', null)

        if (lastMonthQuotations && lastMonthQuotations.length > 0) {
          const lastMonthConversionRate = Math.round(
            (lastMonthQuotations.filter(q => q.status === 'CONVERTED').length / lastMonthQuotations.length) * 100
          )
          statsData.conversionGrowth = statsData.conversionRate - lastMonthConversionRate
        }
      } catch (err) {
        console.warn('Error calculating growth metrics:', err)
        // Set default values if calculation fails
        statsData.revenueGrowth = 0
        statsData.conversionRate = 0
        statsData.conversionGrowth = 0
      }

      // Sort recent activity by timestamp
      statsData.recentActivity.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      statsData.recentActivity = statsData.recentActivity.slice(0, 5)

      setStats(statsData)
      setError(null)
    } catch (err) {
      console.error('Error fetching sales stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchStats()

    // Set up Supabase real-time subscriptions for sales-related tables
    const supabase = createClient()

    // Subscribe to invoice changes
    const invoiceSubscription = supabase
      .channel('sales_invoices_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          fetchStats() // Refetch stats when invoices change
        }
      )
      .subscribe()

    // Subscribe to quotation changes
    const quotationSubscription = supabase
      .channel('sales_quotations_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'quotations' },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    // Subscribe to payment changes
    const paymentSubscription = supabase
      .channel('sales_payments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'invoice_payments' },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    // Subscribe to client changes
    const clientSubscription = supabase
      .channel('sales_clients_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    // Subscribe to credit note changes
    const creditNoteSubscription = supabase
      .channel('sales_credit_notes_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'credit_notes' },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(invoiceSubscription)
      supabase.removeChannel(quotationSubscription)
      supabase.removeChannel(paymentSubscription)
      supabase.removeChannel(clientSubscription)
      supabase.removeChannel(creditNoteSubscription)
    }
  }, [])

  return { stats, loading, error, refetch: fetchStats }
}