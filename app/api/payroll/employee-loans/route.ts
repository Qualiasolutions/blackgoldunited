import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Employee loan validation schema
const employeeLoanSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  loanType: z.enum(['PERSONAL', 'SALARY_ADVANCE', 'EQUIPMENT', 'EMERGENCY'], {
    errorMap: () => ({ message: 'Loan type must be PERSONAL, SALARY_ADVANCE, EQUIPMENT, or EMERGENCY' })
  }),
  loanAmount: z.number().min(1, 'Loan amount must be positive'),
  interestRate: z.number().min(0).max(50).default(0),
  repaymentMonths: z.number().min(1).max(120, 'Maximum repayment period is 120 months'),
  startDate: z.string().min(1, 'Start date is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
  guarantorInfo: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED']).default('PENDING')
})

// Function to generate loan number
async function generateLoanNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')

  // Get the count of loans this month
  const { count } = await supabase
    .from('employee_loans')
    .select('*', { count: 'exact', head: true })
    .like('loan_number', `LOAN-${year}${month}-%`)

  const sequenceNumber = String((count || 0) + 1).padStart(4, '0')
  return `LOAN-${year}${month}-${sequenceNumber}`
}

// Function to calculate loan installments
function calculateInstallments(amount: number, months: number, interestRate: number) {
  if (interestRate === 0) {
    return {
      monthlyInstallment: amount / months,
      totalAmount: amount,
      totalInterest: 0
    }
  }

  const monthlyRate = interestRate / 100 / 12
  const monthlyInstallment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                            (Math.pow(1 + monthlyRate, months) - 1)
  const totalAmount = monthlyInstallment * months
  const totalInterest = totalAmount - amount

  return {
    monthlyInstallment: Math.round(monthlyInstallment * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100
  }
}

// GET /api/payroll/employee-loans - List all employee loans
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
    const loanType = searchParams.get('loanType')
    const status = searchParams.get('status')
    const employeeId = searchParams.get('employeeId')
    const offset = (page - 1) * limit

    // Build query with relations
    let queryBuilder = supabase
      .from('employee_loans')
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
        created_by_user:users!employee_loans_created_by_fkey(first_name, last_name)
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`
        loan_number.ilike.%${query}%,
        employee.first_name.ilike.%${query}%,
        employee.last_name.ilike.%${query}%,
        employee.employee_number.ilike.%${query}%,
        reason.ilike.%${query}%
      `)
    }

    if (loanType) {
      queryBuilder = queryBuilder.eq('loan_type', loanType)
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    if (employeeId) {
      queryBuilder = queryBuilder.eq('employee_id', employeeId)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('employee_loans')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: loans, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch employee loans' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_EMPLOYEE_LOANS',
      entity_type: 'employee_loan',
      details: { query, page, limit, total_count: totalCount }
    })

    return NextResponse.json({
      success: true,
      data: loans || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      }
    })

  } catch (error) {
    console.error('Employee loans fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payroll/employee-loans - Create new employee loan
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - payroll module access required
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = employeeLoanSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const {
      employeeId,
      loanType,
      loanAmount,
      interestRate,
      repaymentMonths,
      startDate,
      reason,
      guarantorInfo,
      status
    } = validation.data

    const supabase = await createClient()

    // Verify employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, employee_number, basic_salary')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check for existing active loans limit (max 3 active loans per employee)
    const { count: activeLoanCount } = await supabase
      .from('employee_loans')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .in('status', ['PENDING', 'APPROVED', 'DISBURSED'])

    if (activeLoanCount && activeLoanCount >= 3) {
      return NextResponse.json({
        error: 'Employee already has maximum number of active loans (3)'
      }, { status: 400 })
    }

    // Calculate loan details
    const calculations = calculateInstallments(loanAmount, repaymentMonths, interestRate)

    // Generate loan number
    const loanNumber = await generateLoanNumber(supabase)

    // Create loan
    const { data: loan, error: createError } = await supabase
      .from('employee_loans')
      .insert({
        loan_number: loanNumber,
        employee_id: employeeId,
        loan_type: loanType,
        loan_amount: loanAmount,
        interest_rate: interestRate,
        repayment_months: repaymentMonths,
        monthly_installment: calculations.monthlyInstallment,
        total_amount: calculations.totalAmount,
        start_date: startDate,
        reason: reason,
        guarantor_info: guarantorInfo || null,
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
        created_by_user:users!employee_loans_created_by_fkey(first_name, last_name)
      `)
      .single()

    if (createError) {
      console.error('Loan creation error:', createError)
      return NextResponse.json({ error: 'Failed to create employee loan' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_EMPLOYEE_LOAN',
      entity_type: 'employee_loan',
      entity_id: loan.id,
      details: {
        loan_number: loanNumber,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        loan_type: loanType,
        loan_amount: loanAmount
      }
    })

    return NextResponse.json({
      success: true,
      data: loan,
      message: 'Employee loan created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Employee loan creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}