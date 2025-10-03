import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/purchase/suppliers - Get all suppliers
export async function GET(request: NextRequest) {
  const authResult = await authenticateAndAuthorize(request, 'purchase', 'GET')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const supabase = await createClient()

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('deletedAt', null)
      .order('createdAt', { ascending: false })

    // Add search filter if provided
    if (search) {
      query = query.or(`companyName.ilike.%${search}%,contactPerson.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Add active filter
    if (isActive !== null) {
      query = query.eq('isActive', isActive === 'true')
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    const { data: suppliers, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
    }

    return NextResponse.json({
      suppliers,
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

// POST /api/purchase/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  const authResult = await authenticateAndAuthorize(request, 'purchase', 'POST')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const supabase = await createClient()

    const body = await request.json()

    // Validate required fields
    const { companyName } = body
    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Generate supplier code if not provided
    if (!body.supplierCode) {
      const { data: lastSupplier } = await supabase
        .from('suppliers')
        .select('supplierCode')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      const lastNumber = lastSupplier?.supplierCode ?
        parseInt(lastSupplier.supplierCode.replace('SUP-', '')) || 0 : 0
      body.supplierCode = `SUP-${String(lastNumber + 1).padStart(6, '0')}`
    }

    // Insert new supplier
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Supplier code already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
    }

    return NextResponse.json({ supplier }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}