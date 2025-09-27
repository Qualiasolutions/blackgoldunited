import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update overtime validation schema
const updateOvertimeSchema = z.object({
  overtimeHours: z.number().min(0.5).max(24).optional(),
  overtimeType: z.enum(['REGULAR', 'WEEKEND', 'HOLIDAY', 'NIGHT_SHIFT']).optional(),
  description: z.string().min(5).max(500).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).optional(),
  approvedBy: z.string().uuid().optional(),
  approvalNotes: z.string().max(1000).optional()
})

// Function to calculate overtime rate based on type
function calculateOvertimeRate(overtimeType: string, basicHourlyRate: number): number {
  const rateMultipliers = {
    'REGULAR': 1.5,      // 150% of basic rate
    'WEEKEND': 2.0,      // 200% of basic rate
    'HOLIDAY': 2.5,      // 250% of basic rate
    'NIGHT_SHIFT': 1.75  // 175% of basic rate
  }

  return basicHourlyRate * (rateMultipliers[overtimeType as keyof typeof rateMultipliers] || 1.5)
}

// GET /api/payroll/overtime/[id] - Get single overtime record
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

    // Fetch overtime record with full details
    const { data: overtimeRecord, error } = await supabase
      .from('overtime_records')
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
        approved_by_user:users!overtime_records_approved_by_fkey(first_name, last_name),
        created_by_user:users!overtime_records_created_by_fkey(first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Overtime record not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch overtime record' }, { status: 500 })
    }

    // Calculate additional info
    const workDate = new Date(overtimeRecord.work_date)
    const today = new Date()
    const daysAgo = Math.floor((today.getTime() - workDate.getTime()) / (1000 * 60 * 60 * 24))

    const recordInfo = {
      ...overtimeRecord,
      days_ago: daysAgo,
      is_recent: daysAgo <= 7,
      can_edit: overtimeRecord.status === 'PENDING' && daysAgo <= 30
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'VIEW_OVERTIME_RECORD',
      entity_type: 'overtime_record',
      entity_id: id,
      details: {
        employee_name: `${overtimeRecord.employee.first_name} ${overtimeRecord.employee.last_name}`,
        work_date: overtimeRecord.work_date
      }
    })

    return NextResponse.json({
      success: true,
      data: recordInfo
    })

  } catch (error) {
    console.error('Overtime record fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/payroll/overtime/[id] - Update overtime record
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
    const validation = updateOvertimeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const updateData = validation.data
    const supabase = await createClient()

    // Check if overtime record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('overtime_records')
      .select(`
        *,
        employee:employees(basic_salary)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Overtime record not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch overtime record' }, { status: 500 })
    }

    // Prevent editing of paid overtime
    if (existingRecord.status === 'PAID') {
      return NextResponse.json({
        error: 'Cannot edit overtime record that has already been paid'
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
    const recordUpdateData: any = {}

    if (updateData.overtimeHours !== undefined) {
      recordUpdateData.overtime_hours = updateData.overtimeHours
    }

    if (updateData.overtimeType !== undefined) {
      recordUpdateData.overtime_type = updateData.overtimeType
    }

    if (updateData.description !== undefined) {
      recordUpdateData.description = updateData.description
    }

    if (updateData.status !== undefined) {
      recordUpdateData.status = updateData.status

      // Auto-set approval timestamp when approving
      if (updateData.status === 'APPROVED' && !existingRecord.approved_at) {
        recordUpdateData.approved_at = new Date().toISOString()
        recordUpdateData.approved_by = updateData.approvedBy || authResult.user.id
      }
    }

    if (updateData.approvedBy !== undefined) {
      recordUpdateData.approved_by = updateData.approvedBy
    }

    if (updateData.approvalNotes !== undefined) {
      recordUpdateData.approval_notes = updateData.approvalNotes
    }

    // Recalculate overtime pay if hours or type changed
    if (updateData.overtimeHours !== undefined || updateData.overtimeType !== undefined) {
      const newHours = updateData.overtimeHours !== undefined ? updateData.overtimeHours : existingRecord.overtime_hours
      const newType = updateData.overtimeType !== undefined ? updateData.overtimeType : existingRecord.overtime_type

      // Get current hourly rate or recalculate
      const basicHourlyRate = existingRecord.hourly_rate || (existingRecord.employee.basic_salary / (40 * 4.33))
      const newOvertimeRate = calculateOvertimeRate(newType, basicHourlyRate)
      const newOvertimePay = newHours * newOvertimeRate

      recordUpdateData.hourly_rate = basicHourlyRate
      recordUpdateData.overtime_rate = newOvertimeRate
      recordUpdateData.overtime_pay = newOvertimePay
    }

    if (Object.keys(recordUpdateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update overtime record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('overtime_records')
      .update(recordUpdateData)
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
        approved_by_user:users!overtime_records_approved_by_fkey(first_name, last_name),
        created_by_user:users!overtime_records_created_by_fkey(first_name, last_name)
      `)
      .single()

    if (updateError) {
      console.error('Overtime record update error:', updateError)
      return NextResponse.json({ error: 'Failed to update overtime record' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'UPDATE_OVERTIME_RECORD',
      entity_type: 'overtime_record',
      entity_id: id,
      details: {
        employee_name: `${existingRecord.employee.first_name} ${existingRecord.employee.last_name}`,
        updated_fields: Object.keys(recordUpdateData),
        previous_status: existingRecord.status,
        new_status: updateData.status || existingRecord.status
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: 'Overtime record updated successfully'
    })

  } catch (error) {
    console.error('Overtime record update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payroll/overtime/[id] - Delete overtime record
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

    // Check if overtime record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('overtime_records')
      .select(`
        id,
        work_date,
        status,
        employee:employees(first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Overtime record not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch overtime record' }, { status: 500 })
    }

    // Prevent deletion of paid overtime
    if (existingRecord.status === 'PAID') {
      return NextResponse.json({
        error: 'Cannot delete overtime record that has already been paid'
      }, { status: 400 })
    }

    // Delete overtime record
    const { error: deleteError } = await supabase
      .from('overtime_records')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Overtime record deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete overtime record' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'DELETE_OVERTIME_RECORD',
      entity_type: 'overtime_record',
      entity_id: id,
      details: {
        employee_name: `${existingRecord.employee.first_name} ${existingRecord.employee.last_name}`,
        work_date: existingRecord.work_date
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Overtime record deleted successfully'
    })

  } catch (error) {
    console.error('Overtime record deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}