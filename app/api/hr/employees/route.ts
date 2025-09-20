import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/hr/employees - Get all employees
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const departmentId = searchParams.get('departmentId')
    const isActive = searchParams.get('isActive')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with department information
    let query = supabase
      .from('employees')
      .select(`
        *,
        department:departments(id, name)
      `)
      .eq('deletedAt', null)
      .order('createdAt', { ascending: false })

    // Add filters
    if (search) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,employeeNumber.ilike.%${search}%`)
    }

    if (departmentId) {
      query = query.eq('departmentId', departmentId)
    }

    if (isActive !== null) {
      query = query.eq('isActive', isActive === 'true')
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    const { data: employees, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }

    return NextResponse.json({
      employees,
      pagination: {
        limit,
        offset,
        total: count || 0
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
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const { firstName, lastName, hireDate } = body
    if (!firstName || !lastName || !hireDate) {
      return NextResponse.json({
        error: 'First name, last name, and hire date are required'
      }, { status: 400 })
    }

    // Generate employee number if not provided
    if (!body.employeeNumber) {
      const { data: lastEmployee } = await supabase
        .from('employees')
        .select('employeeNumber')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      const lastNumber = lastEmployee?.employeeNumber ?
        parseInt(lastEmployee.employeeNumber.replace('EMP-', '')) || 0 : 0
      body.employeeNumber = `EMP-${String(lastNumber + 1).padStart(6, '0')}`
    }

    // Insert new employee
    const { data: employee, error } = await supabase
      .from('employees')
      .insert({
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select(`
        *,
        department:departments(id, name)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Employee number or email already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
    }

    return NextResponse.json({ employee }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}