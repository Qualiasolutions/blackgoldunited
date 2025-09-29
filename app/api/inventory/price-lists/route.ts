import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/inventory/price-lists - Get price lists
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const isActive = searchParams.get('active')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('price_lists')
      .select(`
        id,
        name,
        description,
        currency,
        valid_from,
        valid_to,
        is_default,
        is_active,
        created_at,
        updated_at,
        price_list_items(
          id,
          product_id,
          price,
          min_quantity,
          products(
            id,
            product_name,
            sku
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch price lists' }, { status: 500 })
    }

    // Format data for frontend
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      currency: item.currency || 'AED',
      validFrom: item.valid_from,
      validTo: item.valid_to,
      isDefault: item.is_default,
      isActive: item.is_active,
      itemsCount: item.price_list_items?.length || 0,
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

// POST /api/inventory/price-lists - Create price list
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('price_lists')
      .insert({
        name: body.name,
        description: body.description,
        currency: body.currency || 'AED',
        valid_from: body.validFrom,
        valid_to: body.validTo,
        is_default: body.isDefault || false,
        is_active: body.isActive !== undefined ? body.isActive : true,
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create price list' }, { status: 500 })
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