import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/inventory/stock-adjustments - Get stock adjustments (stock_movements of type ADJUSTMENT)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const warehouseId = searchParams.get('warehouse')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('stock_movements')
      .select(`
        id,
        product_id,
        warehouse_id,
        movement_type,
        quantity,
        unit_cost,
        reference_number,
        reference_type,
        notes,
        created_at,
        updated_at,
        products!stock_movements_product_id_fkey(
          id,
          product_name,
          sku,
          unit
        ),
        warehouses!stock_movements_warehouse_id_fkey(
          id,
          name,
          code
        ),
        users!stock_movements_created_by_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('movement_type', 'ADJUSTMENT')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch stock adjustments' }, { status: 500 })
    }

    // Format data for frontend
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.products?.product_name || 'Unknown Product',
      sku: item.products?.sku,
      warehouseId: item.warehouse_id,
      warehouseName: item.warehouses?.name || 'Unknown Warehouse',
      quantity: parseFloat(item.quantity || 0),
      unitCost: parseFloat(item.unit_cost || 0),
      referenceNumber: item.reference_number,
      referenceType: item.reference_type,
      notes: item.notes,
      adjustedBy: `${item.users?.first_name || ''} ${item.users?.last_name || ''}`.trim(),
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

// POST /api/inventory/stock-adjustments - Create stock adjustment
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Generate reference number
    const { data: lastMovement } = await supabase
      .from('stock_movements')
      .select('reference_number')
      .eq('movement_type', 'ADJUSTMENT')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let referenceNumber = 'ADJ-2025-0001'
    if (lastMovement?.reference_number && lastMovement.reference_number.startsWith('ADJ-')) {
      const lastNumber = parseInt(lastMovement.reference_number.split('-')[2])
      referenceNumber = `ADJ-2025-${String(lastNumber + 1).padStart(4, '0')}`
    }

    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        product_id: body.productId,
        warehouse_id: body.warehouseId,
        movement_type: 'ADJUSTMENT',
        quantity: body.quantity,
        unit_cost: body.unitCost || 0,
        reference_number: referenceNumber,
        reference_type: 'STOCK_ADJUSTMENT',
        notes: body.notes,
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create stock adjustment' }, { status: 500 })
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