import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/sales/recurring - Get recurring invoices
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'sales', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') // active, paused, completed, cancelled
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('recurring_invoices')
      .select(`
        id,
        template_name,
        client_id,
        frequency,
        start_date,
        end_date,
        next_generation_date,
        template_data,
        is_active,
        created_at,
        updated_at,
        clients!recurring_invoices_client_id_fkey(
          id,
          company_name,
          client_code
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'paused') {
      query = query.eq('is_active', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch recurring invoices' }, { status: 500 })
    }

    // Format data for frontend
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      templateName: item.template_name,
      clientId: item.client_id,
      clientName: item.clients?.company_name || 'Unknown Client',
      amount: item.template_data?.total_amount || 0,
      frequency: item.frequency,
      startDate: item.start_date,
      endDate: item.end_date,
      nextBilling: item.next_generation_date,
      status: item.is_active ? 'Active' : 'Paused',
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

// POST /api/sales/recurring - Create recurring invoice
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'sales', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('recurring_invoices')
      .insert({
        template_name: body.templateName,
        client_id: body.clientId,
        frequency: body.frequency,
        start_date: body.startDate,
        end_date: body.endDate,
        next_generation_date: body.nextGenerationDate,
        template_data: body.templateData,
        is_active: body.isActive !== undefined ? body.isActive : true,
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create recurring invoice' }, { status: 500 })
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