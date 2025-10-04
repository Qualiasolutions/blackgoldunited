import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Attendance validation schema
const attendanceSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  date: z.string().min(1, 'Date is required'),
  checkIn: z.string().optional().or(z.literal('')),
  checkOut: z.string().optional().or(z.literal('')),
  breakStart: z.string().optional().or(z.literal('')),
  breakEnd: z.string().optional().or(z.literal('')),
  status: z.enum(['present', 'late', 'absent', 'half_day', 'work_from_home']).default('present'),
  notes: z.string().optional().or(z.literal('')),
  overtimeHours: z.number().min(0).optional().default(0)
})

// Check-in/Check-out schema
const checkInOutSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID').optional(), // Optional for self check-in
  action: z.enum(['check_in', 'check_out', 'break_start', 'break_end']),
  notes: z.string().optional().or(z.literal(''))
})

// GET /api/hr/attendance - List attendance records with filtering
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const departmentId = searchParams.get('departmentId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Base query with employee details
    let query = supabase
      .from('attendance_logs')
      .select(`
        id,
        employeeId,
        date,
        checkIn,
        checkOut,
        breakStart,
        breakEnd,
        status,
        notes,
        overtimeHours,
        createdAt,
        updatedAt,
        employee:employees!attendance_logs_employeeId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber,
          department:departments(id, name),
          designation:designations(id, title)
        )
      `, { count: 'exact' })
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply filters
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: attendanceRecords, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 })
    }

    // Filter by department if specified (client-side filtering)
    let filteredRecords = attendanceRecords || []
    if (departmentId) {
      filteredRecords = filteredRecords.filter(record =>
        (record.employee as any)?.department?.id === departmentId
      )
    }

    // Calculate hours worked for each record
    const enrichedRecords = filteredRecords.map(record => {
      let hoursWorked = 0
      let breakHours = 0

      if (record.checkIn && record.checkOut) {
        const checkInTime = new Date(`${record.date}T${record.checkIn}`)
        const checkOutTime = new Date(`${record.date}T${record.checkOut}`)
        hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

        // Calculate break time
        if (record.breakStart && record.breakEnd) {
          const breakStartTime = new Date(`${record.date}T${record.breakStart}`)
          const breakEndTime = new Date(`${record.date}T${record.breakEnd}`)
          breakHours = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60 * 60)
        }

        hoursWorked = Math.max(0, hoursWorked - breakHours)
      }

      return {
        ...record,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
        breakHours: Math.round(breakHours * 100) / 100
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedRecords,
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

// POST /api/hr/attendance - Create attendance record or check-in/check-out
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - HR write access required for manual entries, employees can check themselves in/out
    const authResult = await authenticateAndAuthorize(request, 'attendance', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Determine if this is a check-in/out action or manual attendance entry
    if (body.action) {
      // Check-in/Check-out action
      return await handleCheckInOut(supabase, body, authResult)
    } else {
      // Manual attendance entry - only MANAGEMENT and ADMIN_HR can create manual entries
      return await handleManualAttendanceEntry(supabase, body, authResult)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle check-in/check-out actions
async function handleCheckInOut(supabase: any, body: any, authResult: any) {
  const validationResult = checkInOutSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validationResult.error.errors
    }, { status: 400 })
  }

  const { employeeId, action, notes } = validationResult.data
  const targetEmployeeId = employeeId || authResult.user.employeeId

  if (!targetEmployeeId) {
    return NextResponse.json({
      error: 'Employee ID is required'
    }, { status: 400 })
  }

  // Verify employee exists and check permissions
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, firstName, lastName, employeeNumber, userId')
    .eq('id', targetEmployeeId)
    .single()

  if (empError || !employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  // Check if user can check in/out for this employee
  const userRole = authResult.user.role
  if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
    if (employee.userId !== authResult.user.id) {
      return NextResponse.json({
        error: 'Insufficient permissions - You can only check in/out for yourself'
      }, { status: 403 })
    }
  }

  // Get or create today's attendance record
  const today = new Date().toISOString().split('T')[0]
  const currentTime = new Date().toTimeString().split(' ')[0]

  let { data: attendanceRecord, error: findError } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('employee_id', targetEmployeeId)
    .eq('date', today)
    .single()

  if (findError && findError.code !== 'PGRST116') {
    console.error('Database error:', findError)
    return NextResponse.json({ error: 'Failed to fetch attendance record' }, { status: 500 })
  }

  // Create new record if doesn't exist
  if (!attendanceRecord) {
    const { data: newRecord, error: createError } = await supabase
      .from('attendance_logs')
      .insert([{
        employeeId: targetEmployeeId,
        date: today,
        status: 'present',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single()

    if (createError) {
      console.error('Database error:', createError)
      return NextResponse.json({ error: 'Failed to create attendance record' }, { status: 500 })
    }

    attendanceRecord = newRecord
  }

  // Update the record based on action
  const updateData: any = {
    updatedAt: new Date().toISOString()
  }

  if (notes) {
    updateData.notes = notes
  }

  switch (action) {
    case 'check_in':
      if (attendanceRecord.checkIn) {
        return NextResponse.json({
          error: 'Already checked in today'
        }, { status: 400 })
      }
      updateData.checkIn = currentTime
      break

    case 'check_out':
      if (!attendanceRecord.checkIn) {
        return NextResponse.json({
          error: 'Must check in before checking out'
        }, { status: 400 })
      }
      if (attendanceRecord.checkOut) {
        return NextResponse.json({
          error: 'Already checked out today'
        }, { status: 400 })
      }
      updateData.checkOut = currentTime
      break

    case 'break_start':
      if (!attendanceRecord.checkIn) {
        return NextResponse.json({
          error: 'Must check in before starting break'
        }, { status: 400 })
      }
      if (attendanceRecord.breakStart && !attendanceRecord.breakEnd) {
        return NextResponse.json({
          error: 'Already on break'
        }, { status: 400 })
      }
      updateData.breakStart = currentTime
      updateData.breakEnd = null // Reset break end if starting new break
      break

    case 'break_end':
      if (!attendanceRecord.breakStart) {
        return NextResponse.json({
          error: 'Must start break before ending it'
        }, { status: 400 })
      }
      if (attendanceRecord.breakEnd) {
        return NextResponse.json({
          error: 'Break already ended'
        }, { status: 400 })
      }
      updateData.breakEnd = currentTime
      break
  }

  // Update attendance record
  const { data: updatedRecord, error: updateError } = await supabase
    .from('attendance_logs')
    .update(updateData)
    .eq('id', attendanceRecord.id)
    .select(`
      *,
      employee:employees!attendance_logs_employeeId_fkey(
        firstName,
        lastName,
        employeeNumber
      )
    `)
    .single()

  if (updateError) {
    console.error('Database error:', updateError)
    return NextResponse.json({ error: 'Failed to update attendance record' }, { status: 500 })
  }

  // Log activity
  try {
    await supabase
      .from('activity_logs')
      .insert([{
        entityType: 'attendance',
        entityId: targetEmployeeId,
        action,
        description: `${employee.firstName} ${employee.lastName} performed ${action.replace('_', ' ')}`,
        userId: authResult.user.id,
        metadata: {
          employeeNumber: employee.employeeNumber,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          action,
          time: currentTime,
          notes
        },
        createdAt: new Date().toISOString()
      }])
  } catch (logError) {
    console.warn('Failed to log attendance activity:', logError)
  }

  return NextResponse.json({
    success: true,
    data: updatedRecord,
    message: `${action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} recorded successfully`
  })
}

// Handle manual attendance entry
async function handleManualAttendanceEntry(supabase: any, body: any, authResult: any) {
  // Additional role check - only MANAGEMENT and ADMIN_HR can create manual entries
  const userRole = authResult.user.role
  if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
    return NextResponse.json({
      error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can create manual attendance entries'
    }, { status: 403 })
  }

  const validationResult = attendanceSchema.safeParse(body)
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
    .single()

  if (empError || !employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  // Check for duplicate attendance record
  const { data: existingRecord } = await supabase
    .from('attendance_logs')
    .select('id')
    .eq('employee_id', validatedData.employeeId)
    .eq('date', validatedData.date)
    .single()

  if (existingRecord) {
    return NextResponse.json({
      error: 'Attendance record already exists for this employee on this date'
    }, { status: 409 })
  }

  // Create attendance record
  const attendanceData = {
    employeeId: validatedData.employeeId,
    date: validatedData.date,
    checkIn: validatedData.checkIn || null,
    checkOut: validatedData.checkOut || null,
    breakStart: validatedData.breakStart || null,
    breakEnd: validatedData.breakEnd || null,
    status: validatedData.status,
    notes: validatedData.notes || null,
    overtimeHours: validatedData.overtimeHours || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const { data: attendanceRecord, error } = await supabase
    .from('attendance_logs')
    .insert([attendanceData])
    .select(`
      *,
      employee:employees!attendance_logs_employeeId_fkey(
        firstName,
        lastName,
        employeeNumber,
        department:departments(name)
      )
    `)
    .single()

  if (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to create attendance record' }, { status: 500 })
  }

  // Log activity
  try {
    await supabase
      .from('activity_logs')
      .insert([{
        entityType: 'attendance',
        entityId: validatedData.employeeId,
        action: 'manual_entry',
        description: `Manual attendance entry created for ${employee.firstName} ${employee.lastName}`,
        userId: authResult.user.id,
        metadata: {
          employeeNumber: employee.employeeNumber,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          date: validatedData.date,
          status: validatedData.status
        },
        createdAt: new Date().toISOString()
      }])
  } catch (logError) {
    console.warn('Failed to log activity:', logError)
  }

  return NextResponse.json({
    success: true,
    data: attendanceRecord,
    message: 'Attendance record created successfully'
  }, { status: 201 })
}