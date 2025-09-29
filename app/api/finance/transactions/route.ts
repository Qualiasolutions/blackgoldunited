import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'finance', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const transactions: any[] = []

    // Get recent invoice payments (Credits)
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, paid_amount, status, created_at')
      .is('deleted_at', null)
      .in('status', ['PAID', 'PARTIAL'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (invoices) {
      invoices.forEach((inv: any) => {
        if (inv.paid_amount && Number(inv.paid_amount) > 0) {
          transactions.push({
            id: `TXN-INV-${inv.id.substring(0, 8)}`,
            description: `Payment from Invoice ${inv.invoice_number}`,
            amount: Number(inv.paid_amount),
            type: 'Credit',
            date: new Date(inv.created_at).toISOString().split('T')[0],
            module: 'sales',
            reference: inv.invoice_number
          })
        }
      })
    }

    // Get recent purchase orders (Debits)
    const { data: purchaseOrders } = await supabase
      .from('purchase_orders')
      .select('id, po_number, total_amount, status, created_at')
      .is('deleted_at', null)
      .in('status', ['CONFIRMED', 'DELIVERED', 'INVOICED'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (purchaseOrders) {
      purchaseOrders.forEach((po: any) => {
        transactions.push({
          id: `TXN-PO-${po.id.substring(0, 8)}`,
          description: `Purchase Order ${po.po_number}`,
          amount: -Number(po.total_amount || 0),
          type: 'Debit',
          date: new Date(po.created_at).toISOString().split('T')[0],
          module: 'purchase',
          reference: po.po_number
        })
      })
    }

    // Get payroll expenses (if we have pay_runs table)
    try {
      const { data: payRuns } = await supabase
        .from('pay_runs')
        .select('id, pay_run_name, total_net, pay_date, created_at')
        .in('status', ['APPROVED', 'PAID'])
        .order('created_at', { ascending: false })
        .limit(5)

      if (payRuns) {
        payRuns.forEach((pr: any) => {
          transactions.push({
            id: `TXN-PAY-${pr.id.substring(0, 8)}`,
            description: `Payroll - ${pr.pay_run_name}`,
            amount: -Number(pr.total_net || 0),
            type: 'Debit',
            date: pr.pay_date || new Date(pr.created_at).toISOString().split('T')[0],
            module: 'payroll',
            reference: pr.pay_run_name
          })
        })
      }
    } catch (err) {
      console.log('Payroll data not available:', err)
    }

    // Sort transactions by date (most recent first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json(transactions.slice(0, 15))

  } catch (error) {
    console.error('Finance transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial transactions' },
      { status: 500 }
    )
  }
}