import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/payroll/records - Get payroll records
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const employeeId = searchParams.get('employeeId')

    // Get recent pay slips with employee details
    let query = supabase
      .from('pay_slips')
      .select(`
        id,
        pay_run_id,
        employee_id,
        basic_salary,
        gross_salary,
        total_deductions,
        net_salary,
        working_days,
        present_days,
        leave_days,
        overtime_hours,
        overtime_amount,
        earnings_data,
        deductions_data,
        created_at,
        employee:employees!pay_slips_employee_id_fkey(
          id,
          first_name,
          last_name,
          employee_number
        ),
        pay_run:pay_runs!pay_slips_pay_run_id_fkey(
          id,
          pay_run_name,
          pay_period_start,
          pay_period_end,
          status
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch payroll records' }, { status: 500 })
    }

    const formattedData = data?.map((item: any) => ({
      id: item.id,
      name: `${item.employee?.first_name || ''} ${item.employee?.last_name || ''}`.trim(),
      employeeId: item.employee?.id,
      employeeNumber: item.employee?.employee_number,
      baseSalary: parseFloat(item.basic_salary || 0),
      grossSalary: parseFloat(item.gross_salary || 0),
      allowances: parseFloat(item.gross_salary || 0) - parseFloat(item.basic_salary || 0),
      deductions: parseFloat(item.total_deductions || 0),
      netPay: parseFloat(item.net_salary || 0),
      status: item.pay_run?.status || 'DRAFT',
      payPeriod: item.pay_run ? `${item.pay_run.pay_period_start} to ${item.pay_run.pay_period_end}` : '',
      workingDays: item.working_days,
      presentDays: item.present_days,
      leaveDays: item.leave_days,
      overtimeHours: item.overtime_hours,
      overtimeAmount: parseFloat(item.overtime_amount || 0),
      createdAt: item.created_at
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedData
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}