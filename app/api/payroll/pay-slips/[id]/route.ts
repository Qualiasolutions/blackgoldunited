import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update pay slip validation schema
const updatePaySlipSchema = z.object({
  status: z.enum(['DRAFT', 'PROCESSED', 'APPROVED', 'PAID']).optional(),
  workingDays: z.number().min(1).max(31).optional(),
  earnings: z.array(z.object({
    component_id: z.string().uuid().nullable(),
    component_name: z.string(),
    calculation_type: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
    amount: z.number()
  })).optional(),
  deductions: z.array(z.object({
    component_id: z.string().uuid().nullable(),
    component_name: z.string(),
    calculation_type: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
    amount: z.number()
  })).optional(),
  approvalNotes: z.string().max(1000).optional()
})

// GET /api/payroll/pay-slips/[id] - Get single pay slip
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = params
    const supabase = await createClient()

    // Fetch pay slip with full details
    const { data: paySlip, error } = await supabase
      .from('pay_slips')
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
          department:departments(id, name),
          designation:designations(id, title)
        ),
        pay_run:pay_runs(
          id,
          pay_run_number,
          pay_date,
          pay_period_start,
          pay_period_end,
          status
        ),
        created_by_user:users!pay_slips_created_by_fkey(first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pay slip not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch pay slip' }, { status: 500 })
    }

    // Calculate additional information
    const payPeriodStart = new Date(paySlip.pay_period_start)
    const payPeriodEnd = new Date(paySlip.pay_period_end)
    const payDate = paySlip.pay_run?.pay_date ? new Date(paySlip.pay_run.pay_date) : null
    const today = new Date()

    // Group earnings and deductions by type
    const earningsBreakdown = {
      basic: paySlip.earnings?.filter(e => e.component_name.toLowerCase().includes('basic')) || [],
      allowances: paySlip.earnings?.filter(e => !e.component_name.toLowerCase().includes('basic') && !e.component_name.toLowerCase().includes('overtime')) || [],
      overtime: paySlip.earnings?.filter(e => e.component_name.toLowerCase().includes('overtime')) || []
    }

    const deductionsBreakdown = {
      tax: paySlip.deductions?.filter(d => d.component_name.toLowerCase().includes('tax')) || [],
      loans: paySlip.deductions?.filter(d => d.component_name.toLowerCase().includes('loan')) || [],
      others: paySlip.deductions?.filter(d => !d.component_name.toLowerCase().includes('tax') && !d.component_name.toLowerCase().includes('loan')) || []
    }

    const paySlipInfo = {
      ...paySlip,
      pay_period_days: Math.ceil((payPeriodEnd.getTime() - payPeriodStart.getTime()) / (1000 * 60 * 60 * 24)),
      days_until_pay: payDate ? Math.ceil((payDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null,
      is_current_month: payPeriodStart.getMonth() === today.getMonth() && payPeriodStart.getFullYear() === today.getFullYear(),
      earnings_breakdown: earningsBreakdown,
      deductions_breakdown: deductionsBreakdown,
      can_edit: paySlip.status === 'DRAFT' || paySlip.status === 'PROCESSED',
      can_approve: paySlip.status === 'PROCESSED'
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'VIEW_PAY_SLIP',
      entity_type: 'pay_slip',
      entity_id: id,
      details: {
        employee_name: `${paySlip.employee.first_name} ${paySlip.employee.last_name}`,
        pay_period: `${paySlip.pay_period_start} to ${paySlip.pay_period_end}`
      }
    })

    return NextResponse.json({
      success: true,
      data: paySlipInfo
    })

  } catch (error) {
    console.error('Pay slip fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/payroll/pay-slips/[id] - Update pay slip
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = params
    const body = await request.json()
    const validation = updatePaySlipSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const updateData = validation.data
    const supabase = await createClient()

    // Check if pay slip exists
    const { data: existingPaySlip, error: fetchError } = await supabase
      .from('pay_slips')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pay slip not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch pay slip' }, { status: 500 })
    }

    // Prevent editing of paid pay slips
    if (existingPaySlip.status === 'PAID') {
      return NextResponse.json({
        error: 'Cannot edit pay slip that has already been paid'
      }, { status: 400 })
    }

    // Build update object
    const paySlipUpdateData: any = {}

    if (updateData.status !== undefined) {
      paySlipUpdateData.status = updateData.status

      // Auto-set approval timestamp when approving
      if (updateData.status === 'APPROVED' && !existingPaySlip.approved_at) {
        paySlipUpdateData.approved_at = new Date().toISOString()
        paySlipUpdateData.approved_by = authResult.user.id
      }

      // Auto-set payment timestamp when marking as paid
      if (updateData.status === 'PAID' && !existingPaySlip.paid_at) {
        paySlipUpdateData.paid_at = new Date().toISOString()
      }
    }

    if (updateData.workingDays !== undefined) {
      paySlipUpdateData.working_days = updateData.workingDays
    }

    if (updateData.approvalNotes !== undefined) {
      paySlipUpdateData.approval_notes = updateData.approvalNotes
    }

    // Recalculate totals if earnings or deductions changed
    if (updateData.earnings !== undefined || updateData.deductions !== undefined) {
      const newEarnings = updateData.earnings !== undefined ? updateData.earnings : existingPaySlip.earnings
      const newDeductions = updateData.deductions !== undefined ? updateData.deductions : existingPaySlip.deductions

      const grossPay = newEarnings.reduce((sum: number, earning: any) => sum + earning.amount, 0)
      const totalDeductions = newDeductions.reduce((sum: number, deduction: any) => sum + deduction.amount, 0)
      const netPay = grossPay - totalDeductions

      if (netPay < 0) {
        return NextResponse.json({
          error: 'Net pay cannot be negative. Please review deductions.'
        }, { status: 400 })
      }

      paySlipUpdateData.earnings = newEarnings
      paySlipUpdateData.deductions = newDeductions
      paySlipUpdateData.gross_pay = grossPay
      paySlipUpdateData.total_deductions = totalDeductions
      paySlipUpdateData.net_pay = netPay
    }

    if (Object.keys(paySlipUpdateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update pay slip
    const { data: updatedPaySlip, error: updateError } = await supabase
      .from('pay_slips')
      .update(paySlipUpdateData)
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
        pay_run:pay_runs(
          id,
          pay_run_number,
          pay_date,
          status
        ),
        created_by_user:users!pay_slips_created_by_fkey(first_name, last_name)
      `)
      .single()

    if (updateError) {
      console.error('Pay slip update error:', updateError)
      return NextResponse.json({ error: 'Failed to update pay slip' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'UPDATE_PAY_SLIP',
      entity_type: 'pay_slip',
      entity_id: id,
      details: {
        employee_name: `${existingPaySlip.employee?.first_name} ${existingPaySlip.employee?.last_name}`,
        updated_fields: Object.keys(paySlipUpdateData),
        previous_status: existingPaySlip.status,
        new_status: updateData.status || existingPaySlip.status
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedPaySlip,
      message: 'Pay slip updated successfully'
    })

  } catch (error) {
    console.error('Pay slip update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payroll/pay-slips/[id] - Delete pay slip
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = params
    const supabase = await createClient()

    // Check if pay slip exists
    const { data: existingPaySlip, error: fetchError } = await supabase
      .from('pay_slips')
      .select(`
        id,
        status,
        employee:employees(first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pay slip not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch pay slip' }, { status: 500 })
    }

    // Prevent deletion of processed pay slips
    if (['APPROVED', 'PAID'].includes(existingPaySlip.status)) {
      return NextResponse.json({
        error: 'Cannot delete pay slip that has been approved or paid'
      }, { status: 400 })
    }

    // Delete pay slip
    const { error: deleteError } = await supabase
      .from('pay_slips')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Pay slip deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete pay slip' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'DELETE_PAY_SLIP',
      entity_type: 'pay_slip',
      entity_id: id,
      details: {
        employee_name: `${existingPaySlip.employee.first_name} ${existingPaySlip.employee.last_name}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Pay slip deleted successfully'
    })

  } catch (error) {
    console.error('Pay slip deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}