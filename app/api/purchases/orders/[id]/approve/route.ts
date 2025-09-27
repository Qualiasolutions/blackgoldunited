import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Approval schema
const approvalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comments: z.string().optional(),
  level: z.number().min(1).max(3).default(1) // Support multi-level approvals
})

// POST /api/purchases/orders/[id]/approve - Approve or reject purchase order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize - require management or procurement roles
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check if user has approval permissions
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'PROCUREMENT_BD'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and PROCUREMENT_BD can approve purchase orders'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const { id: orderId } = await params
    const body = await request.json()

    // Validate request data
    const validationResult = approvalSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { status, comments, level } = validationResult.data

    // Get purchase order details
    const { data: purchaseOrder, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        poNumber,
        totalAmount,
        status,
        approvalStatus,
        requiresApproval,
        approvalThreshold,
        supplierId,
        supplier:suppliers(name)
      `)
      .eq('id', orderId)
      .is('deletedAt', null)
      .single()

    if (poError || !purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if approval is required and pending
    if (!purchaseOrder.requiresApproval) {
      return NextResponse.json({
        error: 'This purchase order does not require approval'
      }, { status: 400 })
    }

    if (purchaseOrder.approvalStatus !== 'PENDING') {
      return NextResponse.json({
        error: `Purchase order is already ${purchaseOrder.approvalStatus.toLowerCase()}`
      }, { status: 400 })
    }

    // Check approval threshold for MANAGEMENT role
    const requiresHighLevelApproval = purchaseOrder.totalAmount >= 50000 // $50k threshold
    if (requiresHighLevelApproval && userRole !== 'MANAGEMENT') {
      return NextResponse.json({
        error: 'Purchase orders above $50,000 require MANAGEMENT approval'
      }, { status: 403 })
    }

    // Check if user has already approved this PO
    const { data: existingApproval } = await supabase
      .from('purchase_order_approvals')
      .select('id')
      .eq('purchaseOrderId', orderId)
      .eq('approvedBy', authResult.user.id)
      .single()

    if (existingApproval) {
      return NextResponse.json({
        error: 'You have already provided approval for this purchase order'
      }, { status: 400 })
    }

    // Create approval record
    const { data: approval, error: approvalError } = await supabase
      .from('purchase_order_approvals')
      .insert([{
        purchaseOrderId: orderId,
        status,
        approvedBy: authResult.user.id,
        approvedAt: new Date().toISOString(),
        comments: comments || '',
        level,
        createdAt: new Date().toISOString()
      }])
      .select(`
        *,
        approver:users!purchase_order_approvals_approvedBy_fkey(
          id,
          firstName,
          lastName,
          email,
          role
        )
      `)
      .single()

    if (approvalError) {
      console.error('Approval creation error:', approvalError)
      return NextResponse.json({ error: 'Failed to create approval record' }, { status: 500 })
    }

    // Determine final approval status
    let finalApprovalStatus = 'PENDING'
    let poStatus = purchaseOrder.status

    if (status === 'REJECTED') {
      finalApprovalStatus = 'REJECTED'
      poStatus = 'CANCELLED'
    } else {
      // For APPROVED, check if we need additional approvals
      const { data: allApprovals } = await supabase
        .from('purchase_order_approvals')
        .select('status, level')
        .eq('purchaseOrderId', orderId)

      const approvedCount = allApprovals?.filter(a => a.status === 'APPROVED').length || 0

      // Simple approval logic - can be enhanced based on business rules
      if (userRole === 'MANAGEMENT' || !requiresHighLevelApproval) {
        finalApprovalStatus = 'APPROVED'
        poStatus = 'SENT' // Ready to send to supplier
      } else if (approvedCount >= 1 && requiresHighLevelApproval) {
        // Still needs MANAGEMENT approval
        finalApprovalStatus = 'PENDING'
      } else {
        finalApprovalStatus = 'APPROVED'
        poStatus = 'SENT'
      }
    }

    // Update purchase order status
    const { data: updatedPO, error: updateError } = await supabase
      .from('purchase_orders')
      .update({
        approvalStatus: finalApprovalStatus,
        status: poStatus,
        approvedAt: finalApprovalStatus === 'APPROVED' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      console.error('PO update error:', updateError)
      return NextResponse.json({ error: 'Failed to update purchase order status' }, { status: 500 })
    }

    // Create notification/activity log (optional - can be implemented later)
    const activityMessage = status === 'APPROVED'
      ? `Purchase Order ${purchaseOrder.poNumber} approved by ${authResult.user.firstName} ${authResult.user.lastName}`
      : `Purchase Order ${purchaseOrder.poNumber} rejected by ${authResult.user.firstName} ${authResult.user.lastName}`

    // Log activity (insert into activity_logs table if it exists)
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'purchase_order',
          entityId: orderId,
          action: status.toLowerCase(),
          description: activityMessage,
          userId: authResult.user.id,
          metadata: {
            poNumber: purchaseOrder.poNumber,
            totalAmount: purchaseOrder.totalAmount,
            supplierName: (purchaseOrder.supplier as any)?.name,
            comments
          },
          createdAt: new Date().toISOString()
        }])
    } catch (logError) {
      // Activity logging is optional - don't fail the request if it fails
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      data: {
        approval,
        purchaseOrder: updatedPO,
        message: `Purchase order ${status.toLowerCase()} successfully`
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/purchases/orders/[id]/approve - Get approval history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { id: orderId } = await params

    // Get all approvals for this PO
    const { data: approvals, error } = await supabase
      .from('purchase_order_approvals')
      .select(`
        *,
        approver:users!purchase_order_approvals_approvedBy_fkey(
          id,
          firstName,
          lastName,
          email,
          role
        )
      `)
      .eq('purchaseOrderId', orderId)
      .order('createdAt', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch approval history' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: approvals || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}