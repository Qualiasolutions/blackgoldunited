import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/sales/payments - Get client payments
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'sales', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch payments from correct table: invoice_payments (not client_payments)
    let query = supabase
      .from('invoice_payments')
      .select(`
        id,
        payment_number,
        invoice_id,
        amount,
        payment_date,
        payment_method,
        reference_number,
        notes,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status.toUpperCase())
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    // Fetch invoice data separately to get client info (avoiding nested joins)
    const invoiceIds = [...new Set(data?.map((item: any) => item.invoice_id).filter(Boolean))]
    let invoicesMap: Record<string, any> = {}
    let clientsMap: Record<string, any> = {}

    if (invoiceIds.length > 0) {
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('id, invoice_number, client_id')
        .in('id', invoiceIds)

      if (invoicesData) {
        // Get unique client IDs from invoices
        const clientIds = [...new Set(invoicesData.map((inv: any) => inv.client_id).filter(Boolean))]

        // Fetch client data separately
        if (clientIds.length > 0) {
          const { data: clientsData } = await supabase
            .from('clients')
            .select('id, company_name, client_code')
            .in('id', clientIds)

          if (clientsData) {
            clientsMap = clientsData.reduce((acc: any, client: any) => {
              acc[client.id] = client
              return acc
            }, {})
          }
        }

        // Create invoices map with client data
        invoicesMap = invoicesData.reduce((acc: any, invoice: any) => {
          acc[invoice.id] = {
            ...invoice,
            client: clientsMap[invoice.client_id] || null
          }
          return acc
        }, {})
      }
    }

    // Format data for frontend
    const formattedData = data?.map((item: any) => {
      const invoice = invoicesMap[item.invoice_id]
      return {
        id: item.id,
        paymentReference: item.payment_number,
        clientId: invoice?.client_id || null,
        clientName: invoice?.client?.company_name || 'Unknown Client',
        invoiceId: item.invoice_id,
        invoiceNumber: invoice?.invoice_number || '-',
        amount: parseFloat(item.amount || 0),
        paymentDate: item.payment_date,
        paymentMethod: item.payment_method,
        notes: item.notes,
        status: 'COMPLETED', // invoice_payments table doesn't have status field
        createdAt: item.created_at
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/sales/payments - Create client payment
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'sales', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.clientId || !body.invoiceId || !body.amount || !body.paymentDate || !body.paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate payment number if not provided
    let paymentNumber = body.paymentReference
    if (!paymentNumber) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const { data: lastPayment } = await supabase
        .from('invoice_payments')
        .select('payment_number')
        .like('payment_number', `PAY-${today}%`)
        .order('payment_number', { ascending: false })
        .limit(1)
        .single()

      let nextNumber = 1
      if (lastPayment?.payment_number) {
        const lastNumStr = lastPayment.payment_number.split('-').pop()
        nextNumber = (parseInt(lastNumStr) || 0) + 1
      }
      paymentNumber = `PAY-${today}-${String(nextNumber).padStart(4, '0')}`
    }

    const { data, error } = await supabase
      .from('invoice_payments')
      .insert({
        payment_number: paymentNumber,
        invoice_id: body.invoiceId,
        amount: body.amount,
        payment_date: body.paymentDate,
        payment_method: body.paymentMethod,
        reference_number: body.referenceNumber,
        notes: body.notes,
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
    }

    // Update invoice paid amount
    if (body.invoiceId) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('paid_amount, total_amount')
        .eq('id', body.invoiceId)
        .single()

      if (invoice) {
        const newPaidAmount = (parseFloat(invoice.paid_amount || 0)) + parseFloat(body.amount)
        const totalAmount = parseFloat(invoice.total_amount || 0)

        await supabase
          .from('invoices')
          .update({
            paid_amount: newPaidAmount,
            payment_status: newPaidAmount >= totalAmount ? 'COMPLETED' : 'PARTIAL'
          })
          .eq('id', body.invoiceId)
      }
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
