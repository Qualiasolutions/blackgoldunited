import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/hr/attendance/stats - Get attendance statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'attendance', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]

    // Get total active employees
    const { count: totalEmployees } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      // Get attendance logs for the date range
    const { data: attendanceLogs, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch attendance stats' }, { status: 500 })
    }

    // Calculate today's stats
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = attendanceLogs?.filter(log => log.date === today) || []

    const presentToday = todayLogs.filter(log =>
      log.status === 'PRESENT' || log.status === 'present'
    ).length

    const absentToday = todayLogs.filter(log =>
      log.status === 'ABSENT' || log.status === 'absent'
    ).length

    const lateArrivals = todayLogs.filter(log =>
      log.status === 'LATE' || log.status === 'late'
    ).length

    // Calculate average hours
    let totalHours = 0
    let countWithHours = 0

    todayLogs.forEach(log => {
      if (log.check_in && log.check_out) {
        const checkIn = new Date(`${log.date}T${log.check_in}`)
        const checkOut = new Date(`${log.date}T${log.check_out}`)
        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)

        if (hours > 0 && hours < 24) {
          totalHours += hours
          countWithHours++
        }
      }
    })

    const avgHours = countWithHours > 0 ? totalHours / countWithHours : 0

    // Weekly attendance trend
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayLogs = attendanceLogs?.filter(log => log.date === dateStr) || []
      const present = dayLogs.filter(log =>
        log.status === 'PRESENT' || log.status === 'present'
      ).length
      const absent = dayLogs.filter(log =>
        log.status === 'ABSENT' || log.status === 'absent'
      ).length

      last7Days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        date: dateStr,
        present,
        absent,
        rate: totalEmployees ? Math.round((present / (totalEmployees || 1)) * 100) : 0
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees: totalEmployees || 0,
        presentToday,
        absentToday,
        lateArrivals,
        attendanceRate: totalEmployees ? Math.round((presentToday / (totalEmployees || 1)) * 100) : 0,
        avgHours: Math.round(avgHours * 10) / 10,
        weeklyTrend: last7Days
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}