import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Employee update schema - same as create but all fields optional except id
const employeeUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional(),
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
  hireDate: z.string().optional(),
  probationEndDate: z.string().optional().or(z.literal('')),
  confirmationDate: z.string().optional().or(z.literal('')),
  terminationDate: z.string().optional().or(z.literal('')),
  salary: z.number().min(0).optional(),
  addressLine1: z.string().optional().or(z.literal('')),
  addressLine2: z.string().optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).optional(),
  emergencyContactName: z.string().max(100).optional().or(z.literal('')),
  emergencyContactPhone: z.string().max(20).optional().or(z.literal('')),
  isActive: z.boolean().optional()
})

// GET /api/hr/employees/[id] - Get single employee with full details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: employeeId } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'hr', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get employee details with all related data
    const { data: employee, error } = await supabase
      .from('employees')
      .select(`
        *,
        department:departments(id, name, description),
        designation:designations(id, title, description),
        employmentType:employment_types(id, name),
        employeeLevel:employee_levels(id, name, level),
        reportingManager:employees!employees_reportingManagerId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber,
          email
        ),
        subordinates:employees!employees_reportingManagerId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber,
          department:departments(id, name)
        )
      `)
      .eq('id', employeeId)
      .is('deletedAt', null)
      .single()

    if (error || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: employee
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/hr/employees/[id] - Update employee
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: employeeId } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'hr', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can update employees
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can update employees'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = employeeUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Check if employee exists
    const { data: existingEmployee, error: checkError } = await supabase
      .from('employees')
      .select('id, firstName, lastName, employeeNumber, email')
      .eq('id', employeeId)
      .is('deletedAt', null)
      .single()

    if (checkError || !existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check for duplicate email if email is being updated
    if (validatedData.email && validatedData.email !== existingEmployee.email) {
      const { data: duplicateEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('email', validatedData.email)
        .is('deletedAt', null)
        .neq('id', employeeId)
        .single()

      if (duplicateEmployee) {
        return NextResponse.json({
          error: 'An employee with this email already exists'
        }, { status: 409 })
      }
    }

    // Prepare update data - only include provided fields
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    // Add provided fields to update data
    Object.keys(validatedData).forEach(key => {
      const value = (validatedData as any)[key]
      if (value !== undefined) {
        updateData[key] = value === '' ? null : value
      }
    })

    // Update employee
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', employeeId)
      .select(`
        *,
        department:departments(id, name, description),
        designation:designations(id, title, description),
        employmentType:employment_types(id, name),
        employeeLevel:employee_levels(id, name, level),
        reportingManager:employees!employees_reportingManagerId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber,
          email
        )
      `)
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      if (updateError.code === '23505') {
        return NextResponse.json({
          error: 'Email already exists'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'employee',
          entityId: employeeId,
          action: 'updated',
          description: `Employee ${updatedEmployee.firstName} ${updatedEmployee.lastName} (${updatedEmployee.employeeNumber}) updated`,
          userId: authResult.user.id,
          metadata: {
            employeeNumber: updatedEmployee.employeeNumber,
            fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
            updatedFields: Object.keys(validatedData)
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: updatedEmployee
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/hr/employees/[id] - Soft delete employee
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: employeeId } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'hr', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT can delete employees
    const userRole = authResult.user.role
    if (userRole !== 'MANAGEMENT') {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT can delete employees'
      }, { status: 403 })
    }

    const supabase = await createClient()

    // Check if employee exists and get details
    const { data: employee, error: checkError } = await supabase
      .from('employees')
      .select('id, firstName, lastName, employeeNumber')
      .eq('id', employeeId)
      .is('deletedAt', null)
      .single()

    if (checkError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if employee has subordinates
    const { data: subordinates } = await supabase
      .from('employees')
      .select('id, firstName, lastName')
      .eq('reportingManagerId', employeeId)
      .is('deletedAt', null)

    if (subordinates && subordinates.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete employee with active subordinates. Please reassign subordinates first.',
        subordinates: subordinates.map(sub => `${sub.firstName} ${sub.lastName}`)
      }, { status: 400 })
    }

    // Soft delete employee
    const { error: deleteError } = await supabase
      .from('employees')
      .update({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', employeeId)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'employee',
          entityId: employeeId,
          action: 'deleted',
          description: `Employee ${employee.firstName} ${employee.lastName} (${employee.employeeNumber}) deleted`,
          userId: authResult.user.id,
          metadata: {
            employeeNumber: employee.employeeNumber,
            fullName: `${employee.firstName} ${employee.lastName}`
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `Employee ${employee.firstName} ${employee.lastName} deleted successfully`
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}