import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/sales/invoices - Get all invoices
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with client information
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients!inner(id, companyName, contactPerson, email),
        createdBy:users!inner(firstName, lastName, email)
      `)
      .eq('deletedAt', null)
      .order('createdAt', { ascending: false })

    // Add filters
    if (search) {
      query = query.or(`invoiceNumber.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (clientId) {
      query = query.eq('clientId', clientId)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    const { data: invoices, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    return NextResponse.json({
      invoices,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/sales/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const { clientId, dueDate, items } = body
    if (!clientId || !dueDate || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        error: 'Client ID, due date, and at least one item are required'
      }, { status: 400 })
    }

    // Generate invoice number if not provided
    if (!body.invoiceNumber) {
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoiceNumber')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      const lastNumber = lastInvoice?.invoiceNumber ?
        parseInt(lastInvoice.invoiceNumber.replace('INV-', '')) || 0 : 0
      body.invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, '0')}`
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = items.reduce((sum: number, item: any) => {
      const itemTotal = item.quantity * item.unitPrice
      const itemTax = itemTotal * (item.taxRate || 0) / 100
      return sum + itemTax
    }, 0)
    const totalAmount = subtotal + taxAmount - (body.discountAmount || 0)

    // Start transaction
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        ...body,
        subtotal,
        taxAmount,
        totalAmount,
        createdById: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError)
      if (invoiceError.code === '23505') {
        return NextResponse.json({ error: 'Invoice number already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Insert invoice items
    const invoiceItems = items.map((item: any) => ({
      invoiceId: invoice.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
      taxRate: item.taxRate || 0
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', invoice.id)
      console.error('Invoice items creation error:', itemsError)
      return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 })
    }

    // Fetch the complete invoice with items
    const { data: completeInvoice } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients!inner(id, companyName, contactPerson, email),
        items:invoice_items(*),
        createdBy:users!inner(firstName, lastName, email)
      `)
      .eq('id', invoice.id)
      .single()

    return NextResponse.json({ invoice: completeInvoice }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}