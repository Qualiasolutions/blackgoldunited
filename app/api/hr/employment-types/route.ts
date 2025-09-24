import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Employment type validation schema
const employmentTypeSchema = z.object({
  typeName: z.string().min(1, 'Employment type name is required').max(50),
  description: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true)
})

// GET /api/hr/employment-types - List all employment types
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - HR module access required
    const authResult = await authenticateAndAuthorize(request, 'hr', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    // Base query with employee count
    let query = supabase
      .from('employment_types')
      .select(`
        id,
        typeName,
        description,
        isActive,
        createdAt,
        employees!employees_employmentTypeId_fkey(count)
      `)
      .order('typeName', { ascending: true })

    // Apply filters
    if (search.trim()) {
      query = query.or(`typeName.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (isActive !== null) {
      query = query.eq('isActive', isActive === 'true')
    }

    const { data: employmentTypes, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch employment types' }, { status: 500 })
    }

    // Transform to include employee count
    const transformedTypes = employmentTypes?.map(type => ({
      ...type,
      employeeCount: type.employees?.[0]?.count || 0,
      employees: undefined // Remove the employees array
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedTypes
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hr/employment-types - Create new employment type
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - HR write access required
    const authResult = await authenticateAndAuthorize(request, 'hr', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can create employment types
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can create employment types'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = employmentTypeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Check for duplicate employment type name
    const { data: existingType } = await supabase
      .from('employment_types')
      .select('id')
      .eq('typeName', validatedData.typeName)
      .single()

    if (existingType) {
      return NextResponse.json({
        error: 'An employment type with this name already exists'
      }, { status: 409 })
    }

    // Prepare employment type data for insertion
    const typeData = {
      typeName: validatedData.typeName,
      description: validatedData.description || null,
      isActive: validatedData.isActive,
      createdAt: new Date().toISOString()
    }

    // Insert employment type
    const { data: employmentType, error } = await supabase
      .from('employment_types')
      .insert([typeData])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'Employment type name already exists'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create employment type' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'employment_type',
          entityId: employmentType.id,
          action: 'created',
          description: `Employment type "${employmentType.typeName}" created`,
          userId: authResult.user.id,
          metadata: {
            typeName: employmentType.typeName,
            description: employmentType.description
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: employmentType
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}