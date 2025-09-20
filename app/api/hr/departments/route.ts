import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/hr/departments - Get all departments
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
    const isActive = searchParams.get('isActive')

    // Build query with employee count
    let query = supabase
      .from('departments')
      .select(`
        *,
        employees:employees(count)
      `)
      .order('name', { ascending: true })

    // Add filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (isActive !== null) {
      query = query.eq('isActive', isActive === 'true')
    }

    const { data: departments, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
    }

    // Transform to include employee count
    const departmentsWithCount = departments?.map(dept => ({
      ...dept,
      employeeCount: dept.employees?.[0]?.count || 0,
      employees: undefined // Remove the employees array
    })) || []

    return NextResponse.json({ departments: departmentsWithCount })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hr/departments - Create new department
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
    const { name } = body
    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 })
    }

    // Insert new department
    const { data: department, error } = await supabase
      .from('departments')
      .insert({
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Department name already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
    }

    return NextResponse.json({ department }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}