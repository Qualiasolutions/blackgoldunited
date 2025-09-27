import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Document approval validation schema
const approvalSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  comments: z.string().optional(),
  level: z.number().min(1).max(5).default(1)
})

// GET /api/documents/approvals - List document approvals
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
    const status = searchParams.get('status')
    const documentType = searchParams.get('documentType')
    const pending = searchParams.get('pending') === 'true'
    const assignedToMe = searchParams.get('assignedToMe') === 'true'

    // Build query
    let queryBuilder = supabase
      .from('document_approvals')
      .select(`
        *,
        document:documents(
          id,
          document_number,
          document_name,
          document_type,
          category,
          status,
          created_at,
          created_by_user:users!documents_created_by_fkey(
            first_name,
            last_name
          )
        ),
        requested_by_user:users!document_approvals_requested_by_fkey(
          first_name,
          last_name
        ),
        approved_by_user:users!document_approvals_approved_by_fkey(
          first_name,
          last_name
        ),
        approval_levels:document_approval_levels(
          level,
          approver_role,
          approver_id,
          status,
          comments,
          approved_at,
          approver:users!document_approval_levels_approver_id_fkey(
            first_name,
            last_name
          )
        )
      `)

    // Apply filters
    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    if (pending) {
      queryBuilder = queryBuilder.eq('status', 'PENDING')
    }

    if (assignedToMe) {
      // Get approvals where user is assigned as approver at current level
      queryBuilder = queryBuilder.eq('approval_levels.approver_id', authResult.user.id)
    }

    if (documentType) {
      queryBuilder = queryBuilder.eq('document.document_type', documentType)
    }

    const { data: approvals, error } = await queryBuilder
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch document approvals' }, { status: 500 })
    }

    // Get summary statistics
    const { data: allApprovals } = await supabase
      .from('document_approvals')
      .select('status')

    const statusSummary = allApprovals?.reduce((acc: any, approval: any) => {
      acc[approval.status] = (acc[approval.status] || 0) + 1
      return acc
    }, {})

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_DOCUMENT_APPROVALS',
      entity_type: 'document_approval',
      details: { status, document_type: documentType, pending, assigned_to_me: assignedToMe }
    })

    return NextResponse.json({
      success: true,
      data: approvals || [],
      summary: statusSummary
    })

  } catch (error) {
    console.error('Document approvals fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/documents/approvals - Submit document for approval or process approval
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'templates', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = approvalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { documentId, action, comments, level } = validation.data
    const supabase = await createClient()

    // Check if document exists
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (documentError || !document) {
      return NextResponse.json({
        error: 'Document not found'
      }, { status: 404 })
    }

    // Check if approval workflow exists
    const { data: existingApproval, error: approvalError } = await supabase
      .from('document_approvals')
      .select('*')
      .eq('document_id', documentId)
      .single()

    let approvalId = existingApproval?.id

    // If no approval workflow exists, create one
    if (!existingApproval) {
      const { data: newApproval, error: createError } = await supabase
        .from('document_approvals')
        .insert({
          document_id: documentId,
          status: 'PENDING',
          requested_by: authResult.user.id
        })
        .select()
        .single()

      if (createError) {
        console.error('Approval creation error:', createError)
        return NextResponse.json({ error: 'Failed to create approval workflow' }, { status: 500 })
      }

      approvalId = newApproval.id

      // Create approval levels based on document type
      const approvalLevels = getApprovalLevels(document.document_type)

      for (const levelConfig of approvalLevels) {
        await supabase.from('document_approval_levels').insert({
          approval_id: approvalId,
          level: levelConfig.level,
          approver_role: levelConfig.role,
          approver_id: levelConfig.approverId,
          status: 'PENDING'
        })
      }
    }

    // Process the approval action
    const result = await processApprovalAction(
      supabase,
      approvalId,
      documentId,
      action,
      level,
      authResult.user.id,
      comments
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: `DOCUMENT_${action}`,
      entity_type: 'document_approval',
      entity_id: approvalId,
      details: {
        document_number: document.document_number,
        document_name: document.document_name,
        action,
        level,
        comments
      }
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message
    })

  } catch (error) {
    console.error('Document approval processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get approval levels based on document type
function getApprovalLevels(documentType: string): Array<{ level: number, role: string, approverId?: string }> {
  const approvalConfigs: Record<string, Array<{ level: number, role: string }>> = {
    'CONTRACT': [
      { level: 1, role: 'ADMIN_HR' },
      { level: 2, role: 'MANAGEMENT' }
    ],
    'PROPOSAL': [
      { level: 1, role: 'PROCUREMENT_BD' },
      { level: 2, role: 'MANAGEMENT' }
    ],
    'CERTIFICATE': [
      { level: 1, role: 'IMS_QHSE' },
      { level: 2, role: 'MANAGEMENT' }
    ],
    'REPORT': [
      { level: 1, role: 'MANAGEMENT' }
    ]
  }

  return approvalConfigs[documentType] || [{ level: 1, role: 'MANAGEMENT' }]
}

// Helper function to process approval actions
async function processApprovalAction(
  supabase: any,
  approvalId: string,
  documentId: string,
  action: string,
  level: number,
  userId: string,
  comments?: string
): Promise<{ success: boolean, error?: string, data?: any, message?: string }> {

  // Update the specific approval level
  const { error: levelUpdateError } = await supabase
    .from('document_approval_levels')
    .update({
      status: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'CHANGES_REQUESTED',
      comments: comments || null,
      approved_at: new Date().toISOString(),
      approver_id: userId
    })
    .eq('approval_id', approvalId)
    .eq('level', level)

  if (levelUpdateError) {
    return { success: false, error: 'Failed to update approval level' }
  }

  // Check if all levels are approved or if any level is rejected
  const { data: levels } = await supabase
    .from('document_approval_levels')
    .select('status')
    .eq('approval_id', approvalId)
    .order('level')

  let overallStatus = 'PENDING'
  let documentStatus = 'REVIEW'

  if (action === 'REJECT') {
    overallStatus = 'REJECTED'
    documentStatus = 'DRAFT'
  } else if (action === 'REQUEST_CHANGES') {
    overallStatus = 'CHANGES_REQUESTED'
    documentStatus = 'DRAFT'
  } else if (levels?.every((l: any) => l.status === 'APPROVED')) {
    overallStatus = 'APPROVED'
    documentStatus = 'APPROVED'
  }

  // Update overall approval status
  const { error: approvalUpdateError } = await supabase
    .from('document_approvals')
    .update({
      status: overallStatus,
      approved_by: action === 'APPROVE' ? userId : null,
      approved_at: overallStatus === 'APPROVED' ? new Date().toISOString() : null,
      rejection_reason: action === 'REJECT' ? comments : null
    })
    .eq('id', approvalId)

  if (approvalUpdateError) {
    return { success: false, error: 'Failed to update approval status' }
  }

  // Update document status
  const { error: documentUpdateError } = await supabase
    .from('documents')
    .update({ status: documentStatus })
    .eq('id', documentId)

  if (documentUpdateError) {
    return { success: false, error: 'Failed to update document status' }
  }

  let message = ''
  switch (action) {
    case 'APPROVE':
      message = overallStatus === 'APPROVED' ? 'Document fully approved' : 'Level approved, pending further approval'
      break
    case 'REJECT':
      message = 'Document rejected'
      break
    case 'REQUEST_CHANGES':
      message = 'Changes requested for document'
      break
  }

  return {
    success: true,
    message,
    data: { status: overallStatus, document_status: documentStatus }
  }
}