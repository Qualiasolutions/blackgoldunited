import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Shift validation schema
const shiftSchema = z.object({
  shiftName: z.string().min(1, 'Shift name is required').max(100),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'Invalid start time format (HH:MM:SS)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'Invalid end time format (HH:MM:SS)'),
  breakDuration: z.number().min(0).max(480).default(0), // minutes, max 8 hours
  isFlexible: z.boolean().default(false),
  gracePeriod: z.number().min(0).max(120).default(0), // minutes, max 2 hours
  isActive: z.boolean().default(true)
})

// Employee shift assignment schema
const employeeShiftSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  shiftId: z.string().uuid('Invalid shift ID'),
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
  effectiveTo: z.string().optional().or(z.literal(''))
})

// GET /api/hr/shifts - List all shifts with employee assignments
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
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search') || ''
    const includeEmployees = searchParams.get('includeEmployees') === 'true'

    // Base query
    let query = supabase
      .from('shifts')
      .select(`
        id,
        shiftName,
        startTime,
        endTime,
        breakDuration,
        isFlexible,
        gracePeriod,
        isActive,
        createdAt,
        updatedAt
      `)
      .order('shiftName', { ascending: true })

    // Apply filters
    if (search.trim()) {
      query = query.ilike('shiftName', `%${search}%`)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: shifts, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 })
    }

    let enrichedShifts = shifts || []

    // Include employee assignments if requested
    if (includeEmployees && shifts?.length > 0) {
      const shiftIds = shifts.map(shift => shift.id)

      const { data: employeeShifts } = await supabase
        .from('employee_shifts')
        .select(`
          id,
          shiftId,
          effectiveFrom,
          effectiveTo,
          employee:employees!employee_shifts_employeeId_fkey(
            id,
            firstName,
            lastName,
            employeeNumber,
            department:departments(name)
          )
        `)
        .in('shiftId', shiftIds)
        .order('effectiveFrom', { ascending: false })

      // Group employee assignments by shift
      enrichedShifts = shifts.map(shift => ({
        ...shift,
        employeeAssignments: employeeShifts?.filter(assignment =>
          assignment.shiftId === shift.id
        ) || [],
        activeEmployeeCount: employeeShifts?.filter(assignment =>
          assignment.shiftId === shift.id &&
          (!assignment.effectiveTo || new Date(assignment.effectiveTo) >= new Date())
        ).length || 0
      }))
    }

    return NextResponse.json({
      success: true,
      data: enrichedShifts
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hr/shifts - Create new shift
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - HR write access required
    const authResult = await authenticateAndAuthorize(request, 'attendance', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can create shifts
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can create shifts'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = shiftSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Check for duplicate shift name
    const { data: existingShift } = await supabase
      .from('shifts')
      .select('id')
      .eq('shiftName', validatedData.shiftName)
      .single()

    if (existingShift) {
      return NextResponse.json({
        error: 'A shift with this name already exists'
      }, { status: 409 })
    }

    // Validate time logic
    const startTime = validatedData.startTime
    const endTime = validatedData.endTime

    // Convert time strings to minutes for comparison
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)

    // Handle overnight shifts (end time before start time)
    const isOvernightShift = endMinutes < startMinutes

    if (!isOvernightShift && endMinutes <= startMinutes) {
      return NextResponse.json({
        error: 'End time must be after start time for same-day shifts'
      }, { status: 400 })
    }

    // Prepare shift data for insertion
    const shiftData = {
      shiftName: validatedData.shiftName,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      breakDuration: validatedData.breakDuration,
      isFlexible: validatedData.isFlexible,
      gracePeriod: validatedData.gracePeriod,
      isActive: validatedData.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Insert shift
    const { data: shift, error } = await supabase
      .from('shifts')
      .insert([shiftData])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'Shift name already exists'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 })
    }

    // Calculate shift duration for display
    const duration = calculateShiftDuration(startTime, endTime, validatedData.breakDuration)

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'shift',
          entityId: shift.id,
          action: 'created',
          description: `Shift "${shift.shiftName}" created (${startTime} - ${endTime})`,
          userId: authResult.user.id,
          metadata: {
            shiftName: shift.shiftName,
            startTime: shift.startTime,
            endTime: shift.endTime,
            breakDuration: shift.breakDuration,
            duration: duration,
            isOvernightShift
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...shift,
        duration,
        isOvernightShift
      },
      message: 'Shift created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

function calculateShiftDuration(startTime: string, endTime: string, breakDuration: number): string {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  let totalMinutes: number
  if (endMinutes < startMinutes) {
    // Overnight shift
    totalMinutes = (24 * 60 - startMinutes) + endMinutes
  } else {
    totalMinutes = endMinutes - startMinutes
  }

  // Subtract break duration
  totalMinutes = Math.max(0, totalMinutes - breakDuration)

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours}h ${minutes}m`
}