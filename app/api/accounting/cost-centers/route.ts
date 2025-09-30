import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/accounting/cost-centers - Get cost centers
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'accounting', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('query')
    const isActive = searchParams.get('is_active')

    let dbQuery = supabase
      .from('cost_centers')
      .select('*')
      .order('created_at', { ascending: false })

    if (query) {
      dbQuery = dbQuery.or(`code.ilike.%${query}%,name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    if (isActive !== null) {
      dbQuery = dbQuery.eq('is_active', isActive === 'true')
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch cost centers' }, { status: 500 })
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

// POST /api/accounting/cost-centers - Create cost center
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'accounting', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    const { code, name, description, parent_id } = body

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('cost_centers')
      .insert([{
        code,
        name,
        description,
        parent_id: parent_id || null,
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create cost center' }, { status: 500 })
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

// PUT /api/accounting/cost-centers - Update cost center
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
      return NextResponse.json({ error: 'Cost center ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('cost_centers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update cost center' }, { status: 500 })
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

// DELETE /api/accounting/cost-centers - Delete cost center
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
      return NextResponse.json({ error: 'Cost center ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('cost_centers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete cost center' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Cost center deleted successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}