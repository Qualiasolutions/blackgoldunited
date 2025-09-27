import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Update pay run validation schema
const updatePayRunSchema = z.object({
  payDate: z.string().optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'PROCESSING', 'COMPLETED', 'APPROVED', 'PAID']).optional(),
  approvedBy: z.string().uuid().optional()
})

// GET /api/payroll/pay-runs/[id] - Get single pay run
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

    // Fetch pay run with full details
    const { data: payRun, error } = await supabase
      .from('pay_runs')
      .select(`
        *,
        created_by_user:users!pay_runs_created_by_fkey(first_name, last_name),
        approved_by_user:users!pay_runs_approved_by_fkey(first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pay run not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch pay run' }, { status: 500 })
    }

    // Get pay slips for this pay run
    const { data: paySlips, error: paySlipsError } = await supabase
      .from('pay_slips')
      .select(`
        id,
        employee_id,
        gross_pay,
        total_deductions,
        net_pay,
        status,
        employee:employees(
          id,
          employee_number,
          first_name,
          last_name,
          department:departments(id, name)
        )
      `)
      .eq('pay_run_id', id)

    if (paySlipsError) {
      console.error('Pay slips fetch error:', paySlipsError)
    }

    // Calculate summary statistics
    const paySlipsSummary = {
      total_employees: paySlips?.length || 0,
      total_gross_pay: paySlips?.reduce((sum, slip) => sum + (slip.gross_pay || 0), 0) || 0,
      total_deductions: paySlips?.reduce((sum, slip) => sum + (slip.total_deductions || 0), 0) || 0,
      total_net_pay: paySlips?.reduce((sum, slip) => sum + (slip.net_pay || 0), 0) || 0,
      processed_count: paySlips?.filter(slip => slip.status === 'PROCESSED').length || 0,
      pending_count: paySlips?.filter(slip => slip.status === 'DRAFT').length || 0
    }

    // Calculate additional info
    const payPeriodStart = new Date(payRun.pay_period_start)
    const payPeriodEnd = new Date(payRun.pay_period_end)
    const payDate = new Date(payRun.pay_date)
    const today = new Date()

    const payRunInfo = {
      ...payRun,
      pay_slips: paySlips || [],
      summary: paySlipsSummary,
      pay_period_days: Math.ceil((payPeriodEnd.getTime() - payPeriodStart.getTime()) / (1000 * 60 * 60 * 24)),
      days_until_pay: Math.ceil((payDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      is_overdue: payDate < today && payRun.status !== 'PAID',
      can_process: payRun.status === 'DRAFT',
      can_approve: payRun.status === 'COMPLETED',
      can_pay: payRun.status === 'APPROVED'
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'VIEW_PAY_RUN',
      entity_type: 'pay_run',
      entity_id: id,
      details: {
        pay_run_number: payRun.pay_run_number,
        employee_count: paySlipsSummary.total_employees
      }
    })

    return NextResponse.json({
      success: true,
      data: payRunInfo
    })

  } catch (error) {
    console.error('Pay run fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/payroll/pay-runs/[id] - Update pay run
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
    const validation = updatePayRunSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const updateData = validation.data
    const supabase = await createClient()

    // Check if pay run exists
    const { data: existingPayRun, error: fetchError } = await supabase
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

    // Prevent editing of paid pay runs
    if (existingPayRun.status === 'PAID') {
      return NextResponse.json({
        error: 'Cannot edit pay run that has already been paid'
      }, { status: 400 })
    }

    // Verify approver exists if provided
    if (updateData.approvedBy) {
      const { data: approver, error: approverError } = await supabase
        .from('users')
        .select('id')
        .eq('id', updateData.approvedBy)
        .single()

      if (approverError || !approver) {
        return NextResponse.json({ error: 'Approver not found' }, { status: 404 })
      }
    }

    // Build update object
    const payRunUpdateData: any = {}

    if (updateData.payDate !== undefined) {
      const payDate = new Date(updateData.payDate)
      const payPeriodEnd = new Date(existingPayRun.pay_period_end)

      if (payDate < payPeriodEnd) {
        return NextResponse.json({
          error: 'Pay date must be after or equal to pay period end date'
        }, { status: 400 })
      }

      payRunUpdateData.pay_date = updateData.payDate
    }

    if (updateData.description !== undefined) {
      payRunUpdateData.description = updateData.description
    }

    if (updateData.status !== undefined) {
      payRunUpdateData.status = updateData.status

      // Auto-set approval timestamp when approving
      if (updateData.status === 'APPROVED' && !existingPayRun.approved_at) {
        payRunUpdateData.approved_at = new Date().toISOString()
        payRunUpdateData.approved_by = updateData.approvedBy || authResult.user.id
      }

      // Auto-set completion timestamp when completing
      if (updateData.status === 'COMPLETED' && !existingPayRun.completed_at) {
        payRunUpdateData.completed_at = new Date().toISOString()
      }

      // Auto-set payment timestamp when marking as paid
      if (updateData.status === 'PAID' && !existingPayRun.paid_at) {
        payRunUpdateData.paid_at = new Date().toISOString()
      }
    }

    if (updateData.approvedBy !== undefined) {
      payRunUpdateData.approved_by = updateData.approvedBy
    }

    if (Object.keys(payRunUpdateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update pay run
    const { data: updatedPayRun, error: updateError } = await supabase
      .from('pay_runs')
      .update(payRunUpdateData)
      .eq('id', id)
      .select(`
        *,
        created_by_user:users!pay_runs_created_by_fkey(first_name, last_name),
        approved_by_user:users!pay_runs_approved_by_fkey(first_name, last_name)
      `)
      .single()

    if (updateError) {
      console.error('Pay run update error:', updateError)
      return NextResponse.json({ error: 'Failed to update pay run' }, { status: 500 })
    }

    // Update related pay slips status if pay run status changed
    if (updateData.status && updateData.status !== existingPayRun.status) {
      const paySlipStatus = updateData.status === 'PAID' ? 'PAID' :
                           updateData.status === 'APPROVED' ? 'APPROVED' : 'DRAFT'

      await supabase
        .from('pay_slips')
        .update({ status: paySlipStatus })
        .eq('pay_run_id', id)
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'UPDATE_PAY_RUN',
      entity_type: 'pay_run',
      entity_id: id,
      details: {
        pay_run_number: existingPayRun.pay_run_number,
        updated_fields: Object.keys(payRunUpdateData),
        previous_status: existingPayRun.status,
        new_status: updateData.status || existingPayRun.status
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedPayRun,
      message: 'Pay run updated successfully'
    })

  } catch (error) {
    console.error('Pay run update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payroll/pay-runs/[id] - Delete pay run
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

    // Check if pay run exists
    const { data: existingPayRun, error: fetchError } = await supabase
      .from('pay_runs')
      .select('id, pay_run_number, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pay run not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch pay run' }, { status: 500 })
    }

    // Prevent deletion of processed pay runs
    if (['COMPLETED', 'APPROVED', 'PAID'].includes(existingPayRun.status)) {
      return NextResponse.json({
        error: 'Cannot delete pay run that has been processed. Only draft pay runs can be deleted.'
      }, { status: 400 })
    }

    // Check if there are any pay slips
    const { count: paySlipCount } = await supabase
      .from('pay_slips')
      .select('*', { count: 'exact', head: true })
      .eq('pay_run_id', id)

    if (paySlipCount && paySlipCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete pay run with existing pay slips. Delete pay slips first.'
      }, { status: 400 })
    }

    // Delete pay run
    const { error: deleteError } = await supabase
      .from('pay_runs')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Pay run deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete pay run' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'DELETE_PAY_RUN',
      entity_type: 'pay_run',
      entity_id: id,
      details: {
        pay_run_number: existingPayRun.pay_run_number
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Pay run deleted successfully'
    })

  } catch (error) {
    console.error('Pay run deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}