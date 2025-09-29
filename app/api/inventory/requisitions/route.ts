import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/inventory/requisitions - Get purchase requisitions
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('purchase_requisitions')
      .select(`
        id,
        requisition_number,
        requested_by,
        department_id,
        priority,
        required_date,
        status,
        notes,
        created_at,
        updated_at,
        employees!purchase_requisitions_requested_by_fkey(
          id,
          first_name,
          last_name
        ),
        departments!purchase_requisitions_department_id_fkey(
          id,
          name
        ),
        requisition_items(
          id,
          product_id,
          quantity_requested,
          quantity_approved,
          products(
            id,
            product_name,
            sku
          )
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
      return NextResponse.json({ error: 'Failed to fetch requisitions' }, { status: 500 })
    }

    // Format data for frontend
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      requisitionNumber: item.requisition_number,
      requestedBy: `${item.employees?.first_name || ''} ${item.employees?.last_name || ''}`.trim(),
      department: item.departments?.name || '-',
      priority: item.priority || 'MEDIUM',
      requiredDate: item.required_date,
      status: item.status || 'PENDING',
      itemsCount: item.requisition_items?.length || 0,
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

// POST /api/inventory/requisitions - Create requisition
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Generate requisition number
    const { data: lastReq } = await supabase
      .from('purchase_requisitions')
      .select('requisition_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let requisitionNumber = 'REQ-2025-0001'
    if (lastReq?.requisition_number) {
      const lastNumber = parseInt(lastReq.requisition_number.split('-')[2])
      requisitionNumber = `REQ-2025-${String(lastNumber + 1).padStart(4, '0')}`
    }

    const { data, error } = await supabase
      .from('purchase_requisitions')
      .insert({
        requisition_number: requisitionNumber,
        requested_by: body.requestedBy || authResult.user.id,
        department_id: body.departmentId,
        priority: body.priority || 'MEDIUM',
        required_date: body.requiredDate,
        status: body.status || 'PENDING',
        notes: body.notes,
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create requisition' }, { status: 500 })
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