import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/purchases/debit-notes - Get debit notes
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
      .from('debit_notes')
      .select(`
        id,
        debit_note_number,
        supplier_id,
        purchase_invoice_id,
        issue_date,
        total_amount,
        reason,
        status,
        created_at,
        updated_at,
        suppliers!debit_notes_supplier_id_fkey(
          id,
          supplier_name,
          supplier_code
        ),
        purchase_invoices!debit_notes_purchase_invoice_id_fkey(
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
      return NextResponse.json({ error: 'Failed to fetch debit notes' }, { status: 500 })
    }

    // Format data for frontend
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      debitNoteNumber: item.debit_note_number,
      supplierId: item.supplier_id,
      supplierName: item.suppliers?.supplier_name || 'Unknown Supplier',
      invoiceId: item.purchase_invoice_id,
      invoiceNumber: item.purchase_invoices?.invoice_number || '-',
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

// POST /api/purchases/debit-notes - Create debit note
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Generate debit note number
    const { data: lastDebitNote } = await supabase
      .from('debit_notes')
      .select('debit_note_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let debitNoteNumber = 'DN-2025-0001'
    if (lastDebitNote?.debit_note_number) {
      const lastNumber = parseInt(lastDebitNote.debit_note_number.split('-')[2])
      debitNoteNumber = `DN-2025-${String(lastNumber + 1).padStart(4, '0')}`
    }

    const { data, error } = await supabase
      .from('debit_notes')
      .insert({
        debit_note_number: debitNoteNumber,
        supplier_id: body.supplierId,
        purchase_invoice_id: body.invoiceId,
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
      return NextResponse.json({ error: 'Failed to create debit note' }, { status: 500 })
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