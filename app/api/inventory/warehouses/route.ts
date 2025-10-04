import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Warehouse validation schema
const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  code: z.string().min(1, 'Warehouse code is required').max(10, 'Code must be 10 characters or less'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  capacity: z.number().positive().optional(),
  isActive: z.boolean().default(true),
})

// GET /api/inventory/warehouses - List warehouses
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const query = searchParams.get('query') || ''
    const location = searchParams.get('location')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build query
    let queryBuilder = supabase
      .from('warehouses')
      .select(`
        *,
        _count:product_stock(count)
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,code.ilike.%${query}%,location.ilike.%${query}%`)
    }

    if (location) {
      queryBuilder = queryBuilder.ilike('location', `%${location}%`)
    }

    if (isActive !== null) {
      queryBuilder = queryBuilder.eq('is_active', isActive === 'true')
    }

    // Get total count for pagination
    const countQuery = supabase
      .from('warehouses')
      .select('id', { count: 'exact', head: true })

    // Apply same filters to count
    if (query) {
      countQuery.or(`name.ilike.%${query}%,code.ilike.%${query}%,location.ilike.%${query}%`)
    }
    if (location) {
      countQuery.ilike('location', `%${location}%`)
    }
    if (isActive !== null) {
      countQuery.eq('is_active', isActive === 'true')
    }

    const { count: totalCount } = await countQuery

    // Execute main query
    const { data: warehouses, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('name')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 })
    }

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      success: true,
      data: warehouses || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: totalPages
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inventory/warehouses - Create new warehouse
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = warehouseSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const warehouseData = validationResult.data

    // Check for duplicate warehouse code
    const { data: existingWarehouse } = await supabase
      .from('warehouses')
      .select('id')
      .eq('code', warehouseData.code)
      .single()

    if (existingWarehouse) {
      return NextResponse.json({
        error: 'Warehouse code already exists'
      }, { status: 409 })
    }

    // Create the warehouse
    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .insert([{
        ...warehouseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: warehouse
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}