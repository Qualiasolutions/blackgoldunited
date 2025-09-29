import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/hr/attendance/leave-requests - Get leave requests
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'attendance', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)

    let query = supabase
      .from('leave_applications')
      .select(`
        id,
        employee_id,
        leave_type_id,
        start_date,
        end_date,
        total_days,
        reason,
        status,
        applied_by,
        approved_by,
        approved_at,
        comments,
        created_at,
        updated_at,
        employee:employees!leave_applications_employee_id_fkey(
          id,
          first_name,
          last_name,
          employee_number
        ),
        leave_type:leave_types(
          id,
          type_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status.toUpperCase())
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 })
    }

    const formattedData = data?.map((item: any) => ({
      id: item.id,
      name: `${item.employee?.first_name || ''} ${item.employee?.last_name || ''}`.trim(),
      employeeNumber: item.employee?.employee_number,
      type: item.leave_type?.type_name || 'Unknown',
      startDate: item.start_date,
      endDate: item.end_date,
      totalDays: item.total_days,
      dates: item.start_date === item.end_date
        ? new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `${new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(item.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      status: item.status,
      reason: item.reason,
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