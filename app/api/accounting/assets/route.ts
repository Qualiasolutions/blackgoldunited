import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/accounting/assets - Get fixed assets
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'accounting', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('query')
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    let dbQuery = supabase
      .from('fixed_assets')
      .select('*')
      .order('created_at', { ascending: false })

    if (query) {
      dbQuery = dbQuery.or(`asset_code.ilike.%${query}%,asset_name.ilike.%${query}%,category.ilike.%${query}%`)
    }

    if (status) {
      dbQuery = dbQuery.eq('status', status)
    }

    if (category) {
      dbQuery = dbQuery.eq('category', category)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/accounting/assets - Create asset
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'accounting', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    const {
      asset_code,
      asset_name,
      category,
      purchase_date,
      purchase_cost,
      depreciation_method,
      useful_life_years,
      salvage_value,
      location
    } = body

    if (!asset_code || !asset_name || !category || !purchase_date || !purchase_cost || !depreciation_method || !useful_life_years) {
      return NextResponse.json({
        error: 'Asset code, name, category, purchase date, cost, depreciation method, and useful life are required'
      }, { status: 400 })
    }

    const current_value = Number(purchase_cost) - Number(salvage_value || 0)

    const { data, error } = await supabase
      .from('fixed_assets')
      .insert([{
        asset_code,
        asset_name,
        category,
        purchase_date,
        purchase_cost: Number(purchase_cost),
        depreciation_method,
        useful_life_years: Number(useful_life_years),
        salvage_value: Number(salvage_value || 0),
        accumulated_depreciation: 0,
        current_value,
        location: location || null,
        status: 'ACTIVE',
        created_by: authResult.user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
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

// PUT /api/accounting/assets - Update asset
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'accounting', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })
    }

    // Recalculate current_value if purchase_cost or salvage_value changed
    if (updates.purchase_cost !== undefined || updates.salvage_value !== undefined) {
      const { data: currentAsset } = await supabase
        .from('fixed_assets')
        .select('purchase_cost, salvage_value, accumulated_depreciation')
        .eq('id', id)
        .single()

      if (currentAsset) {
        const purchase_cost = updates.purchase_cost !== undefined ? Number(updates.purchase_cost) : Number(currentAsset.purchase_cost)
        const salvage_value = updates.salvage_value !== undefined ? Number(updates.salvage_value) : Number(currentAsset.salvage_value)
        const accumulated_depreciation = Number(currentAsset.accumulated_depreciation)
        updates.current_value = purchase_cost - accumulated_depreciation
      }
    }

    const { data, error } = await supabase
      .from('fixed_assets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/accounting/assets - Delete asset
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'accounting', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('fixed_assets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}