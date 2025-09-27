import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Overtime validation schema
const overtimeSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  workDate: z.string().min(1, 'Work date is required'),
  overtimeHours: z.number().min(0.5).max(24, 'Overtime hours must be between 0.5 and 24'),
  overtimeType: z.enum(['REGULAR', 'WEEKEND', 'HOLIDAY', 'NIGHT_SHIFT'], {
    errorMap: () => ({ message: 'Overtime type must be REGULAR, WEEKEND, HOLIDAY, or NIGHT_SHIFT' })
  }),
  description: z.string().min(5, 'Description must be at least 5 characters').max(500),
  approvedBy: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).default('PENDING')
})

// Function to calculate overtime rate based on type
function calculateOvertimeRate(overtimeType: string, basicHourlyRate: number): number {
  const rateMultipliers = {
    'REGULAR': 1.5,      // 150% of basic rate
    'WEEKEND': 2.0,      // 200% of basic rate
    'HOLIDAY': 2.5,      // 250% of basic rate
    'NIGHT_SHIFT': 1.75  // 175% of basic rate
  }

  return basicHourlyRate * (rateMultipliers[overtimeType as keyof typeof rateMultipliers] || 1.5)
}

// GET /api/payroll/overtime - List all overtime records
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - payroll module access required
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const query = searchParams.get('query') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const overtimeType = searchParams.get('overtimeType')
    const status = searchParams.get('status')
    const employeeId = searchParams.get('employeeId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const offset = (page - 1) * limit

    // Build query with relations
    let queryBuilder = supabase
      .from('overtime_records')
      .select(`
        *,
        employee:employees(
          id,
          employee_number,
          first_name,
          last_name,
          email,
          basic_salary,
          department:departments(id, name),
          designation:designations(id, title)
        ),
        approved_by_user:users!overtime_records_approved_by_fkey(first_name, last_name),
        created_by_user:users!overtime_records_created_by_fkey(first_name, last_name)
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`
        employee.first_name.ilike.%${query}%,
        employee.last_name.ilike.%${query}%,
        employee.employee_number.ilike.%${query}%,
        description.ilike.%${query}%
      `)
    }

    if (overtimeType) {
      queryBuilder = queryBuilder.eq('overtime_type', overtimeType)
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    if (employeeId) {
      queryBuilder = queryBuilder.eq('employee_id', employeeId)
    }

    if (dateFrom) {
      queryBuilder = queryBuilder.gte('work_date', dateFrom)
    }

    if (dateTo) {
      queryBuilder = queryBuilder.lte('work_date', dateTo)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('overtime_records')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: overtimeRecords, error } = await queryBuilder
      .order('work_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch overtime records' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_OVERTIME_RECORDS',
      entity_type: 'overtime_record',
      details: { query, page, limit, total_count: totalCount }
    })

    return NextResponse.json({
      success: true,
      data: overtimeRecords || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      }
    })

  } catch (error) {
    console.error('Overtime records fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payroll/overtime - Create new overtime record
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - payroll module access required
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = overtimeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const {
      employeeId,
      workDate,
      overtimeHours,
      overtimeType,
      description,
      approvedBy,
      status
    } = validation.data

    const supabase = await createClient()

    // Verify employee exists and get basic salary
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, employee_number, basic_salary')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Get employee contract for working hours
    const { data: contract } = await supabase
      .from('contracts')
      .select('working_hours_per_week')
      .eq('employee_id', employeeId)
      .eq('status', 'ACTIVE')
      .single()

    const workingHoursPerWeek = contract?.working_hours_per_week || 40
    const dailyHours = workingHoursPerWeek / 5 // Assuming 5-day work week
    const basicHourlyRate = employee.basic_salary / (workingHoursPerWeek * 4.33) // Monthly to hourly

    // Check for duplicate overtime record on same date
    const { data: existingRecord } = await supabase
      .from('overtime_records')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('work_date', workDate)
      .single()

    if (existingRecord) {
      return NextResponse.json({
        error: 'Overtime record already exists for this employee on this date'
      }, { status: 400 })
    }

    // Calculate overtime pay
    const overtimeRate = calculateOvertimeRate(overtimeType, basicHourlyRate)
    const overtimePay = overtimeHours * overtimeRate

    // Verify approver exists if provided
    if (approvedBy) {
      const { data: approver, error: approverError } = await supabase
        .from('users')
        .select('id')
        .eq('id', approvedBy)
        .single()

      if (approverError || !approver) {
        return NextResponse.json({ error: 'Approver not found' }, { status: 404 })
      }
    }

    // Create overtime record
    const { data: overtimeRecord, error: createError } = await supabase
      .from('overtime_records')
      .insert({
        employee_id: employeeId,
        work_date: workDate,
        overtime_hours: overtimeHours,
        overtime_type: overtimeType,
        hourly_rate: basicHourlyRate,
        overtime_rate: overtimeRate,
        overtime_pay: overtimePay,
        description: description,
        approved_by: approvedBy || null,
        status: status,
        created_by: authResult.user.id
      })
      .select(`
        *,
        employee:employees(
          id,
          employee_number,
          first_name,
          last_name,
          email,
          department:departments(id, name),
          designation:designations(id, title)
        ),
        approved_by_user:users!overtime_records_approved_by_fkey(first_name, last_name),
        created_by_user:users!overtime_records_created_by_fkey(first_name, last_name)
      `)
      .single()

    if (createError) {
      console.error('Overtime record creation error:', createError)
      return NextResponse.json({ error: 'Failed to create overtime record' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_OVERTIME_RECORD',
      entity_type: 'overtime_record',
      entity_id: overtimeRecord.id,
      details: {
        employee_name: `${employee.first_name} ${employee.last_name}`,
        work_date: workDate,
        overtime_hours: overtimeHours,
        overtime_type: overtimeType,
        overtime_pay: overtimePay
      }
    })

    return NextResponse.json({
      success: true,
      data: overtimeRecord,
      message: 'Overtime record created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Overtime record creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}