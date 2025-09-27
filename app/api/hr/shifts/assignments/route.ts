import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Employee shift assignment schema
const employeeShiftSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  shiftId: z.string().uuid('Invalid shift ID'),
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
  effectiveTo: z.string().optional().or(z.literal(''))
})

// GET /api/hr/shifts/assignments - List all employee shift assignments
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - HR module access required
    const authResult = await authenticateAndAuthorize(request, 'attendance', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const employeeId = searchParams.get('employeeId')
    const shiftId = searchParams.get('shiftId')
    const isActive = searchParams.get('isActive')
    const departmentId = searchParams.get('departmentId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Base query with employee and shift details
    let query = supabase
      .from('employee_shifts')
      .select(`
        id,
        employeeId,
        shiftId,
        effectiveFrom,
        effectiveTo,
        createdAt,
        employee:employees!employee_shifts_employeeId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber,
          department:departments(id, name),
          designation:designations(id, title)
        ),
        shift:shifts!employee_shifts_shiftId_fkey(
          id,
          shiftName,
          startTime,
          endTime,
          breakDuration,
          isFlexible
        ),
        createdBy:users!employee_shifts_createdBy_fkey(
          firstName,
          lastName
        )
      `, { count: 'exact' })
      .order('effectiveFrom', { ascending: false })
      .order('createdAt', { ascending: false })

    // Apply filters
    if (employeeId) {
      query = query.eq('employeeId', employeeId)
    }

    if (shiftId) {
      query = query.eq('shiftId', shiftId)
    }

    if (isActive === 'true') {
      query = query.or(`effectiveTo.is.null,effectiveTo.gte.${new Date().toISOString().split('T')[0]}`)
    } else if (isActive === 'false') {
      query = query.not('effectiveTo', 'is', null)
        .lt('effectiveTo', new Date().toISOString().split('T')[0])
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: assignments, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch shift assignments' }, { status: 500 })
    }

    // Filter by department if specified (client-side filtering)
    let filteredAssignments = assignments || []
    if (departmentId) {
      filteredAssignments = filteredAssignments.filter((assignment: any) =>
        (assignment.employee as any)?.department ? (assignment.employee as any).department.id === departmentId : false
      )
    }

    // Enrich assignments with status
    const enrichedAssignments = filteredAssignments.map(assignment => {
      const today = new Date().toISOString().split('T')[0]
      const effectiveFrom = assignment.effectiveFrom
      const effectiveTo = assignment.effectiveTo

      let status = 'active'
      if (effectiveFrom > today) {
        status = 'future'
      } else if (effectiveTo && effectiveTo < today) {
        status = 'expired'
      }

      return {
        ...assignment,
        status,
        isCurrentlyActive: status === 'active'
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedAssignments,
      pagination: {
        limit,
        offset,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hr/shifts/assignments - Assign employee to shift
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - HR write access required
    const authResult = await authenticateAndAuthorize(request, 'attendance', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can assign shifts
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can assign shifts'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = employeeShiftSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Verify employee exists
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, firstName, lastName, employeeNumber')
      .eq('id', validatedData.employeeId)
      .is('deletedAt', null)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Verify shift exists
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('id, shiftName, startTime, endTime, isActive')
      .eq('id', validatedData.shiftId)
      .single()

    if (shiftError || !shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (!shift.isActive) {
      return NextResponse.json({ error: 'Cannot assign inactive shift' }, { status: 400 })
    }

    // Check for overlapping assignments
    const { data: overlappingAssignments } = await supabase
      .from('employee_shifts')
      .select('id, effectiveFrom, effectiveTo')
      .eq('employeeId', validatedData.employeeId)
      .lte('effectiveFrom', validatedData.effectiveTo || '9999-12-31')
      .or(`effectiveTo.is.null,effectiveTo.gte.${validatedData.effectiveFrom}`)

    if (overlappingAssignments && overlappingAssignments.length > 0) {
      return NextResponse.json({
        error: 'Employee already has a shift assignment for this date range'
      }, { status: 409 })
    }

    // Prepare assignment data for insertion
    const assignmentData = {
      employeeId: validatedData.employeeId,
      shiftId: validatedData.shiftId,
      effectiveFrom: validatedData.effectiveFrom,
      effectiveTo: validatedData.effectiveTo || null,
      createdBy: authResult.user.id,
      createdAt: new Date().toISOString()
    }

    // Insert assignment
    const { data: assignment, error } = await supabase
      .from('employee_shifts')
      .insert([assignmentData])
      .select(`
        *,
        employee:employees!employee_shifts_employeeId_fkey(
          firstName,
          lastName,
          employeeNumber
        ),
        shift:shifts!employee_shifts_shiftId_fkey(
          shiftName,
          startTime,
          endTime
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'Duplicate shift assignment'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create shift assignment' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'shift_assignment',
          entityId: validatedData.employeeId,
          action: 'assigned',
          description: `${employee.firstName} ${employee.lastName} assigned to shift "${shift.shiftName}"`,
          userId: authResult.user.id,
          metadata: {
            employeeNumber: employee.employeeNumber,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            shiftName: shift.shiftName,
            effectiveFrom: validatedData.effectiveFrom,
            effectiveTo: validatedData.effectiveTo || null,
            assignmentId: assignment.id
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: assignment,
      message: `${employee.firstName} ${employee.lastName} assigned to shift "${shift.shiftName}" successfully`
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}