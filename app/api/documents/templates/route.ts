import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Document template validation schema
const templateSchema = z.object({
  templateName: z.string().min(1, 'Template name is required').max(100),
  templateType: z.enum(['INVOICE', 'CONTRACT', 'LETTER', 'REPORT', 'CERTIFICATE', 'MEMO', 'PROPOSAL', 'OTHER']),
  category: z.string().min(1, 'Category is required').max(50),
  content: z.string().min(1, 'Template content is required'),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  accessLevel: z.enum(['PUBLIC', 'PRIVATE', 'DEPARTMENT']).default('PUBLIC')
})

// GET /api/documents/templates - List all document templates
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'templates', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const query = searchParams.get('query') || ''
    const templateType = searchParams.get('templateType')
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const offset = (page - 1) * limit

    // Build query
    let queryBuilder = supabase
      .from('document_templates')
      .select(`
        *,
        created_by_user:users!document_templates_created_by_fkey(
          first_name,
          last_name
        ),
        usage_count:documents(count)
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`template_name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    if (templateType) {
      queryBuilder = queryBuilder.eq('template_type', templateType)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    if (isActive !== null) {
      queryBuilder = queryBuilder.eq('is_active', isActive === 'true')
    }

    // Apply access level filter based on user role
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      queryBuilder = queryBuilder.in('access_level', ['PUBLIC', 'DEPARTMENT'])
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('document_templates')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: templates, error } = await queryBuilder
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch document templates' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Get categories for filter
    const { data: categories } = await supabase
      .from('document_templates')
      .select('category')
      .eq('is_active', true)

    const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])]

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_DOCUMENT_TEMPLATES',
      entity_type: 'document_template',
      details: { page, limit, query, template_type: templateType, category }
    })

    return NextResponse.json({
      success: true,
      data: templates || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      },
      categories: uniqueCategories
    })

  } catch (error) {
    console.error('Document templates fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/documents/templates - Create new document template
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'templates', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = templateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { templateName, templateType, category, content, variables, isActive, description, tags, accessLevel } = validation.data
    const supabase = await createClient()

    // Check if template name already exists in the same category
    const { data: existingTemplate } = await supabase
      .from('document_templates')
      .select('template_name, category')
      .eq('template_name', templateName)
      .eq('category', category)
      .single()

    if (existingTemplate) {
      return NextResponse.json({
        error: 'Template with this name already exists in the category'
      }, { status: 400 })
    }

    // Extract variables from template content if not provided
    let templateVariables = variables
    if (templateVariables.length === 0) {
      const variableMatches = content.match(/\{\{(\w+)\}\}/g)
      if (variableMatches) {
        templateVariables = variableMatches.map(match => match.slice(2, -2))
        templateVariables = [...new Set(templateVariables)] // Remove duplicates
      }
    }

    // Generate template code
    const templateCode = `${templateType.substring(0, 3)}-${Date.now().toString().slice(-6)}`

    // Create template
    const { data: template, error: createError } = await supabase
      .from('document_templates')
      .insert({
        template_code: templateCode,
        template_name: templateName,
        template_type: templateType,
        category,
        content,
        variables: templateVariables,
        is_active: isActive,
        description: description || null,
        tags: tags || [],
        access_level: accessLevel,
        created_by: authResult.user.id
      })
      .select(`
        *,
        created_by_user:users!document_templates_created_by_fkey(
          first_name,
          last_name
        )
      `)
      .single()

    if (createError) {
      console.error('Template creation error:', createError)
      return NextResponse.json({ error: 'Failed to create document template' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_DOCUMENT_TEMPLATE',
      entity_type: 'document_template',
      entity_id: template.id,
      details: {
        template_name: templateName,
        template_type: templateType,
        category,
        variables_count: templateVariables.length
      }
    })

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Document template created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Document template creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}