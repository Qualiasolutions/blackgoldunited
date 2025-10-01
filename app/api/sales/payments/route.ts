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

    let query = supabase
      .from('client_payments')
      .select(`
        id,
        payment_reference,
        client_id,
        invoice_id,
        amount,
        payment_date,
        payment_method,
        notes,
        status,
        created_at,
        updated_at,
        clients!client_payments_client_id_fkey(
          id,
          company_name,
          client_code
        ),
        invoices!client_payments_invoice_id_fkey(
          id,
          invoice_number
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status.toUpperCase())
    }

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    // Format data for frontend
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      paymentReference: item.payment_reference,
      clientId: item.client_id,
      clientName: item.clients?.company_name || 'Unknown Client',
      invoiceId: item.invoice_id,
      invoiceNumber: item.invoices?.invoice_number || '-',
      amount: parseFloat(item.amount || 0),
      paymentDate: item.payment_date,
      paymentMethod: item.payment_method,
      notes: item.notes,
      status: item.status,
      createdAt: item.created_at
    })) || []

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

    const { data, error } = await supabase
      .from('client_payments')
      .insert({
        payment_reference: body.paymentReference,
        client_id: body.clientId,
        invoice_id: body.invoiceId,
        amount: body.amount,
        payment_date: body.paymentDate,
        payment_method: body.paymentMethod,
        notes: body.notes,
        status: 'COMPLETED',
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
