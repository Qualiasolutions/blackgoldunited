import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Department update schema
const departmentUpdateSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100).optional(),
  description: z.string().optional().or(z.literal('')),
  managerId: z.string().uuid().optional().or(z.literal('')),
  parentId: z.string().uuid().optional().or(z.literal('')),
  isActive: z.boolean().optional()
})

// GET /api/hr/departments/[id] - Get single department with hierarchy
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'organizational', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get department details with related data
    const { data: department, error } = await supabase
      .from('departments')
      .select(`
        *,
        manager:employees!departments_managerId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber,
          email
        ),
        parent:departments!departments_parentId_fkey(
          id,
          name,
          description
        ),
        subdepartments:departments!departments_parentId_fkey(
          id,
          name,
          description,
          isActive
        ),
        employees!employees_id_fkey(
          id,
          firstName,
          lastName,
          employeeNumber,
          designation:designations(id, title)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Get employee count
    const employeeCount = department.employees?.length || 0

    // Remove employees array and add count
    const departmentWithCount = {
      ...department,
      employeeCount,
      employees: department.employees // Keep employees for detailed view
    }

    return NextResponse.json({
      success: true,
      data: departmentWithCount
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/hr/departments/[id] - Update department
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'organizational', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can update departments
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can update departments'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = departmentUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Check if department exists
    const { data: existingDepartment, error: checkError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('id', id)
      .single()

    if (checkError || !existingDepartment) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Check for duplicate department name if name is being updated
    if (validatedData.name && validatedData.name !== existingDepartment.name) {
      const { data: duplicateDepartment } = await supabase
        .from('departments')
        .select('id')
        .eq('name', validatedData.name)
        .neq('id', id)
        .single()

      if (duplicateDepartment) {
        return NextResponse.json({
          error: 'A department with this name already exists'
        }, { status: 409 })
      }
    }

    // Validate parent department exists if provided and prevent circular reference
    if (validatedData.parentId) {
      if (validatedData.parentId === id) {
        return NextResponse.json({
          error: 'A department cannot be its own parent'
        }, { status: 400 })
      }

      const { data: parentDepartment } = await supabase
        .from('departments')
        .select('id, name, parentId')
        .eq('id', validatedData.parentId)
        .single()

      if (!parentDepartment) {
        return NextResponse.json({
          error: 'Parent department not found'
        }, { status: 400 })
      }

      // Check for circular reference (parent's parent chain should not include current department)
      let currentParentId = parentDepartment.parentId
      let depth = 0
      while (currentParentId && depth < 10) { // Max depth to prevent infinite loop
        if (currentParentId === id) {
          return NextResponse.json({
            error: 'Circular reference detected - department cannot be a parent of its ancestor'
          }, { status: 400 })
        }

        const { data: ancestorDept } = await supabase
          .from('departments')
          .select('parentId')
          .eq('id', currentParentId)
          .single()

        currentParentId = ancestorDept?.parentId
        depth++
      }
    }

    // Validate manager exists if provided
    if (validatedData.managerId) {
      const { data: manager } = await supabase
        .from('employees')
        .select('id, firstName, lastName')
        .eq('id', validatedData.managerId)
        .single()

      if (!manager) {
        return NextResponse.json({
          error: 'Manager not found'
        }, { status: 400 })
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

    // Update department
    const { data: updatedDepartment, error: updateError } = await supabase
      .from('departments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        manager:employees!departments_managerId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber,
          email
        ),
        parent:departments!departments_parentId_fkey(
          id,
          name,
          description
        )
      `)
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      if (updateError.code === '23505') {
        return NextResponse.json({
          error: 'Department name already exists'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to update department' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'department',
          entityId: id,
          action: 'updated',
          description: `Department "${updatedDepartment.name}" updated`,
          userId: authResult.user.id,
          metadata: {
            departmentName: updatedDepartment.name,
            updatedFields: Object.keys(validatedData),
            managerName: updatedDepartment.manager ?
              `${(updatedDepartment.manager as any).firstName} ${(updatedDepartment.manager as any).lastName}` : null
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: updatedDepartment
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/hr/departments/[id] - Delete department
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'organizational', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT can delete departments
    const userRole = authResult.user.role
    if (userRole !== 'MANAGEMENT') {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT can delete departments'
      }, { status: 403 })
    }

    const supabase = await createClient()

    // Check if department exists and get details
    const { data: department, error: checkError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('id', id)
      .single()

    if (checkError || !department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Check if department has employees
    const { data: employees } = await supabase
      .from('employees')
      .select('id, firstName, lastName')
      .eq('department_id', id)
      if (employees && employees.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete department with active employees. Please reassign employees first.',
        employees: employees.map(emp => `${emp.firstName} ${emp.lastName}`)
      }, { status: 400 })
    }

    // Check if department has subdepartments
    const { data: subdepartments } = await supabase
      .from('departments')
      .select('id, name')
      .eq('parent_id', id)

    if (subdepartments && subdepartments.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete department with subdepartments. Please reassign or delete subdepartments first.',
        subdepartments: subdepartments.map(sub => sub.name)
      }, { status: 400 })
    }

    // Delete department
    const { error: deleteError } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'department',
          entityId: id,
          action: 'deleted',
          description: `Department "${department.name}" deleted`,
          userId: authResult.user.id,
          metadata: {
            departmentName: department.name
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `Department "${department.name}" deleted successfully`
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}