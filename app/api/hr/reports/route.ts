import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Report type validation schema
const reportSchema = z.object({
  reportType: z.enum([
    'employee_summary',
    'department_breakdown',
    'new_hires',
    'probation_status',
    'document_compliance',
    'onboarding_status',
    'salary_ranges'
  ]),
  dateRange: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional()
  }).optional(),
  filters: z.object({
    departmentId: z.string().uuid().optional(),
    designationId: z.string().uuid().optional(),
    employmentType: z.string().optional(),
    isActive: z.boolean().optional()
  }).optional()
})

// GET /api/hr/reports - Generate HR reports
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - HR module access required
    const authResult = await authenticateAndAuthorize(request, 'hr', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const reportType = searchParams.get('reportType') as string
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const departmentId = searchParams.get('departmentId')
    const designationId = searchParams.get('designationId')
    const employmentType = searchParams.get('employmentType')
    const isActive = searchParams.get('isActive')

    if (!reportType) {
      return NextResponse.json({
        error: 'reportType parameter is required'
      }, { status: 400 })
    }

    let reportData: any = {}

    switch (reportType) {
      case 'employee_summary':
        reportData = await generateEmployeeSummaryReport(supabase, {
          departmentId,
          designationId,
          employmentType,
          isActive: isActive ? isActive === 'true' : undefined
        })
        break

      case 'department_breakdown':
        reportData = await generateDepartmentBreakdownReport(supabase)
        break

      case 'new_hires':
        reportData = await generateNewHiresReport(supabase, { startDate, endDate })
        break

      case 'probation_status':
        reportData = await generateProbationStatusReport(supabase)
        break

      case 'document_compliance':
        reportData = await generateDocumentComplianceReport(supabase)
        break

      case 'onboarding_status':
        reportData = await generateOnboardingStatusReport(supabase)
        break

      case 'salary_ranges':
        reportData = await generateSalaryRangesReport(supabase, { departmentId })
        break

      default:
        return NextResponse.json({
          error: 'Invalid report type'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        reportType,
        generatedAt: new Date().toISOString(),
        filters: {
          startDate,
          endDate,
          departmentId,
          designationId,
          employmentType,
          isActive
        },
        ...reportData
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hr/reports - Generate custom report
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - HR write access required
    const authResult = await authenticateAndAuthorize(request, 'hr', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can generate custom reports
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can generate custom reports'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = reportSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { reportType, dateRange, filters } = validationResult.data

    let reportData: any = {}

    switch (reportType) {
      case 'employee_summary':
        reportData = await generateEmployeeSummaryReport(supabase, filters)
        break

      case 'department_breakdown':
        reportData = await generateDepartmentBreakdownReport(supabase)
        break

      case 'new_hires':
        reportData = await generateNewHiresReport(supabase, dateRange)
        break

      case 'probation_status':
        reportData = await generateProbationStatusReport(supabase)
        break

      case 'document_compliance':
        reportData = await generateDocumentComplianceReport(supabase)
        break

      case 'onboarding_status':
        reportData = await generateOnboardingStatusReport(supabase)
        break

      case 'salary_ranges':
        reportData = await generateSalaryRangesReport(supabase, filters)
        break

      default:
        return NextResponse.json({
          error: 'Invalid report type'
        }, { status: 400 })
    }

    // Log report generation
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'hr_report',
          entityId: authResult.user.id,
          action: 'generated',
          description: `HR report "${reportType}" generated`,
          userId: authResult.user.id,
          metadata: {
            reportType,
            dateRange,
            filters,
            recordCount: reportData.summary?.totalRecords || 0
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log report generation:', logError)
    }

    return NextResponse.json({
      success: true,
      data: {
        reportType,
        generatedAt: new Date().toISOString(),
        dateRange,
        filters,
        ...reportData
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Report generation functions
async function generateEmployeeSummaryReport(supabase: any, filters: any = {}) {
  let query = supabase
    .from('employees')
    .select(`
      id,
      employeeNumber,
      firstName,
      lastName,
      email,
      hireDate,
      salary,
      isActive,
      department:departments(id, name),
      designation:designations(id, title),
      employmentType:employment_types(id, typeName)
    `)
    .is('deletedAt', null)

  if (filters.departmentId) query = query.eq('departmentId', filters.departmentId)
  if (filters.designationId) query = query.eq('designationId', filters.designationId)
  if (filters.isActive !== undefined) query = query.eq('isActive', filters.isActive)

  const { data: employees, error } = await query

  if (error) throw error

  return {
    summary: {
      totalEmployees: employees?.length || 0,
      activeEmployees: employees?.filter(emp => emp.isActive).length || 0,
      inactiveEmployees: employees?.filter(emp => !emp.isActive).length || 0
    },
    employees: employees || []
  }
}

async function generateDepartmentBreakdownReport(supabase: any) {
  const { data: departments, error } = await supabase
    .from('departments')
    .select(`
      id,
      name,
      description,
      manager:employees!departments_managerId_fkey(firstName, lastName),
      employees!employees_departmentId_fkey(
        id,
        isActive,
        hireDate,
        salary
      )
    `)
    .eq('isActive', true)

  if (error) throw error

  const breakdown = departments?.map(dept => {
    const employees = dept.employees || []
    const activeEmployees = employees.filter((emp: any) => emp.isActive)
    const totalSalary = activeEmployees.reduce((sum: number, emp: any) => sum + (emp.salary || 0), 0)

    return {
      id: dept.id,
      name: dept.name,
      description: dept.description,
      manager: dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : 'Not Assigned',
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      averageSalary: activeEmployees.length > 0 ? Math.round(totalSalary / activeEmployees.length) : 0,
      totalSalaryBudget: totalSalary
    }
  }) || []

  return {
    summary: {
      totalDepartments: breakdown.length,
      totalEmployees: breakdown.reduce((sum, dept) => sum + dept.totalEmployees, 0),
      totalSalaryBudget: breakdown.reduce((sum, dept) => sum + dept.totalSalaryBudget, 0)
    },
    departments: breakdown
  }
}

async function generateNewHiresReport(supabase: any, dateRange: any = {}) {
  const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate = dateRange?.endDate || new Date().toISOString().split('T')[0]

  const { data: newHires, error } = await supabase
    .from('employees')
    .select(`
      id,
      employeeNumber,
      firstName,
      lastName,
      email,
      hireDate,
      department:departments(name),
      designation:designations(title)
    `)
    .gte('hireDate', startDate)
    .lte('hireDate', endDate)
    .is('deletedAt', null)
    .order('hireDate', { ascending: false })

  if (error) throw error

  return {
    summary: {
      totalNewHires: newHires?.length || 0,
      dateRange: { startDate, endDate }
    },
    newHires: newHires || []
  }
}

async function generateProbationStatusReport(supabase: any) {
  const { data: employees, error } = await supabase
    .from('employees')
    .select(`
      id,
      employeeNumber,
      firstName,
      lastName,
      hireDate,
      probationEndDate,
      confirmationDate,
      department:departments(name),
      designation:designations(title)
    `)
    .is('deletedAt', null)
    .eq('isActive', true)

  if (error) throw error

  const probationEmployees = employees?.filter(emp => !emp.confirmationDate) || []
  const confirmedEmployees = employees?.filter(emp => emp.confirmationDate) || []

  return {
    summary: {
      totalEmployees: employees?.length || 0,
      onProbation: probationEmployees.length,
      confirmed: confirmedEmployees.length
    },
    probationEmployees,
    confirmedEmployees
  }
}

async function generateDocumentComplianceReport(supabase: any) {
  // Get all employees
  const { data: employees } = await supabase
    .from('employees')
    .select('id, firstName, lastName, employeeNumber')
    .eq('isActive', true)
    .is('deletedAt', null)

  // Get all document logs
  const { data: documentLogs } = await supabase
    .from('activity_logs')
    .select('entityId, metadata')
    .eq('entityType', 'employee_document')
    .not('metadata->deletedAt', 'is', null)

  const employeeDocuments = employees?.map(emp => {
    const empDocs = documentLogs?.filter(log => log.entityId === emp.id) || []
    const verifiedDocs = empDocs.filter(log => log.metadata?.isVerified === true)
    const requiredDocs = empDocs.filter(log => log.metadata?.isRequired === true)

    return {
      ...emp,
      totalDocuments: empDocs.length,
      verifiedDocuments: verifiedDocs.length,
      requiredDocuments: requiredDocs.length,
      compliancePercentage: requiredDocs.length > 0 ?
        Math.round((verifiedDocs.length / requiredDocs.length) * 100) : 100
    }
  }) || []

  return {
    summary: {
      totalEmployees: employeeDocuments.length,
      fullyCompliant: employeeDocuments.filter(emp => emp.compliancePercentage === 100).length,
      partiallyCompliant: employeeDocuments.filter(emp => emp.compliancePercentage > 0 && emp.compliancePercentage < 100).length,
      nonCompliant: employeeDocuments.filter(emp => emp.compliancePercentage === 0).length
    },
    employeeCompliance: employeeDocuments
  }
}

async function generateOnboardingStatusReport(supabase: any) {
  // Get employees hired in the last 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: recentHires, error } = await supabase
    .from('employees')
    .select(`
      id,
      employeeNumber,
      firstName,
      lastName,
      hireDate,
      confirmationDate,
      department:departments(name)
    `)
    .gte('hireDate', ninetyDaysAgo)
    .eq('isActive', true)
    .is('deletedAt', null)

  if (error) throw error

  // Get onboarding tasks for these employees
  const employeeIds = recentHires?.map(emp => emp.id) || []
  const { data: onboardingLogs } = await supabase
    .from('activity_logs')
    .select('entityId, metadata')
    .eq('entityType', 'onboarding_task')
    .in('entityId', employeeIds)

  const onboardingStatus = recentHires?.map(emp => {
    const empTasks = onboardingLogs?.filter(log => log.entityId === emp.id) || []
    const completedTasks = empTasks.filter(log => log.metadata?.status === 'completed')

    const daysSinceHire = Math.floor((Date.now() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24))
    const progressPercentage = empTasks.length > 0 ?
      Math.round((completedTasks.length / empTasks.length) * 100) : 0

    let status = 'pending'
    if (progressPercentage === 100) status = 'completed'
    else if (progressPercentage > 0) status = 'in_progress'
    if (daysSinceHire > 14 && progressPercentage < 100) status = 'overdue'

    return {
      ...emp,
      daysSinceHire,
      totalTasks: empTasks.length,
      completedTasks: completedTasks.length,
      progressPercentage,
      status
    }
  }) || []

  return {
    summary: {
      totalNewHires: onboardingStatus.length,
      completed: onboardingStatus.filter(emp => emp.status === 'completed').length,
      inProgress: onboardingStatus.filter(emp => emp.status === 'in_progress').length,
      overdue: onboardingStatus.filter(emp => emp.status === 'overdue').length,
      pending: onboardingStatus.filter(emp => emp.status === 'pending').length
    },
    employeeOnboarding: onboardingStatus
  }
}

async function generateSalaryRangesReport(supabase: any, filters: any = {}) {
  let query = supabase
    .from('employees')
    .select(`
      id,
      firstName,
      lastName,
      salary,
      department:departments(id, name),
      designation:designations(id, title)
    `)
    .not('salary', 'is', null)
    .eq('isActive', true)
    .is('deletedAt', null)

  if (filters.departmentId) query = query.eq('departmentId', filters.departmentId)

  const { data: employees, error } = await query

  if (error) throw error

  const salaries = employees?.map(emp => emp.salary).filter(Boolean) || []
  const avgSalary = salaries.length > 0 ? salaries.reduce((sum, sal) => sum + sal, 0) / salaries.length : 0
  const minSalary = Math.min(...salaries)
  const maxSalary = Math.max(...salaries)

  // Group by department
  const departmentSalaries = employees?.reduce((acc: any, emp) => {
    const deptName = emp.department?.name || 'Unassigned'
    if (!acc[deptName]) {
      acc[deptName] = []
    }
    acc[deptName].push(emp.salary)
    return acc
  }, {}) || {}

  const departmentStats = Object.keys(departmentSalaries).map(dept => {
    const deptSalaries = departmentSalaries[dept]
    const deptAvg = deptSalaries.reduce((sum: number, sal: number) => sum + sal, 0) / deptSalaries.length

    return {
      department: dept,
      employeeCount: deptSalaries.length,
      averageSalary: Math.round(deptAvg),
      minSalary: Math.min(...deptSalaries),
      maxSalary: Math.max(...deptSalaries),
      totalSalaryBudget: deptSalaries.reduce((sum: number, sal: number) => sum + sal, 0)
    }
  })

  return {
    summary: {
      totalEmployees: employees?.length || 0,
      averageSalary: Math.round(avgSalary),
      minSalary,
      maxSalary,
      totalSalaryBudget: salaries.reduce((sum, sal) => sum + sal, 0)
    },
    departmentBreakdown: departmentStats,
    employees: employees || []
  }
}