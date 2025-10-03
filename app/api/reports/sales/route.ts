import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Cache sales reports for 10 minutes (600 seconds)
// Reports involve heavy computation and data aggregation
export const revalidate = 600

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'reports', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get all invoices with client information
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, paid_amount, status, issue_date, due_date, client_id, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 })
    }

    // Get clients
    const { data: clients } = await supabase
      .from('clients')
      .select('id, company_name, is_active')
      .is('deleted_at', null)

    const invoicesList = invoices || []
    const clientsList = clients || []

    // Calculate report metrics
    const totalSales = invoicesList.reduce((sum: number, inv: any) =>
      sum + (Number(inv.total_amount) || 0), 0)

    const totalPaid = invoicesList.reduce((sum: number, inv: any) =>
      sum + (Number(inv.paid_amount) || 0), 0)

    const totalOutstanding = totalSales - totalPaid

    const invoicesByStatus = {
      DRAFT: invoicesList.filter((inv: any) => inv.status === 'DRAFT').length,
      SENT: invoicesList.filter((inv: any) => inv.status === 'SENT').length,
      PAID: invoicesList.filter((inv: any) => inv.status === 'PAID').length,
      OVERDUE: invoicesList.filter((inv: any) => inv.status === 'OVERDUE').length,
      CANCELLED: invoicesList.filter((inv: any) => inv.status === 'CANCELLED').length
    }

    // Top clients by revenue
    const clientRevenue = new Map<string, { name: string, amount: number, invoices: number }>()

    invoicesList.forEach((inv: any) => {
      const client = clientsList.find((c: any) => c.id === inv.client_id)
      if (client) {
        const existing = clientRevenue.get(client.id) || { name: client.company_name, amount: 0, invoices: 0 }
        existing.amount += Number(inv.paid_amount) || 0
        existing.invoices += 1
        clientRevenue.set(client.id, existing)
      }
    })

    const topClients = Array.from(clientRevenue.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    // Monthly sales trend (last 12 months)
    const monthlySales = new Map<string, number>()
    const last12Months = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      last12Months.push(monthKey)
      monthlySales.set(monthKey, 0)
    }

    invoicesList.forEach((inv: any) => {
      const invDate = new Date(inv.created_at)
      const monthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`
      if (monthlySales.has(monthKey)) {
        monthlySales.set(monthKey, (monthlySales.get(monthKey) || 0) + (Number(inv.paid_amount) || 0))
      }
    })

    const salesTrend = last12Months.map(month => ({
      month,
      sales: monthlySales.get(month) || 0
    }))

    const salesReport = {
      summary: {
        totalSales: Math.round(totalSales),
        totalPaid: Math.round(totalPaid),
        totalOutstanding: Math.round(totalOutstanding),
        invoiceCount: invoicesList.length,
        avgInvoiceValue: invoicesList.length > 0 ? Math.round(totalSales / invoicesList.length) : 0
      },
      invoicesByStatus,
      topClients,
      salesTrend
    }

    return NextResponse.json(salesReport)

  } catch (error) {
    console.error('Sales report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate sales report' },
      { status: 500 }
    )
  }
}