import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Designation validation schema
const designationSchema = z.object({
  title: z.string().min(1, 'Designation title is required').max(100),
  description: z.string().optional().or(z.literal('')),
  departmentId: z.string().uuid().optional().or(z.literal('')),
  levelOrder: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true)
})

// GET /api/hr/designations - List all designations with department and employee count
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - HR module access required
    const authResult = await authenticateAndAuthorize(request, 'organizational', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const search = searchParams.get('search') || ''
    const departmentId = searchParams.get('departmentId')
    const isActive = searchParams.get('isActive')

    // Base query with department and employee count
    let query = supabase
      .from('designations')
      .select(`
        id,
        title,
        description,
        departmentId,
        levelOrder,
        isActive,
        createdAt,
        updatedAt,
        department:departments(
          id,
          name
        ),
        employees!employees_designationId_fkey(count)
      `)
      .order('levelOrder', { ascending: false })
      .order('title', { ascending: true })

    // Apply filters
    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (departmentId) {
      query = query.eq('department_id', departmentId)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: designations, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch designations' }, { status: 500 })
    }

    // Transform to include employee count
    const transformedDesignations = designations?.map(designation => ({
      ...designation,
      employeeCount: designation.employees?.[0]?.count || 0,
      employees: undefined // Remove the employees array
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedDesignations
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hr/designations - Create new designation
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - HR write access required
    const authResult = await authenticateAndAuthorize(request, 'organizational', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can create designations
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can create designations'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = designationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Check for duplicate designation title within the same department
    let duplicateQuery = supabase
      .from('designations')
      .select('id')
      .eq('title', validatedData.title)

    if (validatedData.departmentId) {
      duplicateQuery = duplicateQuery.eq('department_id', validatedData.departmentId)
    } else {
      duplicateQuery = duplicateQuery.is('departmentId', null)
    }

    const { data: existingDesignation } = await duplicateQuery.single()

    if (existingDesignation) {
      return NextResponse.json({
        error: validatedData.departmentId ?
          'A designation with this title already exists in the selected department' :
          'A general designation with this title already exists'
      }, { status: 409 })
    }

    // Validate department exists if provided
    if (validatedData.departmentId) {
      const { data: department } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', validatedData.departmentId)
        .single()

      if (!department) {
        return NextResponse.json({
          error: 'Department not found'
        }, { status: 400 })
      }
    }

    // Prepare designation data for insertion
    const designationData = {
      title: validatedData.title,
      description: validatedData.description || null,
      departmentId: validatedData.departmentId || null,
      levelOrder: validatedData.levelOrder,
      isActive: validatedData.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Insert designation
    const { data: designation, error } = await supabase
      .from('designations')
      .insert([designationData])
      .select(`
        id,
        title,
        description,
        departmentId,
        levelOrder,
        isActive,
        createdAt,
        updatedAt,
        department:departments(
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'Designation title already exists in this department'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create designation' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'designation',
          entityId: designation.id,
          action: 'created',
          description: `Designation "${designation.title}" created`,
          userId: authResult.user.id,
          metadata: {
            designationTitle: designation.title,
            departmentName: designation.department ? (designation.department as any).name : 'General',
            levelOrder: designation.levelOrder
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: designation
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}