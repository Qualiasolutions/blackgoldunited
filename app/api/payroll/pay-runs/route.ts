import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Pay run validation schema
const payRunSchema = z.object({
  payPeriodStart: z.string().min(1, 'Pay period start is required'),
  payPeriodEnd: z.string().min(1, 'Pay period end is required'),
  payDate: z.string().min(1, 'Pay date is required'),
  departmentIds: z.array(z.string().uuid()).optional(),
  employeeIds: z.array(z.string().uuid()).optional(),
  includeOvertime: z.boolean().default(true),
  includeLoanDeductions: z.boolean().default(true),
  description: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'PROCESSING', 'COMPLETED', 'APPROVED', 'PAID']).default('DRAFT')
})

// Function to generate pay run number
async function generatePayRunNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')

  // Get the count of pay runs this month
  const { count } = await supabase
    .from('pay_runs')
    .select('*', { count: 'exact', head: true })
    .like('pay_run_number', `PR-${year}${month}-%`)

  const sequenceNumber = String((count || 0) + 1).padStart(3, '0')
  return `PR-${year}${month}-${sequenceNumber}`
}

// GET /api/payroll/pay-runs - List all pay runs
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
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const offset = (page - 1) * limit

    // Build query with relations
    let queryBuilder = supabase
      .from('pay_runs')
      .select(`
        *,
        created_by_user:users!pay_runs_created_by_fkey(first_name, last_name),
        approved_by_user:users!pay_runs_approved_by_fkey(first_name, last_name)
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`
        pay_run_number.ilike.%${query}%,
        description.ilike.%${query}%
      `)
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
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
      .from('pay_runs')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: payRuns, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch pay runs' }, { status: 500 })
    }

    // Get employee counts for each pay run
    const payRunsWithCounts = await Promise.all(
      (payRuns || []).map(async (payRun) => {
        const { count: employeeCount } = await supabase
          .from('pay_slips')
          .select('*', { count: 'exact', head: true })
          .eq('pay_run_id', payRun.id)

        return {
          ...payRun,
          employee_count: employeeCount || 0
        }
      })
    )

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_PAY_RUNS',
      entity_type: 'pay_run',
      details: { query, page, limit, total_count: totalCount }
    })

    return NextResponse.json({
      success: true,
      data: payRunsWithCounts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      }
    })

  } catch (error) {
    console.error('Pay runs fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payroll/pay-runs - Create new pay run
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - payroll module access required
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = payRunSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const {
      payPeriodStart,
      payPeriodEnd,
      payDate,
      departmentIds,
      employeeIds,
      includeOvertime,
      includeLoanDeductions,
      description,
      status
    } = validation.data

    const supabase = await createClient()

    // Validate date ranges
    const startDate = new Date(payPeriodStart)
    const endDate = new Date(payPeriodEnd)
    const paymentDate = new Date(payDate)

    if (startDate >= endDate) {
      return NextResponse.json({
        error: 'Pay period start date must be before end date'
      }, { status: 400 })
    }

    if (paymentDate < endDate) {
      return NextResponse.json({
        error: 'Pay date must be after or equal to pay period end date'
      }, { status: 400 })
    }

    // Check for overlapping pay runs
    const { data: overlappingRuns } = await supabase
      .from('pay_runs')
      .select('id, pay_run_number')
      .or(`
        and(pay_period_start.lte.${payPeriodStart},pay_period_end.gte.${payPeriodStart}),
        and(pay_period_start.lte.${payPeriodEnd},pay_period_end.gte.${payPeriodEnd}),
        and(pay_period_start.gte.${payPeriodStart},pay_period_end.lte.${payPeriodEnd})
      `)
      .in('status', ['DRAFT', 'PROCESSING', 'COMPLETED', 'APPROVED', 'PAID'])

    if (overlappingRuns && overlappingRuns.length > 0) {
      return NextResponse.json({
        error: `Pay period overlaps with existing pay run: ${overlappingRuns[0].pay_run_number}`
      }, { status: 400 })
    }

    // Verify departments exist if specified
    if (departmentIds && departmentIds.length > 0) {
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .in('id', departmentIds)

      if (deptError || !departments || departments.length !== departmentIds.length) {
        return NextResponse.json({ error: 'One or more departments not found' }, { status: 404 })
      }
    }

    // Verify employees exist if specified
    if (employeeIds && employeeIds.length > 0) {
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id')
        .in('id', employeeIds)

      if (empError || !employees || employees.length !== employeeIds.length) {
        return NextResponse.json({ error: 'One or more employees not found' }, { status: 404 })
      }
    }

    // Generate pay run number
    const payRunNumber = await generatePayRunNumber(supabase)

    // Create pay run
    const { data: payRun, error: createError } = await supabase
      .from('pay_runs')
      .insert({
        pay_run_number: payRunNumber,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        pay_date: payDate,
        department_ids: departmentIds || null,
        employee_ids: employeeIds || null,
        include_overtime: includeOvertime,
        include_loan_deductions: includeLoanDeductions,
        description: description || null,
        status: status,
        created_by: authResult.user.id
      })
      .select(`
        *,
        created_by_user:users!pay_runs_created_by_fkey(first_name, last_name)
      `)
      .single()

    if (createError) {
      console.error('Pay run creation error:', createError)
      return NextResponse.json({ error: 'Failed to create pay run' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_PAY_RUN',
      entity_type: 'pay_run',
      entity_id: payRun.id,
      details: {
        pay_run_number: payRunNumber,
        pay_period: `${payPeriodStart} to ${payPeriodEnd}`,
        pay_date: payDate,
        department_count: departmentIds?.length || 0,
        employee_count: employeeIds?.length || 0
      }
    })

    return NextResponse.json({
      success: true,
      data: payRun,
      message: 'Pay run created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Pay run creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}