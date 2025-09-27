import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Compliance form field schema
const formFieldSchema = z.object({
  fieldName: z.string().min(1, 'Field name is required'),
  fieldType: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'TEXTAREA', 'FILE']),
  label: z.string().min(1, 'Field label is required'),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional()
  }).optional()
})

// Compliance form validation schema
const complianceFormSchema = z.object({
  formName: z.string().min(1, 'Form name is required').max(255),
  formCode: z.string().min(1, 'Form code is required').max(50),
  category: z.enum(['QUALITY', 'HEALTH', 'SAFETY', 'ENVIRONMENT', 'AUDIT', 'INSPECTION', 'INCIDENT', 'TRAINING']),
  description: z.string().min(1, 'Description is required'),
  fields: z.array(formFieldSchema).min(1, 'At least one field is required'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'AS_NEEDED']),
  deadline: z.number().min(1).max(365).optional(), // Days after creation
  assignedRoles: z.array(z.enum(['MANAGEMENT', 'FINANCE_TEAM', 'PROCUREMENT_BD', 'ADMIN_HR', 'IMS_QHSE'])).default(['IMS_QHSE']),
  isActive: z.boolean().default(true),
  autoReminders: z.boolean().default(true),
  tags: z.array(z.string()).default([])
})

// GET /api/qhse/compliance-forms - List all compliance forms
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'qhse', 'GET')
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
    const frequency = searchParams.get('frequency')
    const isActive = searchParams.get('isActive')
    const assignedToMe = searchParams.get('assignedToMe') === 'true'
    const offset = (page - 1) * limit

    // Build query
    let queryBuilder = supabase
      .from('qhse_compliance_forms')
      .select(`
        *,
        created_by_user:users!qhse_compliance_forms_created_by_fkey(
          first_name,
          last_name
        ),
        submissions_count:qhse_form_submissions(count),
        pending_submissions:qhse_form_submissions(count),
        latest_submission:qhse_form_submissions(
          id,
          submitted_at,
          status,
          submitted_by_user:users!qhse_form_submissions_submitted_by_fkey(first_name, last_name)
        )
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`form_name.ilike.%${query}%,description.ilike.%${query}%,form_code.ilike.%${query}%`)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    if (frequency) {
      queryBuilder = queryBuilder.eq('frequency', frequency)
    }

    if (isActive !== null) {
      queryBuilder = queryBuilder.eq('is_active', isActive === 'true')
    }

    if (assignedToMe) {
      queryBuilder = queryBuilder.contains('assigned_roles', [authResult.user.role])
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('qhse_compliance_forms')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: forms, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch compliance forms' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Get compliance statistics
    const { data: allForms } = await supabase
      .from('qhse_compliance_forms')
      .select('category, frequency, is_active')

    const statistics = {
      total: allForms?.length || 0,
      active: allForms?.filter(f => f.is_active).length || 0,
      byCategory: allForms?.reduce((acc: any, form: any) => {
        acc[form.category] = (acc[form.category] || 0) + 1
        return acc
      }, {}) || {},
      byFrequency: allForms?.reduce((acc: any, form: any) => {
        acc[form.frequency] = (acc[form.frequency] || 0) + 1
        return acc
      }, {}) || {}
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_COMPLIANCE_FORMS',
      entity_type: 'compliance_form',
      details: { page, limit, query, category, frequency, assigned_to_me: assignedToMe }
    })

    return NextResponse.json({
      success: true,
      data: forms || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      },
      statistics
    })

  } catch (error) {
    console.error('Compliance forms fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/qhse/compliance-forms - Create new compliance form
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'qhse', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = complianceFormSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const {
      formName,
      formCode,
      category,
      description,
      fields,
      frequency,
      deadline,
      assignedRoles,
      isActive,
      autoReminders,
      tags
    } = validation.data

    const supabase = await createClient()

    // Check if form code already exists
    const { data: existingForm } = await supabase
      .from('qhse_compliance_forms')
      .select('form_code')
      .eq('form_code', formCode)
      .single()

    if (existingForm) {
      return NextResponse.json({
        error: 'Form code already exists'
      }, { status: 400 })
    }

    // Validate field configurations
    for (const field of fields) {
      if (field.fieldType === 'SELECT' && (!field.options || field.options.length === 0)) {
        return NextResponse.json({
          error: `SELECT field '${field.fieldName}' must have options`
        }, { status: 400 })
      }
    }

    // Create compliance form
    const { data: form, error: createError } = await supabase
      .from('qhse_compliance_forms')
      .insert({
        form_name: formName,
        form_code: formCode,
        category,
        description,
        fields,
        frequency,
        deadline: deadline || null,
        assigned_roles: assignedRoles,
        is_active: isActive,
        auto_reminders: autoReminders,
        tags: tags || [],
        created_by: authResult.user.id
      })
      .select(`
        *,
        created_by_user:users!qhse_compliance_forms_created_by_fkey(
          first_name,
          last_name
        )
      `)
      .single()

    if (createError) {
      console.error('Compliance form creation error:', createError)
      return NextResponse.json({ error: 'Failed to create compliance form' }, { status: 500 })
    }

    // Create scheduled instances based on frequency
    if (frequency !== 'AS_NEEDED') {
      await createScheduledInstances(supabase, form.id, frequency, deadline)
    }

    // Create audit trail entry
    await supabase.from('qhse_audit_trail').insert({
      entity_type: 'COMPLIANCE_FORM',
      entity_id: form.id,
      action: 'CREATED',
      old_values: null,
      new_values: {
        form_name: formName,
        form_code: formCode,
        category,
        frequency
      },
      changed_by: authResult.user.id
    })

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_COMPLIANCE_FORM',
      entity_type: 'compliance_form',
      entity_id: form.id,
      details: {
        form_name: formName,
        form_code: formCode,
        category,
        frequency,
        fields_count: fields.length
      }
    })

    return NextResponse.json({
      success: true,
      data: form,
      message: 'Compliance form created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Compliance form creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to create scheduled instances
async function createScheduledInstances(
  supabase: any,
  formId: string,
  frequency: string,
  deadline?: number
): Promise<void> {
  const instances = []
  const now = new Date()
  const currentYear = now.getFullYear()

  let nextDate = new Date(now)
  nextDate.setHours(0, 0, 0, 0)

  // Generate instances for the next 12 months
  for (let i = 0; i < 12; i++) {
    let dueDate = new Date(nextDate)

    switch (frequency) {
      case 'DAILY':
        dueDate.setDate(dueDate.getDate() + 1)
        break
      case 'WEEKLY':
        dueDate.setDate(dueDate.getDate() + 7)
        break
      case 'MONTHLY':
        dueDate.setMonth(dueDate.getMonth() + 1)
        break
      case 'QUARTERLY':
        dueDate.setMonth(dueDate.getMonth() + 3)
        break
      case 'ANNUALLY':
        dueDate.setFullYear(dueDate.getFullYear() + 1)
        break
      default:
        return // AS_NEEDED doesn't need scheduled instances
    }

    // Calculate deadline if specified
    let deadlineDate = null
    if (deadline) {
      deadlineDate = new Date(dueDate)
      deadlineDate.setDate(deadlineDate.getDate() + deadline)
    }

    instances.push({
      form_id: formId,
      due_date: dueDate.toISOString().split('T')[0],
      deadline_date: deadlineDate?.toISOString().split('T')[0] || null,
      status: 'PENDING',
      created_at: new Date().toISOString()
    })

    nextDate = new Date(dueDate)

    // Stop generating for daily forms after 30 instances
    if (frequency === 'DAILY' && i >= 30) break
    // Stop generating for weekly forms after 52 instances
    if (frequency === 'WEEKLY' && i >= 52) break
  }

  if (instances.length > 0) {
    await supabase.from('qhse_form_instances').insert(instances)
  }
}