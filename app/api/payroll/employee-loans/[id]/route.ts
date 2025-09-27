import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Update employee loan validation schema
const updateEmployeeLoanSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED']).optional(),
  interestRate: z.number().min(0).max(50).optional(),
  repaymentMonths: z.number().min(1).max(120).optional(),
  reason: z.string().min(5).max(500).optional(),
  guarantorInfo: z.string().optional(),
  approvalNotes: z.string().max(1000).optional(),
  paymentMade: z.number().min(0).optional()
})

// Function to recalculate loan installments
function calculateInstallments(amount: number, months: number, interestRate: number) {
  if (interestRate === 0) {
    return {
      monthlyInstallment: amount / months,
      totalAmount: amount,
      totalInterest: 0
    }
  }

  const monthlyRate = interestRate / 100 / 12
  const monthlyInstallment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                            (Math.pow(1 + monthlyRate, months) - 1)
  const totalAmount = monthlyInstallment * months
  const totalInterest = totalAmount - amount

  return {
    monthlyInstallment: Math.round(monthlyInstallment * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100
  }
}

// GET /api/payroll/employee-loans/[id] - Get single employee loan
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await params
    const supabase = await createClient()

    // Fetch loan with full details
    const { data: loan, error } = await supabase
      .from('employee_loans')
      .select(`
        *,
        employee:employees(
          id,
          employee_number,
          first_name,
          last_name,
          email,
          phone,
          hire_date,
          basic_salary,
          department:departments(id, name),
          designation:designations(id, title)
        ),
        created_by_user:users!employee_loans_created_by_fkey(first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Employee loan not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch employee loan' }, { status: 500 })
    }

    // Calculate loan status and remaining balance
    const startDate = new Date(loan.start_date)
    const today = new Date()

    const monthsElapsed = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
    const remainingMonths = Math.max(0, loan.repayment_months - monthsElapsed)
    const remainingBalance = Math.max(0, loan.total_amount - (loan.amount_paid || 0))

    const loanInfo = {
      ...loan,
      months_elapsed: monthsElapsed,
      remaining_months: remainingMonths,
      remaining_balance: remainingBalance,
      payment_progress: loan.total_amount > 0 ? ((loan.amount_paid || 0) / loan.total_amount * 100) : 0,
      is_overdue: loan.status === 'DISBURSED' && monthsElapsed > loan.repayment_months && remainingBalance > 0
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'VIEW_EMPLOYEE_LOAN',
      entity_type: 'employee_loan',
      entity_id: id,
      details: {
        loan_number: loan.loan_number,
        employee_name: `${loan.employee.first_name} ${loan.employee.last_name}`
      }
    })

    return NextResponse.json({
      success: true,
      data: loanInfo
    })

  } catch (error) {
    console.error('Employee loan fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/payroll/employee-loans/[id] - Update employee loan
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await params
    const body = await request.json()
    const validation = updateEmployeeLoanSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const updateData = validation.data
    const supabase = await createClient()

    // Check if loan exists
    const { data: existingLoan, error: fetchError } = await supabase
      .from('employee_loans')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Employee loan not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch employee loan' }, { status: 500 })
    }

    // Build update object
    const loanUpdateData: any = {}

    if (updateData.status !== undefined) {
      loanUpdateData.status = updateData.status

      // Auto-set disbursement date when approving
      if (updateData.status === 'DISBURSED' && !existingLoan.disbursed_at) {
        loanUpdateData.disbursed_at = new Date().toISOString()
      }

      // Auto-set closure date when closing
      if (updateData.status === 'CLOSED' && !existingLoan.closed_at) {
        loanUpdateData.closed_at = new Date().toISOString()
      }
    }

    if (updateData.approvalNotes !== undefined) {
      loanUpdateData.approval_notes = updateData.approvalNotes
    }

    // Handle payment update
    if (updateData.paymentMade !== undefined) {
      const newAmountPaid = (existingLoan.amount_paid || 0) + updateData.paymentMade
      loanUpdateData.amount_paid = Math.min(newAmountPaid, existingLoan.total_amount)

      // Auto-close loan if fully paid
      if (loanUpdateData.amount_paid >= existingLoan.total_amount) {
        loanUpdateData.status = 'CLOSED'
        loanUpdateData.closed_at = new Date().toISOString()
      }
    }

    // Recalculate installments if terms changed
    if (updateData.interestRate !== undefined || updateData.repaymentMonths !== undefined) {
      const newInterestRate = updateData.interestRate !== undefined ? updateData.interestRate : existingLoan.interest_rate
      const newRepaymentMonths = updateData.repaymentMonths !== undefined ? updateData.repaymentMonths : existingLoan.repayment_months

      const calculations = calculateInstallments(existingLoan.loan_amount, newRepaymentMonths, newInterestRate)

      loanUpdateData.interest_rate = newInterestRate
      loanUpdateData.repayment_months = newRepaymentMonths
      loanUpdateData.monthly_installment = calculations.monthlyInstallment
      loanUpdateData.total_amount = calculations.totalAmount
    }

    if (updateData.reason !== undefined) loanUpdateData.reason = updateData.reason
    if (updateData.guarantorInfo !== undefined) loanUpdateData.guarantor_info = updateData.guarantorInfo

    if (Object.keys(loanUpdateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update loan
    const { data: updatedLoan, error: updateError } = await supabase
      .from('employee_loans')
      .update(loanUpdateData)
      .eq('id', id)
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
        created_by_user:users!employee_loans_created_by_fkey(first_name, last_name)
      `)
      .single()

    if (updateError) {
      console.error('Loan update error:', updateError)
      return NextResponse.json({ error: 'Failed to update employee loan' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'UPDATE_EMPLOYEE_LOAN',
      entity_type: 'employee_loan',
      entity_id: id,
      details: {
        loan_number: existingLoan.loan_number,
        updated_fields: Object.keys(loanUpdateData),
        previous_status: existingLoan.status,
        new_status: updateData.status || existingLoan.status,
        payment_made: updateData.paymentMade
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedLoan,
      message: 'Employee loan updated successfully'
    })

  } catch (error) {
    console.error('Employee loan update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payroll/employee-loans/[id] - Delete employee loan
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await params
    const supabase = await createClient()

    // Check if loan exists
    const { data: existingLoan, error: fetchError } = await supabase
      .from('employee_loans')
      .select(`
        id,
        loan_number,
        employee_id,
        status,
        amount_paid,
        employee:employees(first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Employee loan not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch employee loan' }, { status: 500 })
    }

    // Prevent deletion of disbursed loans with payments
    if (existingLoan.status === 'DISBURSED' && (existingLoan.amount_paid || 0) > 0) {
      return NextResponse.json({
        error: 'Cannot delete loan with payments made. Consider closing the loan instead.'
      }, { status: 400 })
    }

    // Delete loan
    const { error: deleteError } = await supabase
      .from('employee_loans')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Loan deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete employee loan' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'DELETE_EMPLOYEE_LOAN',
      entity_type: 'employee_loan',
      entity_id: id,
      details: {
        loan_number: existingLoan.loan_number,
        employee_name: `${(existingLoan.employee as any).first_name} ${(existingLoan.employee as any).last_name}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Employee loan deleted successfully'
    })

  } catch (error) {
    console.error('Employee loan deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}