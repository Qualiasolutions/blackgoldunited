import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Salary structure validation schema
const salaryStructureSchema = z.object({
  structureName: z.string().min(1, 'Structure name is required').max(100),
  isActive: z.boolean().default(true),
  components: z.array(z.object({
    salaryComponentId: z.string().uuid('Invalid component ID'),
    amount: z.number().min(0).optional(),
    percentage: z.number().min(0).max(100).optional(),
    formula: z.string().optional()
  })).min(1, 'At least one component is required')
})

// GET /api/payroll/salary-structures - List all salary structures with details
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
    const isActive = searchParams.get('isActive')
    const offset = (page - 1) * limit

    // Build query with relations
    let queryBuilder = supabase
      .from('salary_structures')
      .select(`
        *,
        created_by_user:users!salary_structures_created_by_fkey(first_name, last_name),
        structure_details:salary_structure_details(
          id,
          amount,
          percentage,
          formula,
          component:salary_components(id, component_name, component_type, calculation_type)
        )
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.ilike('structure_name', `%${query}%`)
    }

    if (isActive !== null) {
      queryBuilder = queryBuilder.eq('is_active', isActive === 'true')
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('salary_structures')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: salaryStructures, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch salary structures' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_SALARY_STRUCTURES',
      entity_type: 'salary_structure',
      details: { query, page, limit, total_count: totalCount }
    })

    return NextResponse.json({
      success: true,
      data: salaryStructures || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      }
    })

  } catch (error) {
    console.error('Salary structures fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payroll/salary-structures - Create new salary structure
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - payroll module access required
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = salaryStructureSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { structureName, isActive, components } = validation.data
    const supabase = await createClient()

    // Start transaction
    const { data: salaryStructure, error: structureError } = await supabase
      .from('salary_structures')
      .insert({
        structure_name: structureName,
        is_active: isActive,
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (structureError) {
      console.error('Structure creation error:', structureError)
      return NextResponse.json({ error: 'Failed to create salary structure' }, { status: 500 })
    }

    // Insert structure details (components)
    const structureDetails = components.map(comp => ({
      salary_structure_id: salaryStructure.id,
      salary_component_id: comp.salaryComponentId,
      amount: comp.amount || null,
      percentage: comp.percentage || null,
      formula: comp.formula || null
    }))

    const { error: detailsError } = await supabase
      .from('salary_structure_details')
      .insert(structureDetails)

    if (detailsError) {
      console.error('Structure details creation error:', detailsError)
      // Rollback - delete the structure
      await supabase.from('salary_structures').delete().eq('id', salaryStructure.id)
      return NextResponse.json({ error: 'Failed to create salary structure details' }, { status: 500 })
    }

    // Fetch complete structure with details
    const { data: completeStructure } = await supabase
      .from('salary_structures')
      .select(`
        *,
        created_by_user:users!salary_structures_created_by_fkey(first_name, last_name),
        structure_details:salary_structure_details(
          id,
          amount,
          percentage,
          formula,
          component:salary_components(id, component_name, component_type, calculation_type)
        )
      `)
      .eq('id', salaryStructure.id)
      .single()

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_SALARY_STRUCTURE',
      entity_type: 'salary_structure',
      entity_id: salaryStructure.id,
      details: { structure_name: structureName, components_count: components.length }
    })

    return NextResponse.json({
      success: true,
      data: completeStructure,
      message: 'Salary structure created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Salary structure creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}