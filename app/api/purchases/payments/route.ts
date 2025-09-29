import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/purchases/payments - Get supplier payments
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('supplier_payments')
      .select(`
        id,
        payment_reference,
        supplier_id,
        purchase_invoice_id,
        amount,
        payment_date,
        payment_method,
        bank_account_id,
        notes,
        status,
        created_at,
        updated_at,
        suppliers!supplier_payments_supplier_id_fkey(
          id,
          supplier_name,
          supplier_code
        ),
        purchase_invoices!supplier_payments_purchase_invoice_id_fkey(
          id,
          invoice_number
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status.toUpperCase())
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch supplier payments' }, { status: 500 })
    }

    // Format data for frontend
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      paymentReference: item.payment_reference,
      supplierId: item.supplier_id,
      supplierName: item.suppliers?.supplier_name || 'Unknown Supplier',
      invoiceId: item.purchase_invoice_id,
      invoiceNumber: item.purchase_invoices?.invoice_number || '-',
      amount: parseFloat(item.amount || 0),
      paymentDate: item.payment_date,
      paymentMethod: item.payment_method,
      status: item.status || 'PENDING',
      notes: item.notes,
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

// POST /api/purchases/payments - Create supplier payment
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Generate payment reference
    const { data: lastPayment } = await supabase
      .from('supplier_payments')
      .select('payment_reference')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let paymentReference = 'SP-2025-0001'
    if (lastPayment?.payment_reference) {
      const lastNumber = parseInt(lastPayment.payment_reference.split('-')[2])
      paymentReference = `SP-2025-${String(lastNumber + 1).padStart(4, '0')}`
    }

    const { data, error } = await supabase
      .from('supplier_payments')
      .insert({
        payment_reference: paymentReference,
        supplier_id: body.supplierId,
        purchase_invoice_id: body.invoiceId,
        amount: body.amount,
        payment_date: body.paymentDate || new Date().toISOString().split('T')[0],
        payment_method: body.paymentMethod,
        bank_account_id: body.bankAccountId,
        notes: body.notes,
        status: body.status || 'PENDING',
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create supplier payment' }, { status: 500 })
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