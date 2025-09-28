/**
 * Employee Reports API
 *
 * Provides comprehensive employee analytics including:
 * - Headcount and demographics
 * - Attendance and performance metrics
 * - Payroll and compensation analysis
 * - Turnover and retention insights
 *
 * @author BlackGoldUnited ERP Team
 * @version 1.0
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - Employee reports require HR access
    const authResult = await authenticateAndAuthorize(request, 'employees', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get current date for filtering
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Fetch Employee Data
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select(`
        id,
        first_name,
        last_name,
        email,
        hire_date,
        salary,
        is_active,
        department_id,
        designation_id,
        termination_date,
        departments (name),
        designations (title)
      `)

    if (employeeError) {
      console.error('Employee fetch error:', employeeError)
      return NextResponse.json({ error: 'Failed to fetch employee data' }, { status: 500 })
    }

    // Fetch Attendance Data for current month
    const { data: attendanceData } = await supabase
      .from('attendance_logs')
      .select('employee_id, date, status, total_hours')
      .gte('date', currentMonth.toISOString().split('T')[0])

    // Fetch Pay Slips for salary analysis
    const { data: paySlips } = await supabase
      .from('pay_slips')
      .select('employee_id, net_salary, created_at')
      .gte('created_at', previousMonth.toISOString())

    // Calculate Employee Statistics
    const totalEmployees = employees?.length || 0
    const activeEmployees = employees?.filter(emp => emp.is_active).length || 0

    // New hires this month
    const newHires = employees?.filter(emp =>
      new Date(emp.hire_date) >= currentMonth
    ).length || 0

    // Terminated employees this month
    const terminated = employees?.filter(emp =>
      emp.termination_date && new Date(emp.termination_date) >= currentMonth
    ).length || 0

    // Calculate turnover rate (terminated / average headcount * 100)
    const averageHeadcount = totalEmployees > 0 ? totalEmployees : 1
    const turnoverRate = ((terminated / averageHeadcount) * 100)

    // Calculate average salary
    const activeSalaries = employees?.filter(emp => emp.is_active && emp.salary)
      .map(emp => parseFloat(emp.salary?.toString() || '0')) || []
    const averageSalary = activeSalaries.length > 0 ?
      activeSalaries.reduce((sum, salary) => sum + salary, 0) / activeSalaries.length : 0

    // Calculate attendance rate
    const totalWorkingDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const totalPossibleAttendance = activeEmployees * totalWorkingDays
    const actualAttendance = attendanceData?.filter(log =>
      log.status === 'PRESENT' || log.status === 'LATE'
    ).length || 0
    const attendanceRate = totalPossibleAttendance > 0 ?
      (actualAttendance / totalPossibleAttendance) * 100 : 0

    // Department breakdown
    const departmentBreakdown = employees?.reduce((acc, emp) => {
      const dept = emp.departments as any
      if (dept?.name) {
        acc[dept.name] = (acc[dept.name] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    // Designation breakdown
    const designationBreakdown = employees?.reduce((acc, emp) => {
      const designation = emp.designations as any
      if (designation?.title) {
        acc[designation.title] = (acc[designation.title] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    // Calculate recent trends based on actual data
    const previousMonthAttendance = await supabase
      .from('attendance_logs')
      .select('id, status')
      .gte('date', previousMonth.toISOString().split('T')[0])
      .lt('date', currentMonth.toISOString().split('T')[0])

    const currentMonthAttendance = await supabase
      .from('attendance_logs')
      .select('id, status')
      .gte('date', currentMonth.toISOString().split('T')[0])

    const prevAttendanceRate = previousMonthAttendance.data?.length ?
      (previousMonthAttendance.data.filter(log => log.status === 'PRESENT').length / previousMonthAttendance.data.length) * 100 : 0

    const currentAttendanceRate = currentMonthAttendance.data?.length ?
      (currentMonthAttendance.data.filter(log => log.status === 'PRESENT').length / currentMonthAttendance.data.length) * 100 : 0

    const attendanceTrendValue = prevAttendanceRate > 0 ? currentAttendanceRate - prevAttendanceRate : 0

    const trends = {
      headcountGrowth: newHires > terminated ? '+' + (newHires - terminated) : (newHires - terminated).toString(),
      attendanceTrend: attendanceTrendValue >= 0 ? `+${attendanceTrendValue.toFixed(1)}%` : `${attendanceTrendValue.toFixed(1)}%`,
      salaryTrend: averageSalary > 0 ? 'Stable' : 'No data'
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          activeEmployees,
          attendanceRate: parseFloat(attendanceRate.toFixed(1)),
          averageSalary: parseFloat(averageSalary.toFixed(0)),
          newHires,
          turnoverRate: parseFloat(turnoverRate.toFixed(1))
        },
        breakdown: {
          departments: departmentBreakdown,
          designations: designationBreakdown
        },
        trends,
        period: {
          month: currentMonth.toISOString().split('T')[0],
          generated_at: now.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Employee reports API error:', error)
    return NextResponse.json({
      error: 'Failed to generate employee reports'
    }, { status: 500 })
  }
}