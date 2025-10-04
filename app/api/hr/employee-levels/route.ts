import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Employee level validation schema
const employeeLevelSchema = z.object({
  levelName: z.string().min(1, 'Employee level name is required').max(50),
  levelOrder: z.number().min(0).max(100),
  description: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true)
})

// GET /api/hr/employee-levels - List all employee levels
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - HR module access required
    const authResult = await authenticateAndAuthorize(request, 'employees', 'GET')
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
      .from('employee_levels')
      .select(`
        id,
        levelName,
        levelOrder,
        description,
        isActive,
        createdAt,
        employees!employees_employeeLevelId_fkey(count)
      `)
      .order('levelOrder', { ascending: false })
      .order('levelName', { ascending: true })

    // Apply filters
    if (search.trim()) {
      query = query.or(`levelName.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: employeeLevels, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch employee levels' }, { status: 500 })
    }

    // Transform to include employee count
    const transformedLevels = employeeLevels?.map(level => ({
      ...level,
      employeeCount: level.employees?.[0]?.count || 0,
      employees: undefined // Remove the employees array
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedLevels
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hr/employee-levels - Create new employee level
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - HR write access required
    const authResult = await authenticateAndAuthorize(request, 'employees', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can create employee levels
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can create employee levels'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = employeeLevelSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Check for duplicate employee level name
    const { data: existingLevel } = await supabase
      .from('employee_levels')
      .select('id')
      .eq('levelName', validatedData.levelName)
      .single()

    if (existingLevel) {
      return NextResponse.json({
        error: 'An employee level with this name already exists'
      }, { status: 409 })
    }

    // Check for duplicate level order
    const { data: existingOrder } = await supabase
      .from('employee_levels')
      .select('id')
      .eq('levelOrder', validatedData.levelOrder)
      .single()

    if (existingOrder) {
      return NextResponse.json({
        error: 'An employee level with this order already exists'
      }, { status: 409 })
    }

    // Prepare employee level data for insertion
    const levelData = {
      levelName: validatedData.levelName,
      levelOrder: validatedData.levelOrder,
      description: validatedData.description || null,
      isActive: validatedData.isActive,
      createdAt: new Date().toISOString()
    }

    // Insert employee level
    const { data: employeeLevel, error } = await supabase
      .from('employee_levels')
      .insert([levelData])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'Employee level name or order already exists'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create employee level' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'employee_level',
          entityId: employeeLevel.id,
          action: 'created',
          description: `Employee level "${employeeLevel.levelName}" created`,
          userId: authResult.user.id,
          metadata: {
            levelName: employeeLevel.levelName,
            levelOrder: employeeLevel.levelOrder,
            description: employeeLevel.description
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: employeeLevel
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}