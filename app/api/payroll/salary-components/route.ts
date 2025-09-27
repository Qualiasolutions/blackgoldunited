import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Salary component validation schema
const salaryComponentSchema = z.object({
  componentName: z.string().min(1, 'Component name is required').max(100),
  componentType: z.enum(['EARNING', 'DEDUCTION'], {
    errorMap: () => ({ message: 'Component type must be EARNING or DEDUCTION' })
  }),
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA'], {
    errorMap: () => ({ message: 'Calculation type must be FIXED, PERCENTAGE, or FORMULA' })
  }),
  isTaxable: z.boolean().default(true),
  isActive: z.boolean().default(true)
})

// GET /api/payroll/salary-components - List all salary components
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - payroll module access required
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const query = searchParams.get('query') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const componentType = searchParams.get('componentType')
    const calculationType = searchParams.get('calculationType')
    const isActive = searchParams.get('isActive')
    const offset = (page - 1) * limit

    // Build query
    let queryBuilder = supabase
      .from('salary_components')
      .select('*')

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.ilike('component_name', `%${query}%`)
    }

    if (componentType) {
      queryBuilder = queryBuilder.eq('component_type', componentType)
    }

    if (calculationType) {
      queryBuilder = queryBuilder.eq('calculation_type', calculationType)
    }

    if (isActive !== null) {
      queryBuilder = queryBuilder.eq('is_active', isActive === 'true')
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('salary_components')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: salaryComponents, error } = await queryBuilder
      .order('component_type', { ascending: true })
      .order('component_name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch salary components' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Get component usage counts
    const componentsWithUsage = await Promise.all(
      (salaryComponents || []).map(async (component) => {
        const { count: usageCount } = await supabase
          .from('salary_structure_details')
          .select('*', { count: 'exact', head: true })
          .eq('salary_component_id', component.id)

        return {
          ...component,
          usage_count: usageCount || 0
        }
      })
    )

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_SALARY_COMPONENTS',
      entity_type: 'salary_component',
      details: { query, page, limit, total_count: totalCount }
    })

    return NextResponse.json({
      success: true,
      data: componentsWithUsage,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      }
    })

  } catch (error) {
    console.error('Salary components fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payroll/salary-components - Create new salary component
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - payroll module access required
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = salaryComponentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { componentName, componentType, calculationType, isTaxable, isActive } = validation.data
    const supabase = await createClient()

    // Check for duplicate component name
    const { data: existingComponent } = await supabase
      .from('salary_components')
      .select('id')
      .eq('component_name', componentName)
      .single()

    if (existingComponent) {
      return NextResponse.json({
        error: 'A salary component with this name already exists'
      }, { status: 400 })
    }

    // Create salary component
    const { data: salaryComponent, error: createError } = await supabase
      .from('salary_components')
      .insert({
        component_name: componentName,
        component_type: componentType,
        calculation_type: calculationType,
        is_taxable: isTaxable,
        is_active: isActive
      })
      .select()
      .single()

    if (createError) {
      console.error('Component creation error:', createError)
      return NextResponse.json({ error: 'Failed to create salary component' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_SALARY_COMPONENT',
      entity_type: 'salary_component',
      entity_id: salaryComponent.id,
      details: {
        component_name: componentName,
        component_type: componentType,
        calculation_type: calculationType
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...salaryComponent,
        usage_count: 0
      },
      message: 'Salary component created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Salary component creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}