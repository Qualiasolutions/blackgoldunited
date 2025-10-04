import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Purchase Order Item update schema
const purchaseOrderItemUpdateSchema = z.object({
  productId: z.string().uuid().optional(),
  quantity: z.number().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
  description: z.string().optional(),
  expectedDeliveryDate: z.string().datetime().optional(),
  receivedQuantity: z.number().min(0).optional()
})

// Purchase Order update schema
const purchaseOrderUpdateSchema = z.object({
  expectedDeliveryDate: z.string().datetime().optional(),
  items: z.array(z.object({
    id: z.string().uuid().optional(), // For existing items
    productId: z.string().uuid(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    description: z.string().optional(),
    expectedDeliveryDate: z.string().datetime().optional(),
    receivedQuantity: z.number().min(0).optional()
  })).optional(),
  paymentTerms: z.enum(['NET_15', 'NET_30', 'NET_45', 'NET_60', 'COD', 'ADVANCE']).optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
  deliveryAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  shipping_cost: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  status: z.enum(['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/purchases/orders/[id] - Get single purchase order
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { id: orderId } = await params

    // Get purchase order with all related data
    const { data: purchaseOrder, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(
          id,
          name,
          supplierCode,
          email,
          phone,
          address,
          city,
          state,
          country,
          contactPersonName,
          contactPersonEmail,
          contactPersonPhone
        ),
        items:purchase_order_items(
          id,
          productId,
          quantity,
          unitPrice,
          totalAmount,
          description,
          expectedDeliveryDate,
          receivedQuantity,
          product:products(id, name, productCode, unit, sellingPrice)
        ),
        approvals:purchase_order_approvals(
          id,
          status,
          approvedBy,
          approvedAt,
          comments,
          level,
          approver:users!purchase_order_approvals_approvedBy_fkey(
            id,
            firstName,
            lastName,
            email,
            role
          )
        ),
        receipts:purchase_receipts(
          id,
          receiptNumber,
          receivedDate,
          receivedBy,
          status,
          notes,
          receiver:users!purchase_receipts_receivedBy_fkey(firstName, lastName)
        ),
        createdByUser:users!purchase_orders_createdBy_fkey(
          id,
          firstName,
          lastName,
          email
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Calculate totals and completion status
    const items = purchaseOrder.items || []
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0)
    const taxAmount = subtotal * (purchaseOrder.tax_rate || 0) / 100
    const totalAmount = subtotal + taxAmount + (purchaseOrder.shipping_cost || 0) - (purchaseOrder.discount_amount || 0)

    // Calculate received percentages
    const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    const receivedQuantity = items.reduce((sum: number, item: any) => sum + (item.receivedQuantity || 0), 0)
    const receivedPercentage = totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0

    const orderWithTotals = {
      ...purchaseOrder,
      subtotal,
      taxAmount,
      totalAmount,
      receivedQuantity,
      totalQuantity,
      receivedPercentage,
      itemsCount: items.length,
      // Add approval summary
      approvalSummary: {
        required: purchaseOrder.requiresApproval,
        status: purchaseOrder.approvalStatus,
        approvals: purchaseOrder.approvals || [],
        canApprove: purchaseOrder.approvalStatus === 'PENDING',
        isFullyApproved: purchaseOrder.approvalStatus === 'APPROVED'
      }
    }

    return NextResponse.json({
      success: true,
      data: orderWithTotals
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/purchases/orders/[id] - Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { id: orderId } = await params
    const body = await request.json()

    // Validate request data
    const validationResult = purchaseOrderUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const updateData = validationResult.data
    const { items: itemsUpdate, ...poUpdate } = updateData

    // Check if PO exists and is editable
    const { data: existingPO, error: poError } = await supabase
      .from('purchase_orders')
      .select('id, status, approvalStatus')
      .eq('id', orderId)
      .single()

    if (poError || !existingPO) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if PO can be edited (only DRAFT and SENT can be fully edited)
    if (!['DRAFT', 'SENT'].includes(existingPO.status) && itemsUpdate) {
      return NextResponse.json({
        error: 'Cannot modify items of confirmed or received purchase orders'
      }, { status: 400 })
    }

    // Start transaction
    let updatedPO, newItems

    if (itemsUpdate && itemsUpdate.length > 0) {
      // Handle items update
      // Delete existing items
      await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchaseOrderId', orderId)

      // Create new items with totals
      const itemsWithTotals = itemsUpdate.map(item => ({
        ...item,
        purchaseOrderId: orderId,
        totalAmount: item.quantity * item.unitPrice,
        receivedQuantity: item.receivedQuantity || 0,
        createdAt: new Date().toISOString()
      }))

      const { data: createdItems, error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsWithTotals)
        .select(`
          *,
          product:products(id, name, productCode, unit)
        `)

      if (itemsError) {
        console.error('Items update error:', itemsError)
        return NextResponse.json({ error: 'Failed to update items' }, { status: 500 })
      }

      newItems = createdItems

      // Recalculate totals
      const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.totalAmount, 0)
      const taxAmount = subtotal * (poUpdate.tax_rate || 0) / 100
      const totalAmount = subtotal + taxAmount + (poUpdate.shipping_cost || 0) - (poUpdate.discount_amount || 0)

      // Add calculated fields to the update data
      const calculatedFields = {
        subtotal,
        taxAmount,
        totalAmount
      }
      Object.assign(poUpdate, calculatedFields)
    }

    // Update the purchase order
    const { data: purchaseOrder, error } = await supabase
      .from('purchase_orders')
      .update({
        ...poUpdate,
        updatedAt: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
    }

    // Return updated PO with items if they were updated
    const responseData = newItems ? { ...purchaseOrder, items: newItems } : purchaseOrder

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/purchases/orders/[id] - Cancel purchase order (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { id: orderId } = await params

    // Check PO status - can only cancel DRAFT or SENT orders
    const { data: existingPO, error: poError } = await supabase
      .from('purchase_orders')
      .select('id, status, po_number')
      .eq('id', orderId)
      .single()

    if (poError || !existingPO) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (!['DRAFT', 'SENT'].includes(existingPO.status)) {
      return NextResponse.json({
        error: 'Can only cancel draft or sent purchase orders'
      }, { status: 400 })
    }

    // Cancel the purchase order
    const { data: cancelledPO, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'CANCELLED',
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to cancel purchase order' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Purchase order ${existingPO.po_number} cancelled successfully`,
        purchaseOrder: cancelledPO
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}