import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update contract validation schema
const updateContractSchema = z.object({
  salaryStructureId: z.string().uuid().optional(),
  basicSalary: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().or(z.literal('')),
  contractType: z.enum(['PERMANENT', 'TEMPORARY', 'CONTRACT']).optional(),
  workingHoursPerWeek: z.number().min(1).max(168).optional(),
  probationPeriod: z.number().min(0).max(12).optional(),
  noticePeriod: z.number().min(0).max(365).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']).optional()
})

// GET /api/payroll/contracts/[id] - Get single contract
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

    // Fetch contract with full details
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        *,
        employee:employees(
          id,
          employee_number,
          first_name,
          last_name,
          email,
          phone,
          hire_date,
          department:departments(id, name),
          designation:designations(id, title)
        ),
        salary_structure:salary_structures(
          id,
          structure_name,
          structure_details:salary_structure_details(
            id,
            amount,
            percentage,
            formula,
            component:salary_components(id, component_name, component_type, calculation_type)
          )
        ),
        created_by_user:users!contracts_created_by_fkey(first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
    }

    // Calculate contract duration and status
    const startDate = new Date(contract.start_date)
    const endDate = contract.end_date ? new Date(contract.end_date) : null
    const today = new Date()

    const contractInfo = {
      ...contract,
      duration_days: endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null,
      days_remaining: endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null,
      is_expired: endDate ? endDate < today : false,
      years_of_service: Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'VIEW_CONTRACT',
      entity_type: 'contract',
      entity_id: id,
      details: {
        contract_number: contract.contract_number,
        employee_name: `${contract.employee.first_name} ${contract.employee.last_name}`
      }
    })

    return NextResponse.json({
      success: true,
      data: contractInfo
    })

  } catch (error) {
    console.error('Contract fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/payroll/contracts/[id] - Update contract
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
    const validation = updateContractSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const updateData = validation.data
    const supabase = await createClient()

    // Check if contract exists
    const { data: existingContract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, contract_number, employee_id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
    }

    // Verify salary structure exists if updating
    if (updateData.salaryStructureId) {
      const { data: salaryStructure, error: structureError } = await supabase
        .from('salary_structures')
        .select('id')
        .eq('id', updateData.salaryStructureId)
        .single()

      if (structureError || !salaryStructure) {
        return NextResponse.json({ error: 'Salary structure not found' }, { status: 404 })
      }
    }

    // Build update object
    const contractUpdateData: any = {}
    if (updateData.salaryStructureId !== undefined) {
      contractUpdateData.salary_structure_id = updateData.salaryStructureId || null
    }
    if (updateData.basicSalary !== undefined) contractUpdateData.basic_salary = updateData.basicSalary
    if (updateData.startDate !== undefined) contractUpdateData.start_date = updateData.startDate
    if (updateData.endDate !== undefined) {
      contractUpdateData.end_date = updateData.endDate || null
    }
    if (updateData.contractType !== undefined) contractUpdateData.contract_type = updateData.contractType
    if (updateData.workingHoursPerWeek !== undefined) contractUpdateData.working_hours_per_week = updateData.workingHoursPerWeek
    if (updateData.probationPeriod !== undefined) contractUpdateData.probation_period = updateData.probationPeriod
    if (updateData.noticePeriod !== undefined) contractUpdateData.notice_period = updateData.noticePeriod
    if (updateData.status !== undefined) contractUpdateData.status = updateData.status

    if (Object.keys(contractUpdateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update contract
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update(contractUpdateData)
      .eq('id', id)
      .select(`
        *,
        employee:employees(
          id,
          employee_number,
          first_name,
          last_name,
          email,
          department:departments(id, name),
          designation:designations(id, title)
        ),
        salary_structure:salary_structures(id, structure_name),
        created_by_user:users!contracts_created_by_fkey(first_name, last_name)
      `)
      .single()

    if (updateError) {
      console.error('Contract update error:', updateError)
      return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'UPDATE_CONTRACT',
      entity_type: 'contract',
      entity_id: id,
      details: {
        contract_number: existingContract.contract_number,
        updated_fields: Object.keys(contractUpdateData),
        previous_status: existingContract.status,
        new_status: updateData.status || existingContract.status
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedContract,
      message: 'Contract updated successfully'
    })

  } catch (error) {
    console.error('Contract update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payroll/contracts/[id] - Delete contract
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

    // Check if contract exists
    const { data: existingContract, error: fetchError } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        employee_id,
        status,
        employee:employees(first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
    }

    // Check if contract is being used in payroll
    const { data: payslipUsage, error: payslipError } = await supabase
      .from('pay_slips')
      .select('id')
      .eq('employee_id', existingContract.employee_id)
      .limit(1)

    if (payslipError) {
      console.error('Payslip check error:', payslipError)
      return NextResponse.json({ error: 'Failed to check contract usage' }, { status: 500 })
    }

    if (payslipUsage && payslipUsage.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete contract as it has associated payroll records. Consider terminating the contract instead.'
      }, { status: 400 })
    }

    // Delete contract
    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Contract deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'DELETE_CONTRACT',
      entity_type: 'contract',
      entity_id: id,
      details: {
        contract_number: existingContract.contract_number,
        employee_name: `${existingContract.employee.first_name} ${existingContract.employee.last_name}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Contract deleted successfully'
    })

  } catch (error) {
    console.error('Contract deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}