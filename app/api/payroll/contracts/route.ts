import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Contract validation schema
const contractSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  salaryStructureId: z.string().uuid('Invalid salary structure ID').optional(),
  basicSalary: z.number().min(0, 'Basic salary must be positive'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().or(z.literal('')),
  contractType: z.enum(['PERMANENT', 'TEMPORARY', 'CONTRACT'], {
    errorMap: () => ({ message: 'Contract type must be PERMANENT, TEMPORARY, or CONTRACT' })
  }),
  workingHoursPerWeek: z.number().min(1).max(168).default(40),
  probationPeriod: z.number().min(0).max(12).default(0), // months
  noticePeriod: z.number().min(0).max(365).default(30), // days
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']).default('ACTIVE')
})

// Function to generate contract number
async function generateContractNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')

  // Get the count of contracts this month
  const { count } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true })
    .like('contract_number', `CON-${year}${month}-%`)

  const sequenceNumber = String((count || 0) + 1).padStart(4, '0')
  return `CON-${year}${month}-${sequenceNumber}`
}

// GET /api/payroll/contracts - List all contracts
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
    const contractType = searchParams.get('contractType')
    const status = searchParams.get('status')
    const departmentId = searchParams.get('departmentId')
    const offset = (page - 1) * limit

    // Build query with relations
    let queryBuilder = supabase
      .from('contracts')
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

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`
        contract_number.ilike.%${query}%,
        employee.first_name.ilike.%${query}%,
        employee.last_name.ilike.%${query}%,
        employee.employee_number.ilike.%${query}%
      `)
    }

    if (contractType) {
      queryBuilder = queryBuilder.eq('contract_type', contractType)
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    if (departmentId) {
      queryBuilder = queryBuilder.eq('employee.department_id', departmentId)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: contracts, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_CONTRACTS',
      entity_type: 'contract',
      details: { query, page, limit, total_count: totalCount }
    })

    return NextResponse.json({
      success: true,
      data: contracts || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      }
    })

  } catch (error) {
    console.error('Contracts fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payroll/contracts - Create new contract
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - payroll module access required
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = contractSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const {
      employeeId,
      salaryStructureId,
      basicSalary,
      startDate,
      endDate,
      contractType,
      workingHoursPerWeek,
      probationPeriod,
      noticePeriod,
      status
    } = validation.data

    const supabase = await createClient()

    // Verify employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, employee_number')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Verify salary structure exists if provided
    if (salaryStructureId) {
      const { data: salaryStructure, error: structureError } = await supabase
        .from('salary_structures')
        .select('id')
        .eq('id', salaryStructureId)
        .single()

      if (structureError || !salaryStructure) {
        return NextResponse.json({ error: 'Salary structure not found' }, { status: 404 })
      }
    }

    // Check for existing active contract for this employee
    const { data: existingContract } = await supabase
      .from('contracts')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('status', 'ACTIVE')
      .single()

    if (existingContract) {
      return NextResponse.json({
        error: 'Employee already has an active contract. Please terminate the existing contract first.'
      }, { status: 400 })
    }

    // Generate contract number
    const contractNumber = await generateContractNumber(supabase)

    // Create contract
    const { data: contract, error: createError } = await supabase
      .from('contracts')
      .insert({
        contract_number: contractNumber,
        employee_id: employeeId,
        salary_structure_id: salaryStructureId || null,
        basic_salary: basicSalary,
        start_date: startDate,
        end_date: endDate || null,
        contract_type: contractType,
        working_hours_per_week: workingHoursPerWeek,
        probation_period: probationPeriod,
        notice_period: noticePeriod,
        status: status,
        created_by: authResult.user.id
      })
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

    if (createError) {
      console.error('Contract creation error:', createError)
      return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_CONTRACT',
      entity_type: 'contract',
      entity_id: contract.id,
      details: {
        contract_number: contractNumber,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        contract_type: contractType,
        basic_salary: basicSalary
      }
    })

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'Contract created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Contract creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}