import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  // Authenticate and authorize (dashboard activity is a reporting function)
  const authResult = await authenticateAndAuthorize(request, 'reports', 'GET')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const supabase = await createClient()

    // Get real transactions from database
    const recentTransactions: any[] = []
    const systemActivity: any[] = []

    // Get recent invoices
    try {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoiceNumber, totalAmount, paidAmount, status, createdAt')
        .eq('deletedAt', null)
        .order('createdAt', { ascending: false })
        .limit(3)

      if (invoices) {
        invoices.forEach((invoice: any) => {
          if (invoice.paidAmount > 0) {
            recentTransactions.push({
              id: invoice.id,
              type: 'invoice_payment',
              title: `Invoice #${invoice.invoiceNumber || 'N/A'}`,
              description: `Payment received - Invoice #${invoice.invoiceNumber || 'N/A'}`,
              amount: Number(invoice.paidAmount),
              module: 'sales',
              created_at: invoice.createdAt,
              status: 'completed'
            })
          }
        })
      }
    } catch (err) {
      console.log('Error fetching invoices:', err)
    }

    // Get recent purchase orders
    try {
      const { data: purchaseOrders } = await supabase
        .from('purchase_orders')
        .select('id, orderNumber, totalAmount, status, createdAt')
        .eq('deletedAt', null)
        .order('createdAt', { ascending: false })
        .limit(2)

      if (purchaseOrders) {
        purchaseOrders.forEach((po: any) => {
          recentTransactions.push({
            id: po.id,
            type: 'purchase_order',
            title: `Purchase Order #${po.orderNumber || 'N/A'}`,
            description: `Purchase order - ${po.orderNumber || 'N/A'}`,
            amount: -Number(po.totalAmount || 0),
            module: 'purchase',
            created_at: po.createdAt,
            status: po.status?.toLowerCase() || 'pending'
          })
        })
      }
    } catch (err) {
      console.log('Error fetching purchase orders:', err)
    }

    // Get recent clients for system activity
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, companyName, createdAt')
        .eq('deletedAt', null)
        .order('createdAt', { ascending: false })
        .limit(2)

      if (clients) {
        clients.forEach((client: any) => {
          systemActivity.push({
            id: client.id,
            action: 'Client registered',
            description: `${client.companyName} successfully added to client database`,
            user: 'System',
            module: 'clients',
            created_at: client.createdAt,
            type: 'success'
          })
        })
      }
    } catch (err) {
      console.log('Error fetching clients:', err)
    }

    // Sort transactions by date (most recent first)
    recentTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    systemActivity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // If no real data, return empty arrays instead of mock data
    return NextResponse.json({
      recentTransactions: recentTransactions.slice(0, 5),
      systemActivity: systemActivity.slice(0, 5)
    })

  } catch (error) {
    console.error('Error fetching dashboard activity:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}