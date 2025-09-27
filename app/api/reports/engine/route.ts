import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Report definition schema
const reportDefinitionSchema = z.object({
  reportName: z.string().min(1, 'Report name is required').max(255),
  reportCode: z.string().min(1, 'Report code is required').max(50),
  category: z.enum(['FINANCIAL', 'SALES', 'INVENTORY', 'HR', 'PAYROLL', 'QHSE', 'OPERATIONAL', 'EXECUTIVE']),
  description: z.string().min(1, 'Description is required'),
  dataSource: z.object({
    tables: z.array(z.string()),
    joins: z.array(z.object({
      table: z.string(),
      condition: z.string()
    })).optional(),
    filters: z.array(z.object({
      field: z.string(),
      operator: z.enum(['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'BETWEEN']),
      value: z.any()
    })).optional()
  }),
  columns: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'CURRENCY']),
    aggregation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX', 'NONE']).optional(),
    format: z.string().optional()
  })),
  parameters: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(['TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN']),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
    options: z.array(z.string()).optional()
  })).default([]),
  scheduling: z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']).optional(),
    time: z.string().optional(),
    recipients: z.array(z.string().email()).optional()
  }).optional(),
  accessRoles: z.array(z.enum(['MANAGEMENT', 'FINANCE_TEAM', 'PROCUREMENT_BD', 'ADMIN_HR', 'IMS_QHSE'])),
  isActive: z.boolean().default(true)
})

// GET /api/reports/engine - List all report definitions
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'reports', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const query = searchParams.get('query') || ''
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const hasAccess = searchParams.get('hasAccess') === 'true'
    const offset = (page - 1) * limit

    // Build query
    let queryBuilder = supabase
      .from('report_definitions')
      .select(`
        *,
        created_by_user:users!report_definitions_created_by_fkey(
          first_name,
          last_name
        ),
        executions_count:report_executions(count),
        last_execution:report_executions(
          id,
          executed_at,
          status,
          executed_by_user:users!report_executions_executed_by_fkey(first_name, last_name)
        )
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`report_name.ilike.%${query}%,description.ilike.%${query}%,report_code.ilike.%${query}%`)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    if (isActive !== null) {
      queryBuilder = queryBuilder.eq('is_active', isActive === 'true')
    }

    if (hasAccess) {
      // Filter reports user has access to based on role
      queryBuilder = queryBuilder.contains('access_roles', [authResult.user.role])
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('report_definitions')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: reports, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch report definitions' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Get report statistics
    const { data: allReports } = await supabase
      .from('report_definitions')
      .select('category, is_active, access_roles')

    const statistics = {
      total: allReports?.length || 0,
      active: allReports?.filter(r => r.is_active).length || 0,
      byCategory: allReports?.reduce((acc: any, report: any) => {
        acc[report.category] = (acc[report.category] || 0) + 1
        return acc
      }, {}) || {},
      accessible: allReports?.filter(r => r.access_roles?.includes(authResult.user.role)).length || 0
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_REPORT_DEFINITIONS',
      entity_type: 'report_definition',
      details: { page, limit, query, category, has_access: hasAccess }
    })

    return NextResponse.json({
      success: true,
      data: reports || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      },
      statistics
    })

  } catch (error) {
    console.error('Report definitions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reports/engine - Create new report definition
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'reports', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = reportDefinitionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const {
      reportName,
      reportCode,
      category,
      description,
      dataSource,
      columns,
      parameters,
      scheduling,
      accessRoles,
      isActive
    } = validation.data

    const supabase = await createClient()

    // Check if report code already exists
    const { data: existingReport } = await supabase
      .from('report_definitions')
      .select('report_code')
      .eq('report_code', reportCode)
      .single()

    if (existingReport) {
      return NextResponse.json({
        error: 'Report code already exists'
      }, { status: 400 })
    }

    // Validate data source tables exist (basic validation)
    const validTables = [
      'clients', 'employees', 'products', 'invoices', 'purchase_orders',
      'attendance_logs', 'pay_slips', 'journal_entries', 'bank_accounts',
      'qhse_policies', 'documents', 'suppliers'
    ]

    for (const table of dataSource.tables) {
      if (!validTables.includes(table)) {
        return NextResponse.json({
          error: `Invalid table: ${table}`
        }, { status: 400 })
      }
    }

    // Create report definition
    const { data: report, error: createError } = await supabase
      .from('report_definitions')
      .insert({
        report_name: reportName,
        report_code: reportCode,
        category,
        description,
        data_source: dataSource,
        columns,
        parameters: parameters || [],
        scheduling: scheduling || null,
        access_roles: accessRoles,
        is_active: isActive,
        created_by: authResult.user.id
      })
      .select(`
        *,
        created_by_user:users!report_definitions_created_by_fkey(
          first_name,
          last_name
        )
      `)
      .single()

    if (createError) {
      console.error('Report definition creation error:', createError)
      return NextResponse.json({ error: 'Failed to create report definition' }, { status: 500 })
    }

    // If scheduling is enabled, create scheduled job
    if (scheduling?.enabled) {
      await supabase.from('scheduled_reports').insert({
        report_id: report.id,
        frequency: scheduling.frequency,
        time: scheduling.time,
        recipients: scheduling.recipients || [],
        is_active: true,
        created_by: authResult.user.id
      })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_REPORT_DEFINITION',
      entity_type: 'report_definition',
      entity_id: report.id,
      details: {
        report_name: reportName,
        report_code: reportCode,
        category,
        tables_used: dataSource.tables,
        columns_count: columns.length,
        parameters_count: parameters?.length || 0,
        scheduling_enabled: scheduling?.enabled || false
      }
    })

    return NextResponse.json({
      success: true,
      data: report,
      message: 'Report definition created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Report definition creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}