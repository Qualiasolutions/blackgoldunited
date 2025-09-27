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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

