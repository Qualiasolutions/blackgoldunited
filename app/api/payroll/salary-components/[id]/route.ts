import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update salary component validation schema
const updateSalaryComponentSchema = z.object({
  componentName: z.string().min(1, 'Component name is required').max(100).optional(),
  componentType: z.enum(['EARNING', 'DEDUCTION']).optional(),
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']).optional(),
  isTaxable: z.boolean().optional(),
  isActive: z.boolean().optional()
})

// GET /api/payroll/salary-components/[id] - Get single salary component
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = params
    const supabase = await createClient()

    // Fetch salary component
    const { data: salaryComponent, error } = await supabase
      .from('salary_components')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Salary component not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch salary component' }, { status: 500 })
    }

    // Get usage count and related structures
    const { data: usageData } = await supabase
      .from('salary_structure_details')
      .select(`
        salary_structure_id,
        amount,
        percentage,
        formula,
        salary_structure:salary_structures(id, structure_name, is_active)
      `)
      .eq('salary_component_id', id)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'VIEW_SALARY_COMPONENT',
      entity_type: 'salary_component',
      entity_id: id,
      details: { component_name: salaryComponent.component_name }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...salaryComponent,
        usage_count: usageData?.length || 0,
        used_in_structures: usageData || []
      }
    })

  } catch (error) {
    console.error('Salary component fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/payroll/salary-components/[id] - Update salary component
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = params
    const body = await request.json()
    const validation = updateSalaryComponentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { componentName, componentType, calculationType, isTaxable, isActive } = validation.data
    const supabase = await createClient()

    // Check if salary component exists
    const { data: existingComponent, error: fetchError } = await supabase
      .from('salary_components')
      .select('id, component_name')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Salary component not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch salary component' }, { status: 500 })
    }

    // Check for duplicate name if updating name
    if (componentName && componentName !== existingComponent.component_name) {
      const { data: duplicateCheck } = await supabase
        .from('salary_components')
        .select('id')
        .eq('component_name', componentName)
        .neq('id', id)
        .single()

      if (duplicateCheck) {
        return NextResponse.json({
          error: 'A salary component with this name already exists'
        }, { status: 400 })
      }
    }

    // Build update object
    const updateData: any = {}
    if (componentName !== undefined) updateData.component_name = componentName
    if (componentType !== undefined) updateData.component_type = componentType
    if (calculationType !== undefined) updateData.calculation_type = calculationType
    if (isTaxable !== undefined) updateData.is_taxable = isTaxable
    if (isActive !== undefined) updateData.is_active = isActive

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update salary component
    const { data: updatedComponent, error: updateError } = await supabase
      .from('salary_components')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Component update error:', updateError)
      return NextResponse.json({ error: 'Failed to update salary component' }, { status: 500 })
    }

    // Get usage count
    const { count: usageCount } = await supabase
      .from('salary_structure_details')
      .select('*', { count: 'exact', head: true })
      .eq('salary_component_id', id)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'UPDATE_SALARY_COMPONENT',
      entity_type: 'salary_component',
      entity_id: id,
      details: {
        component_name: componentName || existingComponent.component_name,
        updated_fields: Object.keys(updateData)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedComponent,
        usage_count: usageCount || 0
      },
      message: 'Salary component updated successfully'
    })

  } catch (error) {
    console.error('Salary component update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payroll/salary-components/[id] - Delete salary component
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = params
    const supabase = await createClient()

    // Check if salary component exists
    const { data: existingComponent, error: fetchError } = await supabase
      .from('salary_components')
      .select('id, component_name')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Salary component not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch salary component' }, { status: 500 })
    }

    // Check if component is being used in salary structures
    const { data: structureUsage, error: usageError } = await supabase
      .from('salary_structure_details')
      .select('id')
      .eq('salary_component_id', id)
      .limit(1)

    if (usageError) {
      console.error('Usage check error:', usageError)
      return NextResponse.json({ error: 'Failed to check component usage' }, { status: 500 })
    }

    if (structureUsage && structureUsage.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete salary component as it is being used in salary structures'
      }, { status: 400 })
    }

    // Delete salary component
    const { error: deleteError } = await supabase
      .from('salary_components')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Component deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete salary component' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'DELETE_SALARY_COMPONENT',
      entity_type: 'salary_component',
      entity_id: id,
      details: { component_name: existingComponent.component_name }
    })

    return NextResponse.json({
      success: true,
      message: 'Salary component deleted successfully'
    })

  } catch (error) {
    console.error('Salary component deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}