import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Document validation schema
const documentSchema = z.object({
  documentName: z.string().min(1, 'Document name is required').max(255),
  documentType: z.enum(['CONTRACT', 'INVOICE', 'REPORT', 'CERTIFICATE', 'LETTER', 'MEMO', 'PROPOSAL', 'OTHER']),
  category: z.string().min(1, 'Category is required').max(50),
  templateId: z.string().uuid().optional(),
  content: z.string().optional(),
  variables: z.record(z.string(), z.any()).default({}),
  tags: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  accessLevel: z.enum(['PUBLIC', 'PRIVATE', 'DEPARTMENT']).default('PRIVATE'),
  expiryDate: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().uuid().optional()
})

// GET /api/documents - List all documents
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
    const documentType = searchParams.get('documentType')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const createdBy = searchParams.get('createdBy')
    const offset = (page - 1) * limit

    // Build query
    let queryBuilder = supabase
      .from('documents')
      .select(`
        *,
        template:document_templates(
          id,
          template_name,
          template_type
        ),
        created_by_user:users!documents_created_by_fkey(
          first_name,
          last_name
        ),
        versions_count:document_versions(count),
        latest_version:document_versions(
          version_number,
          created_at,
          created_by_user:users!document_versions_created_by_fkey(first_name, last_name)
        )
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`document_name.ilike.%${query}%,content.ilike.%${query}%`)
    }

    if (documentType) {
      queryBuilder = queryBuilder.eq('document_type', documentType)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    if (createdBy) {
      queryBuilder = queryBuilder.eq('created_by', createdBy)
    }

    // Apply access level filter based on user role
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      queryBuilder = queryBuilder.or(`access_level.eq.PUBLIC,access_level.eq.DEPARTMENT,created_by.eq.${authResult.user.id}`)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: documents, error } = await queryBuilder
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Get summary statistics
    const { data: statusCounts } = await supabase
      .from('documents')
      .select('status')

    const statusSummary = statusCounts?.reduce((acc: any, doc: any) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1
      return acc
    }, {})

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_DOCUMENTS',
      entity_type: 'document',
      details: { page, limit, query, document_type: documentType, category, status }
    })

    return NextResponse.json({
      success: true,
      data: documents || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      },
      summary: statusSummary
    })

  } catch (error) {
    console.error('Documents fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/documents - Create new document
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'templates', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = documentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const {
      documentName,
      documentType,
      category,
      templateId,
      content,
      variables,
      tags,
      status,
      accessLevel,
      expiryDate,
      relatedEntityType,
      relatedEntityId
    } = validation.data

    const supabase = await createClient()

    // If template is specified, get template content and merge with variables
    let finalContent = content
    let templateData = null

    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (templateError || !template) {
        return NextResponse.json({
          error: 'Template not found'
        }, { status: 400 })
      }

      templateData = template
      finalContent = processTemplateContent(template.content, variables)
    }

    // Generate document number
    const documentNumber = await generateDocumentNumber(supabase, documentType)

    // Create document
    const { data: document, error: createError } = await supabase
      .from('documents')
      .insert({
        document_number: documentNumber,
        document_name: documentName,
        document_type: documentType,
        category,
        template_id: templateId || null,
        content: finalContent,
        variables,
        tags: tags || [],
        status,
        access_level: accessLevel,
        expiry_date: expiryDate || null,
        related_entity_type: relatedEntityType || null,
        related_entity_id: relatedEntityId || null,
        created_by: authResult.user.id
      })
      .select(`
        *,
        template:document_templates(
          id,
          template_name,
          template_type
        ),
        created_by_user:users!documents_created_by_fkey(
          first_name,
          last_name
        )
      `)
      .single()

    if (createError) {
      console.error('Document creation error:', createError)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    // Create initial version
    await supabase.from('document_versions').insert({
      document_id: document.id,
      version_number: '1.0',
      content: finalContent,
      variables,
      change_notes: 'Initial version',
      created_by: authResult.user.id
    })

    // If this is a workflow document, create approval record
    if (['CONTRACT', 'PROPOSAL', 'CERTIFICATE'].includes(documentType)) {
      await supabase.from('document_approvals').insert({
        document_id: document.id,
        status: 'PENDING',
        requested_by: authResult.user.id,
        created_at: new Date().toISOString()
      })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_DOCUMENT',
      entity_type: 'document',
      entity_id: document.id,
      details: {
        document_name: documentName,
        document_type: documentType,
        category,
        template_used: !!templateId,
        status
      }
    })

    return NextResponse.json({
      success: true,
      data: document,
      message: 'Document created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Document creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to process template content with variables
function processTemplateContent(templateContent: string, variables: Record<string, any>): string {
  let processedContent = templateContent

  // Replace {{variable}} placeholders with actual values
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`
    const value = variables[key] || ''
    processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value)
  })

  // Add current date processing
  const currentDate = new Date().toLocaleDateString()
  processedContent = processedContent.replace(/\{\{current_date\}\}/g, currentDate)

  return processedContent
}

// Helper function to generate document number
async function generateDocumentNumber(supabase: any, documentType: string): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')

  const prefix = getDocumentTypePrefix(documentType)

  // Get count of documents of this type for this month
  const { count } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('document_type', documentType)
    .gte('created_at', `${year}-${month}-01`)
    .lt('created_at', `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`)

  const sequenceNumber = String((count || 0) + 1).padStart(4, '0')
  return `${prefix}-${year}${month}-${sequenceNumber}`
}

function getDocumentTypePrefix(documentType: string): string {
  const prefixes: Record<string, string> = {
    'CONTRACT': 'CON',
    'INVOICE': 'INV',
    'REPORT': 'RPT',
    'CERTIFICATE': 'CRT',
    'LETTER': 'LTR',
    'MEMO': 'MEM',
    'PROPOSAL': 'PRO',
    'OTHER': 'DOC'
  }
  return prefixes[documentType] || 'DOC'
}