import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Pay slip generation validation schema
const paySlipSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  payRunId: z.string().uuid('Invalid pay run ID').optional(),
  payPeriodStart: z.string().min(1, 'Pay period start is required'),
  payPeriodEnd: z.string().min(1, 'Pay period end is required'),
  workingDays: z.number().min(1).max(31).default(22),
  earnings: z.array(z.object({
    component_id: z.string().uuid().nullable(),
    component_name: z.string(),
    calculation_type: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
    amount: z.number()
  })),
  deductions: z.array(z.object({
    component_id: z.string().uuid().nullable(),
    component_name: z.string(),
    calculation_type: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
    amount: z.number()
  })),
  status: z.enum(['DRAFT', 'PROCESSED', 'APPROVED', 'PAID']).default('PROCESSED')
})

// GET /api/payroll/pay-slips - List all pay slips
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
    const status = searchParams.get('status')
    const employeeId = searchParams.get('employeeId')
    const payRunId = searchParams.get('payRunId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const offset = (page - 1) * limit

    // Build query with relations
    let queryBuilder = supabase
      .from('pay_slips')
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
        pay_run:pay_runs(
          id,
          pay_run_number,
          pay_date,
          status
        ),
        created_by_user:users!pay_slips_created_by_fkey(first_name, last_name)
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`
        employee.first_name.ilike.%${query}%,
        employee.last_name.ilike.%${query}%,
        employee.employee_number.ilike.%${query}%,
        pay_run.pay_run_number.ilike.%${query}%
      `)
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    if (employeeId) {
      queryBuilder = queryBuilder.eq('employee_id', employeeId)
    }

    if (payRunId) {
      queryBuilder = queryBuilder.eq('pay_run_id', payRunId)
    }

    if (year) {
      queryBuilder = queryBuilder.gte('pay_period_start', `${year}-01-01`)
      queryBuilder = queryBuilder.lte('pay_period_end', `${year}-12-31`)
    }

    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
      queryBuilder = queryBuilder.gte('pay_period_start', startDate)
      queryBuilder = queryBuilder.lte('pay_period_end', endDate)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('pay_slips')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: paySlips, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch pay slips' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_PAY_SLIPS',
      entity_type: 'pay_slip',
      details: { query, page, limit, total_count: totalCount }
    })

    return NextResponse.json({
      success: true,
      data: paySlips || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      }
    })

  } catch (error) {
    console.error('Pay slips fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payroll/pay-slips - Create individual pay slip
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - payroll module access required
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = paySlipSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const {
      employeeId,
      payRunId,
      payPeriodStart,
      payPeriodEnd,
      workingDays,
      earnings,
      deductions,
      status
    } = validation.data

    const supabase = await createClient()

    // Verify employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, employee_number, status')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (employee.status !== 'ACTIVE') {
      return NextResponse.json({
        error: 'Cannot create pay slip for inactive employee'
      }, { status: 400 })
    }

    // Verify pay run exists if provided
    if (payRunId) {
      const { data: payRun, error: payRunError } = await supabase
        .from('pay_runs')
        .select('id, status')
        .eq('id', payRunId)
        .single()

      if (payRunError || !payRun) {
        return NextResponse.json({ error: 'Pay run not found' }, { status: 404 })
      }

      // Check for duplicate pay slip in same pay run
      const { data: existingPaySlip } = await supabase
        .from('pay_slips')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('pay_run_id', payRunId)
        .single()

      if (existingPaySlip) {
        return NextResponse.json({
          error: 'Pay slip already exists for this employee in the selected pay run'
        }, { status: 400 })
      }
    }

    // Validate date ranges
    const startDate = new Date(payPeriodStart)
    const endDate = new Date(payPeriodEnd)

    if (startDate >= endDate) {
      return NextResponse.json({
        error: 'Pay period start date must be before end date'
      }, { status: 400 })
    }

    // Calculate totals
    const grossPay = earnings.reduce((sum, earning) => sum + earning.amount, 0)
    const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0)
    const netPay = grossPay - totalDeductions

    if (netPay < 0) {
      return NextResponse.json({
        error: 'Net pay cannot be negative. Please review deductions.'
      }, { status: 400 })
    }

    // Create pay slip
    const { data: paySlip, error: createError } = await supabase
      .from('pay_slips')
      .insert({
        employee_id: employeeId,
        pay_run_id: payRunId || null,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        working_days: workingDays,
        earnings: earnings,
        deductions: deductions,
        gross_pay: grossPay,
        total_deductions: totalDeductions,
        net_pay: netPay,
        status: status,
        generated_at: new Date().toISOString(),
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
        pay_run:pay_runs(
          id,
          pay_run_number,
          pay_date,
          status
        ),
        created_by_user:users!pay_slips_created_by_fkey(first_name, last_name)
      `)
      .single()

    if (createError) {
      console.error('Pay slip creation error:', createError)
      return NextResponse.json({ error: 'Failed to create pay slip' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_PAY_SLIP',
      entity_type: 'pay_slip',
      entity_id: paySlip.id,
      details: {
        employee_name: `${employee.first_name} ${employee.last_name}`,
        employee_number: employee.employee_number,
        pay_period: `${payPeriodStart} to ${payPeriodEnd}`,
        gross_pay: grossPay,
        net_pay: netPay
      }
    })

    return NextResponse.json({
      success: true,
      data: paySlip,
      message: 'Pay slip created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Pay slip creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}