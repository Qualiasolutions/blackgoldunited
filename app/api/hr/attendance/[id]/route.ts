import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Attendance update schema
const attendanceUpdateSchema = z.object({
  checkIn: z.string().optional().or(z.literal('')),
  checkOut: z.string().optional().or(z.literal('')),
  breakStart: z.string().optional().or(z.literal('')),
  breakEnd: z.string().optional().or(z.literal('')),
  status: z.enum(['present', 'late', 'absent', 'half_day', 'work_from_home']).optional(),
  notes: z.string().optional().or(z.literal('')),
  overtimeHours: z.number().min(0).optional()
})

// GET /api/hr/attendance/[id] - Get single attendance record
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'hr', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const attendanceId = params.id

    // Get attendance record with employee details
    const { data: attendanceRecord, error } = await supabase
      .from('attendance_logs')
      .select(`
        *,
        employee:employees!attendance_logs_employeeId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber,
          userId,
          department:departments(id, name),
          designation:designations(id, title),
          shifts:employee_shifts!employee_shifts_employeeId_fkey(
            id,
            effectiveFrom,
            effectiveTo,
            shift:shifts!employee_shifts_shiftId_fkey(
              id,
              shiftName,
              startTime,
              endTime
            )
          )
        )
      `)
      .eq('id', attendanceId)
      .single()

    if (error || !attendanceRecord) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Check if user can view this record
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      if (attendanceRecord.employee?.userId !== authResult.user.id) {
        return NextResponse.json({
          error: 'Insufficient permissions - You can only view your own attendance records'
        }, { status: 403 })
      }
    }

    // Calculate hours worked and performance metrics
    let hoursWorked = 0
    let breakHours = 0
    let isLate = false
    let isEarlyLeave = false

    if (attendanceRecord.checkIn && attendanceRecord.checkOut) {
      const checkInTime = new Date(`${attendanceRecord.date}T${attendanceRecord.checkIn}`)
      const checkOutTime = new Date(`${attendanceRecord.date}T${attendanceRecord.checkOut}`)
      hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

      // Calculate break time
      if (attendanceRecord.breakStart && attendanceRecord.breakEnd) {
        const breakStartTime = new Date(`${attendanceRecord.date}T${attendanceRecord.breakStart}`)
        const breakEndTime = new Date(`${attendanceRecord.date}T${attendanceRecord.breakEnd}`)
        breakHours = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60 * 60)
      }

      hoursWorked = Math.max(0, hoursWorked - breakHours)

      // Check against shift timing if available
      const currentShift = attendanceRecord.employee?.shifts?.find((shift: any) =>
        new Date(shift.effectiveFrom) <= new Date(attendanceRecord.date) &&
        (!shift.effectiveTo || new Date(shift.effectiveTo) >= new Date(attendanceRecord.date))
      )

      if (currentShift?.shift) {
        const shiftStart = new Date(`${attendanceRecord.date}T${currentShift.shift.startTime}`)
        const shiftEnd = new Date(`${attendanceRecord.date}T${currentShift.shift.endTime}`)

        isLate = checkInTime > shiftStart
        isEarlyLeave = checkOutTime < shiftEnd
      }
    }

    const enrichedRecord = {
      ...attendanceRecord,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      breakHours: Math.round(breakHours * 100) / 100,
      isLate,
      isEarlyLeave,
      performance: {
        isOnTime: !isLate,
        isFullDay: !isEarlyLeave,
        actualHours: Math.round(hoursWorked * 100) / 100,
        overtimeHours: attendanceRecord.overtimeHours || 0
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedRecord
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/hr/attendance/[id] - Update attendance record
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'hr', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can update attendance records
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can update attendance records'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const attendanceId = params.id
    const body = await request.json()

    // Validate request data
    const validationResult = attendanceUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Check if attendance record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('attendance_logs')
      .select(`
        id,
        employeeId,
        date,
        employee:employees!attendance_logs_employeeId_fkey(firstName, lastName, employeeNumber)
      `)
      .eq('id', attendanceId)
      .single()

    if (checkError || !existingRecord) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Prepare update data - only include provided fields
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    Object.keys(validatedData).forEach(key => {
      const value = (validatedData as any)[key]
      if (value !== undefined) {
        updateData[key] = value === '' ? null : value
      }
    })

    // Update attendance record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('attendance_logs')
      .update(updateData)
      .eq('id', attendanceId)
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
          entityId: existingRecord.employeeId,
          action: 'updated',
          description: `Attendance record updated for ${existingRecord.employee.firstName} ${existingRecord.employee.lastName} on ${existingRecord.date}`,
          userId: authResult.user.id,
          metadata: {
            attendanceId,
            employeeNumber: existingRecord.employee.employeeNumber,
            employeeName: `${existingRecord.employee.firstName} ${existingRecord.employee.lastName}`,
            date: existingRecord.date,
            updatedFields: Object.keys(validatedData)
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: 'Attendance record updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/hr/attendance/[id] - Delete attendance record
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'hr', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT can delete attendance records
    const userRole = authResult.user.role
    if (userRole !== 'MANAGEMENT') {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT can delete attendance records'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const attendanceId = params.id

    // Get attendance record details before deletion
    const { data: attendanceRecord, error: checkError } = await supabase
      .from('attendance_logs')
      .select(`
        id,
        employeeId,
        date,
        employee:employees!attendance_logs_employeeId_fkey(firstName, lastName, employeeNumber)
      `)
      .eq('id', attendanceId)
      .single()

    if (checkError || !attendanceRecord) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Delete attendance record
    const { error: deleteError } = await supabase
      .from('attendance_logs')
      .delete()
      .eq('id', attendanceId)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete attendance record' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'attendance',
          entityId: attendanceRecord.employeeId,
          action: 'deleted',
          description: `Attendance record deleted for ${attendanceRecord.employee.firstName} ${attendanceRecord.employee.lastName} on ${attendanceRecord.date}`,
          userId: authResult.user.id,
          metadata: {
            attendanceId,
            employeeNumber: attendanceRecord.employee.employeeNumber,
            employeeName: `${attendanceRecord.employee.firstName} ${attendanceRecord.employee.lastName}`,
            date: attendanceRecord.date
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `Attendance record for ${attendanceRecord.employee.firstName} ${attendanceRecord.employee.lastName} on ${attendanceRecord.date} deleted successfully`
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}