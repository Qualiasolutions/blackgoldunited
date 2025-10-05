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

    // Fetch credit notes without nested joins (Phase 6 best practice)
    let query = supabase
      .from('credit_notes')
      .select(`
        id,
        credit_note_number,
        client_id,
        invoice_id,
        issue_date,
        amount,
        reason,
        status,
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
      return NextResponse.json({ error: 'Failed to fetch refund receipts' }, { status: 500 })
    }

    // Fetch related data separately to avoid PostgREST nested join issues
    const clientIds = [...new Set(data?.map((item: any) => item.client_id).filter(Boolean))]
    const invoiceIds = [...new Set(data?.map((item: any) => item.invoice_id).filter(Boolean))]

    let clientsMap: Record<string, any> = {}
    let invoicesMap: Record<string, any> = {}

    // Fetch clients separately
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

    // Fetch invoices separately
    if (invoiceIds.length > 0) {
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('id, invoice_number')
        .in('id', invoiceIds)

      if (invoicesData) {
        invoicesMap = invoicesData.reduce((acc: any, invoice: any) => {
          acc[invoice.id] = invoice
          return acc
        }, {})
      }
    }

    // Format data for frontend with manual joins
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      receiptNumber: item.credit_note_number,
      clientId: item.client_id,
      clientName: clientsMap[item.client_id]?.company_name || 'Unknown Client',
      invoiceId: item.invoice_id,
      invoiceNumber: invoicesMap[item.invoice_id]?.invoice_number || '-',
      amount: parseFloat(item.amount || 0),
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
        amount: body.amount,
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