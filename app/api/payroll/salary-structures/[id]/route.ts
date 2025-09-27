import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update salary structure validation schema
const updateSalaryStructureSchema = z.object({
  structureName: z.string().min(1, 'Structure name is required').max(100).optional(),
  isActive: z.boolean().optional(),
  components: z.array(z.object({
    salaryComponentId: z.string().uuid('Invalid component ID'),
    amount: z.number().min(0).optional(),
    percentage: z.number().min(0).max(100).optional(),
    formula: z.string().optional()
  })).optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/payroll/salary-structures/[id] - Get single salary structure
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await params
    const supabase = await createClient()

    // Fetch salary structure with full details
    const { data: salaryStructure, error } = await supabase
      .from('salary_structures')
      .select(`
        *,
        created_by_user:users!salary_structures_created_by_fkey(first_name, last_name),
        structure_details:salary_structure_details(
          id,
          amount,
          percentage,
          formula,
          component:salary_components(id, component_name, component_type, calculation_type, is_taxable)
        ),
        contracts_count:contracts(count)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Salary structure not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch salary structure' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'VIEW_SALARY_STRUCTURE',
      entity_type: 'salary_structure',
      entity_id: id,
      details: { structure_name: salaryStructure.structure_name }
    })

    return NextResponse.json({
      success: true,
      data: salaryStructure
    })

  } catch (error) {
    console.error('Salary structure fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/payroll/salary-structures/[id] - Update salary structure
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await params
    const body = await request.json()
    const validation = updateSalaryStructureSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { structureName, isActive, components } = validation.data
    const supabase = await createClient()

    // Check if salary structure exists
    const { data: existingStructure, error: fetchError } = await supabase
      .from('salary_structures')
      .select('id, structure_name')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Salary structure not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch salary structure' }, { status: 500 })
    }

    // Update salary structure basic info
    const updateData: any = {}
    if (structureName !== undefined) updateData.structure_name = structureName
    if (isActive !== undefined) updateData.is_active = isActive

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('salary_structures')
        .update(updateData)
        .eq('id', id)

      if (updateError) {
        console.error('Structure update error:', updateError)
        return NextResponse.json({ error: 'Failed to update salary structure' }, { status: 500 })
      }
    }

    // Update components if provided
    if (components) {
      // Delete existing details
      await supabase
        .from('salary_structure_details')
        .delete()
        .eq('salary_structure_id', id)

      // Insert new details
      const structureDetails = components.map(comp => ({
        salary_structure_id: id,
        salary_component_id: comp.salaryComponentId,
        amount: comp.amount || null,
        percentage: comp.percentage || null,
        formula: comp.formula || null
      }))

      const { error: detailsError } = await supabase
        .from('salary_structure_details')
        .insert(structureDetails)

      if (detailsError) {
        console.error('Structure details update error:', detailsError)
        return NextResponse.json({ error: 'Failed to update salary structure components' }, { status: 500 })
      }
    }

    // Fetch updated structure
    const { data: updatedStructure } = await supabase
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
      .eq('id', id)
      .single()

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'UPDATE_SALARY_STRUCTURE',
      entity_type: 'salary_structure',
      entity_id: id,
      details: {
        structure_name: structureName || existingStructure.structure_name,
        updated_fields: Object.keys(updateData),
        components_updated: !!components
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedStructure,
      message: 'Salary structure updated successfully'
    })

  } catch (error) {
    console.error('Salary structure update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payroll/salary-structures/[id] - Delete salary structure
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await params
    const supabase = await createClient()

    // Check if salary structure exists and get name for logging
    const { data: existingStructure, error: fetchError } = await supabase
      .from('salary_structures')
      .select('id, structure_name')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Salary structure not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch salary structure' }, { status: 500 })
    }

    // Check if structure is being used in contracts
    const { data: contractsUsing, error: contractsError } = await supabase
      .from('contracts')
      .select('id')
      .eq('salary_structure_id', id)
      .limit(1)

    if (contractsError) {
      console.error('Contracts check error:', contractsError)
      return NextResponse.json({ error: 'Failed to check structure usage' }, { status: 500 })
    }

    if (contractsUsing && contractsUsing.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete salary structure as it is being used in employee contracts'
      }, { status: 400 })
    }

    // Delete salary structure (cascade will delete details)
    const { error: deleteError } = await supabase
      .from('salary_structures')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Structure deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete salary structure' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'DELETE_SALARY_STRUCTURE',
      entity_type: 'salary_structure',
      entity_id: id,
      details: { structure_name: existingStructure.structure_name }
    })

    return NextResponse.json({
      success: true,
      message: 'Salary structure deleted successfully'
    })

  } catch (error) {
    console.error('Salary structure deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}