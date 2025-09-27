import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Function to calculate salary based on structure and components
async function calculateEmployeeSalary(supabase: any, employee: any, payPeriodStart: string, payPeriodEnd: string, includeOvertime: boolean, includeLoanDeductions: boolean) {
  let earnings = []
  let deductions = []
  let totalEarnings = 0
  let totalDeductions = 0

  // Get employee's active contract
  const { data: contract } = await supabase
    .from('contracts')
    .select(`
      *,
      salary_structure:salary_structures(
        *,
        structure_details:salary_structure_details(
          *,
          component:salary_components(*)
        )
      )
    `)
    .eq('employee_id', employee.id)
    .eq('status', 'ACTIVE')
    .single()

  if (!contract || !contract.salary_structure) {
    throw new Error(`No active contract or salary structure found for employee ${employee.employee_number}`)
  }

  const basicSalary = contract.basic_salary
  const workingDaysInMonth = 22 // Standard working days

  // Process salary structure components
  for (const detail of contract.salary_structure.structure_details) {
    const component = detail.component
    let amount = 0

    // Calculate component amount based on calculation type
    switch (component.calculation_type) {
      case 'FIXED':
        amount = detail.amount || 0
        break
      case 'PERCENTAGE':
        amount = (basicSalary * (detail.percentage || 0)) / 100
        break
      case 'FORMULA':
        // Simple formula evaluation for common cases
        if (detail.formula) {
          const formula = detail.formula.toLowerCase()
          if (formula.includes('basic_salary')) {
            amount = eval(formula.replace('basic_salary', basicSalary.toString()))
          } else {
            amount = detail.amount || 0
          }
        }
        break
    }

    const componentData = {
      component_id: component.id,
      component_name: component.component_name,
      calculation_type: component.calculation_type,
      amount: Math.round(amount * 100) / 100
    }

    if (component.component_type === 'EARNING') {
      earnings.push(componentData)
      totalEarnings += componentData.amount
    } else {
      deductions.push(componentData)
      totalDeductions += componentData.amount
    }
  }

  // Add overtime earnings if enabled
  if (includeOvertime) {
    const { data: overtimeRecords } = await supabase
      .from('overtime_records')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('status', 'APPROVED')
      .gte('work_date', payPeriodStart)
      .lte('work_date', payPeriodEnd)

    if (overtimeRecords && overtimeRecords.length > 0) {
      const totalOvertimePay = overtimeRecords.reduce((sum, record) => sum + (record.overtime_pay || 0), 0)
      if (totalOvertimePay > 0) {
        earnings.push({
          component_id: null,
          component_name: 'Overtime Pay',
          calculation_type: 'FIXED',
          amount: totalOvertimePay
        })
        totalEarnings += totalOvertimePay
      }
    }
  }

  // Add loan deductions if enabled
  if (includeLoanDeductions) {
    const { data: activeLoans } = await supabase
      .from('employee_loans')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('status', 'DISBURSED')

    if (activeLoans && activeLoans.length > 0) {
      for (const loan of activeLoans) {
        const remainingBalance = loan.total_amount - (loan.amount_paid || 0)
        if (remainingBalance > 0) {
          const deductionAmount = Math.min(loan.monthly_installment, remainingBalance)
          deductions.push({
            component_id: null,
            component_name: `Loan Deduction (${loan.loan_number})`,
            calculation_type: 'FIXED',
            amount: deductionAmount
          })
          totalDeductions += deductionAmount
        }
      }
    }
  }

  const grossPay = totalEarnings
  const netPay = grossPay - totalDeductions

  return {
    earnings,
    deductions,
    gross_pay: grossPay,
    total_deductions: totalDeductions,
    net_pay: netPay,
    working_days: workingDaysInMonth
  }
}

// POST /api/payroll/pay-runs/[id]/process - Process pay run calculations
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = params
    const supabase = await createClient()

    // Check if pay run exists and is in correct status
    const { data: payRun, error: fetchError } = await supabase
      .from('pay_runs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pay run not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch pay run' }, { status: 500 })
    }

    if (payRun.status !== 'DRAFT') {
      return NextResponse.json({
        error: 'Can only process pay runs in DRAFT status'
      }, { status: 400 })
    }

    // Update pay run status to PROCESSING
    await supabase
      .from('pay_runs')
      .update({ status: 'PROCESSING' })
      .eq('id', id)

    try {
      // Get eligible employees for this pay run
      let employeeQuery = supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name),
          designation:designations(id, title)
        `)
        .eq('status', 'ACTIVE')

      // Filter by departments if specified
      if (payRun.department_ids && payRun.department_ids.length > 0) {
        employeeQuery = employeeQuery.in('department_id', payRun.department_ids)
      }

      // Filter by specific employees if specified
      if (payRun.employee_ids && payRun.employee_ids.length > 0) {
        employeeQuery = employeeQuery.in('id', payRun.employee_ids)
      }

      const { data: employees, error: employeeError } = await employeeQuery

      if (employeeError) {
        throw new Error(`Failed to fetch employees: ${employeeError.message}`)
      }

      if (!employees || employees.length === 0) {
        throw new Error('No eligible employees found for this pay run')
      }

      const processedPaySlips = []
      const errors = []

      // Process each employee
      for (const employee of employees) {
        try {
          // Check if pay slip already exists
          const { data: existingPaySlip } = await supabase
            .from('pay_slips')
            .select('id')
            .eq('pay_run_id', id)
            .eq('employee_id', employee.id)
            .single()

          if (existingPaySlip) {
            continue // Skip if already processed
          }

          // Calculate salary for this employee
          const salaryCalculation = await calculateEmployeeSalary(
            supabase,
            employee,
            payRun.pay_period_start,
            payRun.pay_period_end,
            payRun.include_overtime,
            payRun.include_loan_deductions
          )

          // Create pay slip
          const { data: paySlip, error: paySlipError } = await supabase
            .from('pay_slips')
            .insert({
              pay_run_id: id,
              employee_id: employee.id,
              pay_period_start: payRun.pay_period_start,
              pay_period_end: payRun.pay_period_end,
              working_days: salaryCalculation.working_days,
              earnings: salaryCalculation.earnings,
              deductions: salaryCalculation.deductions,
              gross_pay: salaryCalculation.gross_pay,
              total_deductions: salaryCalculation.total_deductions,
              net_pay: salaryCalculation.net_pay,
              status: 'PROCESSED',
              generated_at: new Date().toISOString(),
              created_by: authResult.user.id
            })
            .select()
            .single()

          if (paySlipError) {
            errors.push(`Employee ${employee.employee_number}: ${paySlipError.message}`)
            continue
          }

          processedPaySlips.push({
            employee_id: employee.id,
            employee_number: employee.employee_number,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            gross_pay: salaryCalculation.gross_pay,
            net_pay: salaryCalculation.net_pay,
            pay_slip_id: paySlip.id
          })

        } catch (employeeError) {
          errors.push(`Employee ${employee.employee_number}: ${employeeError.message}`)
        }
      }

      // Update pay run status to COMPLETED if successful
      const finalStatus = errors.length === 0 ? 'COMPLETED' : 'DRAFT'
      const updateData: any = {
        status: finalStatus,
        total_employees: processedPaySlips.length
      }

      if (finalStatus === 'COMPLETED') {
        updateData.completed_at = new Date().toISOString()
        updateData.total_gross_pay = processedPaySlips.reduce((sum, slip) => sum + slip.gross_pay, 0)
        updateData.total_net_pay = processedPaySlips.reduce((sum, slip) => sum + slip.net_pay, 0)
      }

      await supabase
        .from('pay_runs')
        .update(updateData)
        .eq('id', id)

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: authResult.user.id,
        action: 'PROCESS_PAY_RUN',
        entity_type: 'pay_run',
        entity_id: id,
        details: {
          pay_run_number: payRun.pay_run_number,
          processed_employees: processedPaySlips.length,
          errors_count: errors.length,
          total_gross_pay: processedPaySlips.reduce((sum, slip) => sum + slip.gross_pay, 0)
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          processed_count: processedPaySlips.length,
          total_employees: employees.length,
          errors_count: errors.length,
          pay_slips: processedPaySlips,
          errors: errors,
          status: finalStatus
        },
        message: errors.length === 0
          ? 'Pay run processed successfully'
          : `Pay run processed with ${errors.length} errors`
      })

    } catch (processingError) {
      // Revert pay run status to DRAFT on error
      await supabase
        .from('pay_runs')
        .update({ status: 'DRAFT' })
        .eq('id', id)

      throw processingError
    }

  } catch (error) {
    console.error('Pay run processing error:', error)
    return NextResponse.json({
      error: `Pay run processing failed: ${error.message}`
    }, { status: 500 })
  }
}