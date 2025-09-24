import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Category validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
})

// GET /api/inventory/categories - List categories with hierarchy
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
    const parentId = searchParams.get('parentId')
    const isActive = searchParams.get('isActive')

    // Build query
    let queryBuilder = supabase
      .from('categories')
      .select(`
        *,
        parent:categories!parentId(id, name),
        children:categories!parentId(id, name, isActive)
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    if (parentId === 'null' || parentId === '') {
      queryBuilder = queryBuilder.is('parentId', null)
    } else if (parentId) {
      queryBuilder = queryBuilder.eq('parentId', parentId)
    }

    if (isActive !== null) {
      queryBuilder = queryBuilder.eq('isActive', isActive === 'true')
    }

    const { data: categories, error } = await queryBuilder.order('name')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: categories
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inventory/categories - Create new category
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
    const validationResult = categorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const categoryData = validationResult.data

    // Check for duplicate category name at the same level
    let duplicateQuery = supabase
      .from('categories')
      .select('id')
      .eq('name', categoryData.name)

    if (categoryData.parentId) {
      duplicateQuery = duplicateQuery.eq('parentId', categoryData.parentId)
    } else {
      duplicateQuery = duplicateQuery.is('parentId', null)
    }

    const { data: existingCategory } = await duplicateQuery.single()

    if (existingCategory) {
      return NextResponse.json({
        error: 'Category name already exists at this level'
      }, { status: 409 })
    }

    // Validate parent category exists if provided
    if (categoryData.parentId) {
      const { data: parentCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('id', categoryData.parentId)
        .eq('isActive', true)
        .single()

      if (!parentCategory) {
        return NextResponse.json({
          error: 'Invalid parent category ID'
        }, { status: 400 })
      }
    }

    // Create the category
    const { data: category, error } = await supabase
      .from('categories')
      .insert([{
        ...categoryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select(`
        *,
        parent:categories!parentId(id, name)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: category
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}