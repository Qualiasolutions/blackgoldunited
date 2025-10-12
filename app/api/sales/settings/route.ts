import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/sales/settings - Get sales settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'sales', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales_settings')
      .select('invoice_prefix, invoice_number_start, tax_rate, default_payment_terms, auto_send_email')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch sales settings' }, { status: 500 })
    }

    // Return defaults if no settings exist yet
    if (!data) {
      return NextResponse.json({
        success: true,
        data: {
          invoicePrefix: 'INV',
          invoiceStartNumber: 1,
          defaultTaxRate: 0,
          defaultPaymentTerms: 30,
          autoSendEmail: false
        }
      })
    }

    // Map snake_case to camelCase for frontend
    const formattedData = {
      invoicePrefix: data.invoice_prefix || 'INV',
      invoiceStartNumber: data.invoice_number_start || 1,
      defaultTaxRate: Number(data.tax_rate) || 0,
      defaultPaymentTerms: data.default_payment_terms || 30,
      autoSendEmail: data.auto_send_email || false
    }

    return NextResponse.json({
      success: true,
      data: formattedData
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/sales/settings - Update sales settings
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'sales', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (body.invoicePrefix === undefined ||
        body.invoiceStartNumber === undefined ||
        body.defaultTaxRate === undefined ||
        body.defaultPaymentTerms === undefined ||
        body.autoSendEmail === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate data types and ranges
    if (typeof body.invoicePrefix !== 'string' || body.invoicePrefix.length === 0) {
      return NextResponse.json({ error: 'Invoice prefix must be a non-empty string' }, { status: 400 })
    }

    if (typeof body.invoiceStartNumber !== 'number' || body.invoiceStartNumber < 1) {
      return NextResponse.json({ error: 'Invoice start number must be a positive number' }, { status: 400 })
    }

    if (typeof body.defaultTaxRate !== 'number' || body.defaultTaxRate < 0 || body.defaultTaxRate > 100) {
      return NextResponse.json({ error: 'Tax rate must be between 0 and 100' }, { status: 400 })
    }

    if (typeof body.defaultPaymentTerms !== 'number' || body.defaultPaymentTerms < 0) {
      return NextResponse.json({ error: 'Payment terms must be a non-negative number' }, { status: 400 })
    }

    if (typeof body.autoSendEmail !== 'boolean') {
      return NextResponse.json({ error: 'Auto-send email must be a boolean' }, { status: 400 })
    }

    // Map camelCase to snake_case for database
    const { data, error } = await supabase
      .from('sales_settings')
      .upsert([{
        invoice_prefix: body.invoicePrefix,
        invoice_number_start: body.invoiceStartNumber,
        tax_rate: body.defaultTaxRate,
        default_payment_terms: body.defaultPaymentTerms,
        auto_send_email: body.autoSendEmail,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update sales settings' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Sales settings updated successfully',
      data: {
        invoicePrefix: data.invoice_prefix,
        invoiceStartNumber: data.invoice_number_start,
        defaultTaxRate: Number(data.tax_rate),
        defaultPaymentTerms: data.default_payment_terms,
        autoSendEmail: data.auto_send_email
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
