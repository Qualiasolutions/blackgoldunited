import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Employee validation schema
const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  mobile: z.string().max(20).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  nationality: z.string().max(50).optional().or(z.literal('')),
  passportNumber: z.string().max(50).optional().or(z.literal('')),
  emiratesId: z.string().max(50).optional().or(z.literal('')),
  visaNumber: z.string().max(50).optional().or(z.literal('')),
  visaExpiry: z.string().optional().or(z.literal('')),
  departmentId: z.string().uuid().optional().or(z.literal('')),
  designationId: z.string().uuid().optional().or(z.literal('')),
  employmentTypeId: z.string().uuid().optional().or(z.literal('')),
  employeeLevelId: z.string().uuid().optional().or(z.literal('')),
  reportingManagerId: z.string().uuid().optional().or(z.literal('')),
  hireDate: z.string().min(1, 'Hire date is required'),
  probationEndDate: z.string().optional().or(z.literal('')),
  confirmationDate: z.string().optional().or(z.literal('')),
  salary: z.number().min(0).optional(),
  addressLine1: z.string().optional().or(z.literal('')),
  addressLine2: z.string().optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).default('United Arab Emirates'),
  emergencyContactName: z.string().max(100).optional().or(z.literal('')),
  emergencyContactPhone: z.string().max(20).optional().or(z.literal('')),
  isActive: z.boolean().default(true)
})

// GET /api/hr/employees - List all employees with filtering and search
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - HR module access required
    const authResult = await authenticateAndAuthorize(request, 'employees', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const search = searchParams.get('search') || ''
    const departmentId = searchParams.get('departmentId')
    const designationId = searchParams.get('designationId')
    const isActive = searchParams.get('isActive')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Base query with related data
    let query = supabase
      .from('employees')
      .select(`
        id,
        employeeNumber,
        firstName,
        lastName,
        email,
        phone,
        mobile,
        dateOfBirth,
        nationality,
        departmentId,
        designationId,
        reportingManagerId,
        hireDate,
        salary,
        isActive,
        createdAt,
        updatedAt,
        department:departments(id, name),
        designation:designations(id, title),
        reportingManager:employees!employees_reportingManagerId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber
        )
      `, { count: 'exact' })
      .is('deletedAt', null)
      .order('createdAt', { ascending: false })

    // Apply filters
    if (search.trim()) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,employeeNumber.ilike.%${search}%`)
    }

    if (departmentId) {
      query = query.eq('departmentId', departmentId)
    }

    if (designationId) {
      query = query.eq('designationId', designationId)
    }

    if (isActive !== null) {
      query = query.eq('isActive', isActive === 'true')
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: employees, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: employees || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hr/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - HR write access required
    const authResult = await authenticateAndAuthorize(request, 'employees', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can create employees
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can create employees'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = employeeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Generate employee number if not provided
    let employeeNumber = body.employeeNumber
    if (!employeeNumber) {
      const { data: lastEmployee } = await supabase
        .from('employees')
        .select('employeeNumber')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      const lastNumber = lastEmployee?.employeeNumber ?
        parseInt(lastEmployee.employeeNumber.replace('EMP-', '')) || 0 : 0
      employeeNumber = `EMP-${String(lastNumber + 1).padStart(6, '0')}`
    }

    // Check for duplicate email or employee number
    if (validatedData.email) {
      const { data: existingEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('email', validatedData.email)
        .is('deletedAt', null)
        .single()

      if (existingEmployee) {
        return NextResponse.json({
          error: 'An employee with this email already exists'
        }, { status: 409 })
      }
    }

    const { data: existingEmpNum } = await supabase
      .from('employees')
      .select('id')
      .eq('employeeNumber', employeeNumber)
      .is('deletedAt', null)
      .single()

    if (existingEmpNum) {
      return NextResponse.json({
        error: 'An employee with this employee number already exists'
      }, { status: 409 })
    }

    // Prepare employee data for insertion
    const employeeData = {
      employeeNumber,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      mobile: validatedData.mobile || null,
      dateOfBirth: validatedData.dateOfBirth || null,
      nationality: validatedData.nationality || null,
      passportNumber: validatedData.passportNumber || null,
      emiratesId: validatedData.emiratesId || null,
      visaNumber: validatedData.visaNumber || null,
      visaExpiry: validatedData.visaExpiry || null,
      departmentId: validatedData.departmentId || null,
      designationId: validatedData.designationId || null,
      employmentTypeId: validatedData.employmentTypeId || null,
      employeeLevelId: validatedData.employeeLevelId || null,
      reportingManagerId: validatedData.reportingManagerId || null,
      hireDate: validatedData.hireDate,
      probationEndDate: validatedData.probationEndDate || null,
      confirmationDate: validatedData.confirmationDate || null,
      salary: validatedData.salary || null,
      addressLine1: validatedData.addressLine1 || null,
      addressLine2: validatedData.addressLine2 || null,
      city: validatedData.city || null,
      state: validatedData.state || null,
      postalCode: validatedData.postalCode || null,
      country: validatedData.country,
      emergencyContactName: validatedData.emergencyContactName || null,
      emergencyContactPhone: validatedData.emergencyContactPhone || null,
      isActive: validatedData.isActive,
      createdBy: authResult.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Insert employee
    const { data: employee, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select(`
        id,
        employeeNumber,
        firstName,
        lastName,
        email,
        phone,
        mobile,
        dateOfBirth,
        nationality,
        departmentId,
        designationId,
        reportingManagerId,
        hireDate,
        salary,
        isActive,
        createdAt,
        updatedAt,
        department:departments(id, name),
        designation:designations(id, title),
        reportingManager:employees!employees_reportingManagerId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'Employee number or email already exists'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'employee',
          entityId: employee.id,
          action: 'created',
          description: `Employee ${employee.firstName} ${employee.lastName} (${employee.employeeNumber}) created`,
          userId: authResult.user.id,
          metadata: {
            employeeNumber: employee.employeeNumber,
            fullName: `${employee.firstName} ${employee.lastName}`,
            department: employee.department ? (employee.department as any).name : null
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: employee
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}