import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Designation update schema
const designationUpdateSchema = z.object({
  title: z.string().min(1, 'Designation title is required').max(100).optional(),
  description: z.string().optional().or(z.literal('')),
  departmentId: z.string().uuid().optional().or(z.literal('')),
  levelOrder: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional()
})

// GET /api/hr/designations/[id] - Get single designation with details
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

    // Get designation details with related data
    const { data: designation, error } = await supabase
      .from('designations')
      .select(`
        *,
        department:departments(
          id,
          name,
          description
        ),
        employees!employees_id_fkey(
          id,
          firstName,
          lastName,
          employeeNumber,
          email,
          hireDate,
          department:departments(id, name)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !designation) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 })
    }

    // Get employee count
    const employeeCount = designation.employees?.length || 0

    // Transform data
    const designationWithDetails = {
      ...designation,
      employeeCount,
      employees: designation.employees // Keep employees for detailed view
    }

    return NextResponse.json({
      success: true,
      data: designationWithDetails
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/hr/designations/[id] - Update designation
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

    // Additional role check - only MANAGEMENT and ADMIN_HR can update designations
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can update designations'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = designationUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Check if designation exists
    const { data: existingDesignation, error: checkError } = await supabase
      .from('designations')
      .select('id, title, departmentId')
      .eq('id', id)
      .single()

    if (checkError || !existingDesignation) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 })
    }

    // Check for duplicate designation title if title or department is being updated
    if (validatedData.title || validatedData.departmentId !== undefined) {
      const newTitle = validatedData.title || existingDesignation.title
      const newDepartmentId = validatedData.departmentId !== undefined ?
        (validatedData.departmentId || null) : existingDesignation.departmentId

      // Only check for duplicates if title or department has actually changed
      if (newTitle !== existingDesignation.title || newDepartmentId !== existingDesignation.departmentId) {
        let duplicateQuery = supabase
          .from('designations')
          .select('id')
          .eq('title', newTitle)
          .neq('id', id)

        if (newDepartmentId) {
          duplicateQuery = duplicateQuery.eq('departmentId', newDepartmentId)
        } else {
          duplicateQuery = duplicateQuery.is('departmentId', null)
        }

        const { data: duplicateDesignation } = await duplicateQuery.single()

        if (duplicateDesignation) {
          return NextResponse.json({
            error: newDepartmentId ?
              'A designation with this title already exists in the selected department' :
              'A general designation with this title already exists'
          }, { status: 409 })
        }
      }
    }

    // Validate department exists if provided
    if (validatedData.departmentId) {
      const { data: department } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', validatedData.departmentId)
        .single()

      if (!department) {
        return NextResponse.json({
          error: 'Department not found'
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

    // Update designation
    const { data: updatedDesignation, error: updateError } = await supabase
      .from('designations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        department:departments(
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
          error: 'Designation title already exists in this department'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to update designation' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'designation',
          entityId: id,
          action: 'updated',
          description: `Designation "${updatedDesignation.title}" updated`,
          userId: authResult.user.id,
          metadata: {
            designationTitle: updatedDesignation.title,
            departmentName: updatedDesignation.department?.name || 'General',
            updatedFields: Object.keys(validatedData)
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: updatedDesignation
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/hr/designations/[id] - Delete designation
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

    // Additional role check - only MANAGEMENT can delete designations
    const userRole = authResult.user.role
    if (userRole !== 'MANAGEMENT') {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT can delete designations'
      }, { status: 403 })
    }

    const supabase = await createClient()

    // Check if designation exists and get details
    const { data: designation, error: checkError } = await supabase
      .from('designations')
      .select('id, title')
      .eq('id', id)
      .single()

    if (checkError || !designation) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 })
    }

    // Check if designation has employees
    const { data: employees } = await supabase
      .from('employees')
      .select('id, firstName, lastName')
      .eq('id', id)
      .is('deletedAt', null)

    if (employees && employees.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete designation with active employees. Please reassign employees first.',
        employees: employees.map(emp => `${emp.firstName} ${emp.lastName}`)
      }, { status: 400 })
    }

    // Delete designation
    const { error: deleteError } = await supabase
      .from('designations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete designation' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'designation',
          entityId: id,
          action: 'deleted',
          description: `Designation "${designation.title}" deleted`,
          userId: authResult.user.id,
          metadata: {
            designationTitle: designation.title
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `Designation "${designation.title}" deleted successfully`
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}