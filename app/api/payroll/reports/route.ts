import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Report parameters validation schema
const reportParamsSchema = z.object({
  reportType: z.enum([
    'payroll_summary',
    'department_costs',
    'employee_earnings',
    'tax_report',
    'loan_report',
    'overtime_report',
    'deductions_report'
  ]),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  departmentId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  format: z.enum(['json', 'csv']).default('json')
})

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Helper function to convert JSON to CSV
function jsonToCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row =>
    headers.map(header => {
      const value = row[header]
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value || ''
    }).join(',')
  )
  return [csvHeaders, ...csvRows].join('\n')
}

// Generate Payroll Summary Report
async function generatePayrollSummaryReport(supabase: any, startDate: string, endDate: string, departmentId?: string) {
  let query = supabase
    .from('pay_slips')
    .select(`
      *,
      employee:employees(
        id,
        employee_number,
        first_name,
        last_name,
        department:departments(id, name)
      ),
      pay_run:pay_runs(id, pay_run_number, pay_date)
    `)
    .gte('pay_period_start', startDate)
    .lte('pay_period_end', endDate)
    .eq('status', 'PAID')

  if (departmentId) {
    query = query.eq('employee.department_id', departmentId)
  }

  const { data: paySlips, error } = await query

  if (error) throw error

  const summary = paySlips.reduce((acc: any, slip: any) => {
    acc.totalEmployees++
    acc.totalGrossPay += slip.gross_pay
    acc.totalDeductions += slip.total_deductions
    acc.totalNetPay += slip.net_pay
    return acc
  }, {
    totalEmployees: 0,
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0
  })

  return {
    summary,
    paySlips: paySlips.map((slip: any) => ({
      employee_number: slip.employee.employee_number,
      employee_name: `${slip.employee.first_name} ${slip.employee.last_name}`,
      department: slip.employee.department?.name || 'N/A',
      pay_period: `${slip.pay_period_start} to ${slip.pay_period_end}`,
      gross_pay: slip.gross_pay,
      total_deductions: slip.total_deductions,
      net_pay: slip.net_pay,
      pay_run: slip.pay_run?.pay_run_number || 'Individual'
    }))
  }
}

// Generate Department Costs Report
async function generateDepartmentCostsReport(supabase: any, startDate: string, endDate: string) {
  const { data: paySlips, error } = await supabase
    .from('pay_slips')
    .select(`
      gross_pay,
      total_deductions,
      net_pay,
      employee:employees(
        department:departments(id, name)
      )
    `)
    .gte('pay_period_start', startDate)
    .lte('pay_period_end', endDate)
    .eq('status', 'PAID')

  if (error) throw error

  const departmentCosts = paySlips.reduce((acc: any, slip: any) => {
    const deptName = slip.employee.department?.name || 'Unassigned'
    if (!acc[deptName]) {
      acc[deptName] = {
        department_name: deptName,
        employee_count: new Set(),
        total_gross_pay: 0,
        total_deductions: 0,
        total_net_pay: 0
      }
    }

    acc[deptName].employee_count.add(slip.employee.id)
    acc[deptName].total_gross_pay += slip.gross_pay
    acc[deptName].total_deductions += slip.total_deductions
    acc[deptName].total_net_pay += slip.net_pay

    return acc
  }, {})

  return Object.values(departmentCosts).map((dept: any) => ({
    ...dept,
    employee_count: dept.employee_count.size
  }))
}

// Generate Employee Earnings Report
async function generateEmployeeEarningsReport(supabase: any, startDate: string, endDate: string, employeeId?: string) {
  let query = supabase
    .from('pay_slips')
    .select(`
      *,
      employee:employees(
        id,
        employee_number,
        first_name,
        last_name,
        department:departments(id, name),
        designation:designations(id, title)
      )
    `)
    .gte('pay_period_start', startDate)
    .lte('pay_period_end', endDate)

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }

  const { data: paySlips, error } = await query

  if (error) throw error

  return paySlips.map((slip: any) => ({
    employee_number: slip.employee.employee_number,
    employee_name: `${slip.employee.first_name} ${slip.employee.last_name}`,
    department: slip.employee.department?.name || 'N/A',
    designation: slip.employee.designation?.title || 'N/A',
    pay_period: `${slip.pay_period_start} to ${slip.pay_period_end}`,
    working_days: slip.working_days,
    earnings_breakdown: slip.earnings,
    gross_pay: slip.gross_pay,
    deductions_breakdown: slip.deductions,
    total_deductions: slip.total_deductions,
    net_pay: slip.net_pay
  }))
}

// Generate Tax Report
async function generateTaxReport(supabase: any, startDate: string, endDate: string) {
  const { data: paySlips, error } = await supabase
    .from('pay_slips')
    .select(`
      *,
      employee:employees(
        employee_number,
        first_name,
        last_name
      )
    `)
    .gte('pay_period_start', startDate)
    .lte('pay_period_end', endDate)

  if (error) throw error

  return paySlips.map((slip: any) => {
    const taxDeductions = slip.deductions.filter((d: any) =>
      d.component_name.toLowerCase().includes('tax')
    )

    const totalTax = taxDeductions.reduce((sum: number, d: any) => sum + d.amount, 0)

    return {
      employee_number: slip.employee.employee_number,
      employee_name: `${slip.employee.first_name} ${slip.employee.last_name}`,
      pay_period: `${slip.pay_period_start} to ${slip.pay_period_end}`,
      gross_pay: slip.gross_pay,
      tax_deductions: taxDeductions,
      total_tax: totalTax,
      taxable_income: slip.gross_pay // Simplified - would need proper tax calculation
    }
  })
}

// Generate Overtime Report
async function generateOvertimeReport(supabase: any, startDate: string, endDate: string, departmentId?: string) {
  let query = supabase
    .from('overtime_records')
    .select(`
      *,
      employee:employees(
        employee_number,
        first_name,
        last_name,
        department:departments(id, name)
      )
    `)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .eq('status', 'APPROVED')

  if (departmentId) {
    query = query.eq('employee.department_id', departmentId)
  }

  const { data: overtimeRecords, error } = await query

  if (error) throw error

  return overtimeRecords.map((record: any) => ({
    employee_number: record.employee.employee_number,
    employee_name: `${record.employee.first_name} ${record.employee.last_name}`,
    department: record.employee.department?.name || 'N/A',
    work_date: record.work_date,
    overtime_hours: record.overtime_hours,
    overtime_type: record.overtime_type,
    hourly_rate: record.hourly_rate,
    overtime_rate: record.overtime_rate,
    overtime_pay: record.overtime_pay
  }))
}

// GET /api/payroll/reports - Generate payroll reports
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - payroll module access required
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const departmentId = searchParams.get('departmentId')
    const employeeId = searchParams.get('employeeId')
    const format = searchParams.get('format') || 'json'

    // Validate parameters
    const validation = reportParamsSchema.safeParse({
      reportType,
      startDate,
      endDate,
      departmentId,
      employeeId,
      format
    })

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid parameters',
        details: validation.error.issues
      }, { status: 400 })
    }

    const params = validation.data
    const supabase = await createClient()

    let reportData: any
    let reportTitle: string
    let csvHeaders: string[] = []

    // Generate report based on type
    switch (params.reportType) {
      case 'payroll_summary':
        reportData = await generatePayrollSummaryReport(supabase, params.startDate, params.endDate, params.departmentId)
        reportTitle = 'Payroll Summary Report'
        csvHeaders = ['employee_number', 'employee_name', 'department', 'pay_period', 'gross_pay', 'total_deductions', 'net_pay']
        break

      case 'department_costs':
        reportData = await generateDepartmentCostsReport(supabase, params.startDate, params.endDate)
        reportTitle = 'Department Costs Report'
        csvHeaders = ['department_name', 'employee_count', 'total_gross_pay', 'total_deductions', 'total_net_pay']
        break

      case 'employee_earnings':
        reportData = await generateEmployeeEarningsReport(supabase, params.startDate, params.endDate, params.employeeId)
        reportTitle = 'Employee Earnings Report'
        csvHeaders = ['employee_number', 'employee_name', 'department', 'designation', 'pay_period', 'working_days', 'gross_pay', 'total_deductions', 'net_pay']
        break

      case 'tax_report':
        reportData = await generateTaxReport(supabase, params.startDate, params.endDate)
        reportTitle = 'Tax Report'
        csvHeaders = ['employee_number', 'employee_name', 'pay_period', 'gross_pay', 'total_tax', 'taxable_income']
        break

      case 'overtime_report':
        reportData = await generateOvertimeReport(supabase, params.startDate, params.endDate, params.departmentId)
        reportTitle = 'Overtime Report'
        csvHeaders = ['employee_number', 'employee_name', 'department', 'work_date', 'overtime_hours', 'overtime_type', 'overtime_pay']
        break

      default:
        return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'GENERATE_PAYROLL_REPORT',
      entity_type: 'report',
      details: {
        report_type: params.reportType,
        date_range: `${params.startDate} to ${params.endDate}`,
        format: params.format,
        department_id: params.departmentId,
        employee_id: params.employeeId
      }
    })

    // Return CSV format if requested
    if (params.format === 'csv') {
      const dataArray = Array.isArray(reportData) ? reportData : reportData.paySlips || [reportData]
      const csvContent = jsonToCSV(dataArray, csvHeaders)

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${params.reportType}_${params.startDate}_${params.endDate}.csv"`
        }
      })
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      data: {
        title: reportTitle,
        parameters: {
          report_type: params.reportType,
          date_range: `${params.startDate} to ${params.endDate}`,
          department_id: params.departmentId,
          employee_id: params.employeeId
        },
        generated_at: new Date().toISOString(),
        report_data: reportData
      }
    })

  } catch (error) {
    console.error('Payroll report generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate report',
      details: error.message
    }, { status: 500 })
  }
}