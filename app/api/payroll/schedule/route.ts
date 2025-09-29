import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/payroll/schedule - Get upcoming payroll schedule
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get upcoming and recent pay runs
    const today = new Date().toISOString().split('T')[0]

    const { data: payRuns, error } = await supabase
      .from('pay_runs')
      .select(`
        id,
        pay_run_name,
        pay_period_start,
        pay_period_end,
        pay_date,
        status,
        total_gross,
        total_net,
        total_deductions
      `)
      .gte('pay_date', today)
      .order('pay_date', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch payroll schedule' }, { status: 500 })
    }

    // Get employee count per pay run
    const formattedSchedule = await Promise.all((payRuns || []).map(async (run) => {
      const { count } = await supabase
        .from('pay_slips')
        .select('*', { count: 'exact', head: true })
        .eq('pay_run_id', run.id)

      return {
        id: run.id,
        date: new Date(run.pay_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        type: run.pay_run_name,
        employees: count || 0,
        amount: parseFloat(run.total_net || 0),
        status: run.status,
        payPeriod: `${run.pay_period_start} to ${run.pay_period_end}`
      }
    }))

    return NextResponse.json({
      success: true,
      data: formattedSchedule
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}