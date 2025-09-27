import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Department validation schema
const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100),
  description: z.string().optional().or(z.literal('')),
  managerId: z.string().uuid().optional().or(z.literal('')),
  parentId: z.string().uuid().optional().or(z.literal('')),
  isActive: z.boolean().default(true)
})

// GET /api/hr/departments - List all departments with hierarchy and employee count
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - HR module access required
    const authResult = await authenticateAndAuthorize(request, 'organizational', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    const parentId = searchParams.get('parentId')
    const includeHierarchy = searchParams.get('includeHierarchy') === 'true'

    // Base query with manager and employee count
    let query = supabase
      .from('departments')
      .select(`
        id,
        name,
        description,
        managerId,
        parentId,
        isActive,
        createdAt,
        updatedAt,
        manager:employees!departments_managerId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber
        ),
        parent:departments!departments_parentId_fkey(
          id,
          name
        ),
        employees!employees_departmentId_fkey(count)
      `)
      .order('name', { ascending: true })

    // Apply filters
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (isActive !== null) {
      query = query.eq('isActive', isActive === 'true')
    }

    if (parentId) {
      query = query.eq('parentId', parentId)
    } else if (includeHierarchy) {
      // Get all root departments (no parent)
      query = query.is('parentId', null)
    }

    const { data: departments, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
    }

    // Transform to include employee count and build hierarchy if requested
    let transformedDepartments = departments?.map(dept => ({
      ...dept,
      employeeCount: dept.employees?.[0]?.count || 0,
      employees: undefined // Remove the employees array
    })) || []

    // If hierarchy is requested, fetch subdepartments
    if (includeHierarchy && transformedDepartments.length > 0) {
      const departmentIds = transformedDepartments.map(d => d.id)

      // Fetch all subdepartments
      const { data: subDepartments } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          description,
          managerId,
          parentId,
          isActive,
          createdAt,
          updatedAt,
          manager:employees!departments_managerId_fkey(
            id,
            firstName,
            lastName,
            employeeNumber
          ),
          employees!employees_departmentId_fkey(count)
        `)
        .in('parentId', departmentIds)
        .order('name', { ascending: true })

      const transformedSubDepts = subDepartments?.map(dept => ({
        ...dept,
        employeeCount: dept.employees?.[0]?.count || 0,
        employees: undefined
      })) || []

      // Build hierarchy
      transformedDepartments = transformedDepartments.map(dept => ({
        ...dept,
        subdepartments: transformedSubDepts.filter(sub => sub.parentId === dept.id)
      }))
    }

    return NextResponse.json({
      success: true,
      data: transformedDepartments
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hr/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - HR write access required
    const authResult = await authenticateAndAuthorize(request, 'organizational', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can create departments
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can create departments'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = departmentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Check for duplicate department name
    const { data: existingDepartment } = await supabase
      .from('departments')
      .select('id')
      .eq('name', validatedData.name)
      .single()

    if (existingDepartment) {
      return NextResponse.json({
        error: 'A department with this name already exists'
      }, { status: 409 })
    }

    // Validate parent department exists if provided
    if (validatedData.parentId) {
      const { data: parentDepartment } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', validatedData.parentId)
        .single()

      if (!parentDepartment) {
        return NextResponse.json({
          error: 'Parent department not found'
        }, { status: 400 })
      }
    }

    // Validate manager exists if provided
    if (validatedData.managerId) {
      const { data: manager } = await supabase
        .from('employees')
        .select('id, firstName, lastName')
        .eq('id', validatedData.managerId)
        .is('deletedAt', null)
        .single()

      if (!manager) {
        return NextResponse.json({
          error: 'Manager not found'
        }, { status: 400 })
      }
    }

    // Prepare department data for insertion
    const departmentData = {
      name: validatedData.name,
      description: validatedData.description || null,
      managerId: validatedData.managerId || null,
      parentId: validatedData.parentId || null,
      isActive: validatedData.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Insert department
    const { data: department, error } = await supabase
      .from('departments')
      .insert([departmentData])
      .select(`
        id,
        name,
        description,
        managerId,
        parentId,
        isActive,
        createdAt,
        updatedAt,
        manager:employees!departments_managerId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber
        ),
        parent:departments!departments_parentId_fkey(
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'Department name already exists'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'department',
          entityId: department.id,
          action: 'created',
          description: `Department "${department.name}" created`,
          userId: authResult.user.id,
          metadata: {
            departmentName: department.name,
            managerName: department.manager ?
              `${(department.manager as any).firstName} ${(department.manager as any).lastName}` : null,
            parentDepartment: department.parent ? (department.parent as any).name : null
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: department
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}