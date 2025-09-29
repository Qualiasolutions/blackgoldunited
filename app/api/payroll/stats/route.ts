import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/payroll/stats - Get payroll statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get total active employees
    const { count: totalEmployees } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null)

    // Get current month's pay runs
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: payRuns, error: payRunsError } = await supabase
      .from('pay_runs')
      .select('*')
      .gte('pay_period_start', firstDayOfMonth)
      .lte('pay_period_end', lastDayOfMonth)

    if (payRunsError) {
      console.error('Pay runs error:', payRunsError)
    }

    // Calculate monthly payroll totals
    let monthlyGross = 0
    let monthlyNet = 0
    let monthlyDeductions = 0
    let employeesPaid = 0
    let pendingPayslips = 0

    if (payRuns && payRuns.length > 0) {
      payRuns.forEach(run => {
        monthlyGross += parseFloat(run.total_gross || 0)
        monthlyNet += parseFloat(run.total_net || 0)
        monthlyDeductions += parseFloat(run.total_deductions || 0)

        if (run.status === 'PAID' || run.status === 'APPROVED') {
          // Count payslips for this run
          employeesPaid += 1
        } else if (run.status === 'DRAFT' || run.status === 'PROCESSED') {
          pendingPayslips += 1
        }
      })
    }

    // Get payslips count for more accurate employee count
    const { data: payslips } = await supabase
      .from('pay_slips')
      .select('id, pay_run_id, employee_id')
      .in('pay_run_id', payRuns?.map(r => r.id) || [])

    if (payslips) {
      const uniqueEmployees = new Set(payslips.map(p => p.employee_id))
      employeesPaid = uniqueEmployees.size
    }

    // Calculate average salary
    const avgSalary = totalEmployees && totalEmployees > 0
      ? monthlyNet / (totalEmployees || 1)
      : 0

    // Get pending approvals count
    const { count: pendingCount } = await supabase
      .from('pay_runs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PROCESSED')

    return NextResponse.json({
      success: true,
      data: {
        monthlyPayroll: Math.round(monthlyNet),
        monthlyGross: Math.round(monthlyGross),
        monthlyDeductions: Math.round(monthlyDeductions),
        employeesPaid,
        totalEmployees: totalEmployees || 0,
        pendingPayslips: pendingCount || 0,
        avgSalary: Math.round(avgSalary),
        // Breakdown
        breakdown: {
          baseSalaries: Math.round(monthlyGross * 0.82), // Estimated 82% of gross
          allowances: Math.round(monthlyGross * 0.18), // Estimated 18% of gross
          taxDeductions: Math.round(monthlyDeductions * 0.7), // Estimated 70% of deductions
          otherDeductions: Math.round(monthlyDeductions * 0.3) // Estimated 30% of deductions
        }
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}