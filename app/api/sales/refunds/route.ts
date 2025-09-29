import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/sales/refunds - Get refund receipts (using credit_notes)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'sales', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('credit_notes')
      .select(`
        id,
        credit_note_number,
        client_id,
        invoice_id,
        issue_date,
        total_amount,
        reason,
        status,
        created_at,
        updated_at,
        clients!credit_notes_client_id_fkey(
          id,
          company_name,
          client_code
        ),
        invoices!credit_notes_invoice_id_fkey(
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
      return NextResponse.json({ error: 'Failed to fetch refund receipts' }, { status: 500 })
    }

    // Format data for frontend
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      receiptNumber: item.credit_note_number,
      clientId: item.client_id,
      clientName: item.clients?.company_name || 'Unknown Client',
      invoiceId: item.invoice_id,
      invoiceNumber: item.invoices?.invoice_number || '-',
      amount: parseFloat(item.total_amount || 0),
      date: item.issue_date,
      reason: item.reason,
      status: item.status || 'DRAFT',
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

// POST /api/sales/refunds - Create refund receipt
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'sales', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Generate credit note number
    const { data: lastCreditNote } = await supabase
      .from('credit_notes')
      .select('credit_note_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let creditNoteNumber = 'CN-2025-0001'
    if (lastCreditNote?.credit_note_number) {
      const lastNumber = parseInt(lastCreditNote.credit_note_number.split('-')[2])
      creditNoteNumber = `CN-2025-${String(lastNumber + 1).padStart(4, '0')}`
    }

    const { data, error } = await supabase
      .from('credit_notes')
      .insert({
        credit_note_number: creditNoteNumber,
        client_id: body.clientId,
        invoice_id: body.invoiceId,
        issue_date: body.issueDate || new Date().toISOString().split('T')[0],
        total_amount: body.amount,
        reason: body.reason,
        status: body.status || 'DRAFT',
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create refund receipt' }, { status: 500 })
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