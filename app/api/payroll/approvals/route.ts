import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Approval action validation schema
const approvalActionSchema = z.object({
  entityType: z.enum(['pay_run', 'pay_slip', 'overtime_record', 'employee_loan']),
  entityId: z.string().uuid('Invalid entity ID'),
  action: z.enum(['approve', 'reject']),
  notes: z.string().max(1000).optional()
})

// GET /api/payroll/approvals - Get pending approvals
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
    const entityType = searchParams.get('entityType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const pendingApprovals: any[] = []

    // Get pending pay runs
    if (!entityType || entityType === 'pay_run') {
      const { data: payRuns } = await supabase
        .from('pay_runs')
        .select(`
          id,
          pay_run_number,
          pay_period_start,
          pay_period_end,
          pay_date,
          total_employees,
          total_gross_pay,
          total_net_pay,
          created_at,
          created_by_user:users!pay_runs_created_by_fkey(first_name, last_name)
        `)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false })

      if (payRuns) {
        payRuns.forEach(payRun => {
          pendingApprovals.push({
            entity_type: 'pay_run',
            entity_id: payRun.id,
            title: `Pay Run: ${payRun.pay_run_number}`,
            description: `Pay period: ${payRun.pay_period_start} to ${payRun.pay_period_end}`,
            amount: payRun.total_net_pay,
            employee_count: payRun.total_employees,
            created_at: payRun.created_at,
            created_by: payRun.created_by_user,
            priority: 'high',
            due_date: payRun.pay_date
          })
        })
      }
    }

    // Get pending pay slips (individual approvals)
    if (!entityType || entityType === 'pay_slip') {
      const { data: paySlips } = await supabase
        .from('pay_slips')
        .select(`
          id,
          net_pay,
          pay_period_start,
          pay_period_end,
          created_at,
          employee:employees(first_name, last_name, employee_number),
          created_by_user:users!pay_slips_created_by_fkey(first_name, last_name)
        `)
        .eq('status', 'PROCESSED')
        .is('pay_run_id', null) // Individual pay slips only
        .order('created_at', { ascending: false })

      if (paySlips) {
        paySlips.forEach(paySlip => {
          pendingApprovals.push({
            entity_type: 'pay_slip',
            entity_id: paySlip.id,
            title: `Pay Slip: ${(paySlip.employee as any).first_name} ${(paySlip.employee as any).last_name}`,
            description: `Employee: ${(paySlip.employee as any).employee_number} | Period: ${paySlip.pay_period_start} to ${paySlip.pay_period_end}`,
            amount: paySlip.net_pay,
            employee_count: 1,
            created_at: paySlip.created_at,
            created_by: paySlip.created_by_user,
            priority: 'medium',
            due_date: null
          })
        })
      }
    }

    // Get pending overtime records
    if (!entityType || entityType === 'overtime_record') {
      const { data: overtimeRecords } = await supabase
        .from('overtime_records')
        .select(`
          id,
          work_date,
          overtime_hours,
          overtime_pay,
          overtime_type,
          created_at,
          employee:employees(first_name, last_name, employee_number),
          created_by_user:users!overtime_records_created_by_fkey(first_name, last_name)
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (overtimeRecords) {
        overtimeRecords.forEach(record => {
          pendingApprovals.push({
            entity_type: 'overtime_record',
            entity_id: record.id,
            title: `Overtime: ${(record.employee as any).first_name} ${(record.employee as any).last_name}`,
            description: `${record.overtime_hours} hours on ${record.work_date} (${record.overtime_type})`,
            amount: record.overtime_pay,
            employee_count: 1,
            created_at: record.created_at,
            created_by: record.created_by_user,
            priority: 'low',
            due_date: null
          })
        })
      }
    }

    // Get pending employee loans
    if (!entityType || entityType === 'employee_loan') {
      const { data: loans } = await supabase
        .from('employee_loans')
        .select(`
          id,
          loan_number,
          loan_amount,
          loan_type,
          created_at,
          employee:employees(first_name, last_name, employee_number),
          created_by_user:users!employee_loans_created_by_fkey(first_name, last_name)
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (loans) {
        loans.forEach(loan => {
          pendingApprovals.push({
            entity_type: 'employee_loan',
            entity_id: loan.id,
            title: `Loan: ${loan.loan_number}`,
            description: `${(loan.employee as any).first_name} ${(loan.employee as any).last_name} (${(loan.employee as any).employee_number}) - ${loan.loan_type}`,
            amount: loan.loan_amount,
            employee_count: 1,
            created_at: loan.created_at,
            created_by: loan.created_by_user,
            priority: 'medium',
            due_date: null
          })
        })
      }
    }

    // Sort by priority and creation date
    const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 }
    pendingApprovals.sort((a: any, b: any) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Apply pagination
    const paginatedApprovals = pendingApprovals.slice(offset, offset + limit)
    const totalCount = pendingApprovals.length
    const totalPages = Math.ceil(totalCount / limit)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'VIEW_PENDING_APPROVALS',
      entity_type: 'approval',
      details: {
        entity_type: entityType,
        total_pending: totalCount,
        page,
        limit
      }
    })

    return NextResponse.json({
      success: true,
      data: paginatedApprovals,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      },
      summary: {
        total_pending: totalCount,
        pay_runs: pendingApprovals.filter(a => a.entity_type === 'pay_run').length,
        pay_slips: pendingApprovals.filter(a => a.entity_type === 'pay_slip').length,
        overtime_records: pendingApprovals.filter(a => a.entity_type === 'overtime_record').length,
        employee_loans: pendingApprovals.filter(a => a.entity_type === 'employee_loan').length
      }
    })

  } catch (error) {
    console.error('Pending approvals fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payroll/approvals - Process approval action
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - payroll module access required
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = approvalActionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { entityType, entityId, action, notes } = validation.data
    const supabase = await createClient()

    let updateData: any = {}
    let tableName: string
    let entityInfo: any = {}

    // Determine update data based on entity type and action
    switch (entityType) {
      case 'pay_run':
        tableName = 'pay_runs'
        updateData = {
          status: action === 'approve' ? 'APPROVED' : 'DRAFT',
          approved_at: action === 'approve' ? new Date().toISOString() : null,
          approved_by: action === 'approve' ? authResult.user.id : null,
          approval_notes: notes || null
        }
        break

      case 'pay_slip':
        tableName = 'pay_slips'
        updateData = {
          status: action === 'approve' ? 'APPROVED' : 'DRAFT',
          approved_at: action === 'approve' ? new Date().toISOString() : null,
          approved_by: action === 'approve' ? authResult.user.id : null,
          approval_notes: notes || null
        }
        break

      case 'overtime_record':
        tableName = 'overtime_records'
        updateData = {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          approved_at: action === 'approve' ? new Date().toISOString() : null,
          approved_by: authResult.user.id,
          approval_notes: notes || null
        }
        break

      case 'employee_loan':
        tableName = 'employee_loans'
        updateData = {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          approved_at: action === 'approve' ? new Date().toISOString() : null,
          approved_by: authResult.user.id,
          approval_notes: notes || null
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    // Check if entity exists and is in correct status for approval
    const { data: existingEntity, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', entityId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: `${entityType} not found` }, { status: 404 })
      }
      return NextResponse.json({ error: `Failed to fetch ${entityType}` }, { status: 500 })
    }

    // Validate current status allows approval/rejection
    const validStatuses = {
      pay_run: ['COMPLETED'],
      pay_slip: ['PROCESSED'],
      overtime_record: ['PENDING'],
      employee_loan: ['PENDING']
    }

    if (!validStatuses[entityType].includes(existingEntity.status)) {
      return NextResponse.json({
        error: `Cannot ${action} ${entityType} with status: ${existingEntity.status}`
      }, { status: 400 })
    }

    // Update entity
    const { data: updatedEntity, error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', entityId)
      .select()
      .single()

    if (updateError) {
      console.error(`${entityType} ${action} error:`, updateError)
      return NextResponse.json({ error: `Failed to ${action} ${entityType}` }, { status: 500 })
    }

    // For pay run approvals, also update all related pay slips
    if (entityType === 'pay_run' && action === 'approve') {
      await supabase
        .from('pay_slips')
        .update({
          status: 'APPROVED',
          approved_at: new Date().toISOString(),
          approved_by: authResult.user.id
        })
        .eq('pay_run_id', entityId)
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: `${action.toUpperCase()}_${entityType.toUpperCase()}`,
      entity_type: entityType,
      entity_id: entityId,
      details: {
        action: action,
        notes: notes,
        previous_status: existingEntity.status,
        new_status: updateData.status
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedEntity,
      message: `${entityType} ${action}d successfully`
    })

  } catch (error) {
    console.error('Approval action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}