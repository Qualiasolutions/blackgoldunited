import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Purchase Invoice update schema
const purchaseInvoiceUpdateSchema = z.object({
  supplier_invoice_number: z.string().min(1).optional(),
  invoiceDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  shipping_cost: z.number().min(0).optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED']).optional(),
  payment_status: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE']).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
  attachmentFilename: z.string().optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/purchases/invoices/[id] - Get single purchase invoice
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
    const { id: invoiceId } = await params

    // Get purchase invoice with all related data
    const { data: invoice, error } = await supabase
      .from('purchase_invoices')
      .select(`
        *,
        supplier:suppliers(
          id,
          name,
          supplier_code,
          email,
          phone,
          address,
          city,
          state,
          country,
          contact_person_name,
          contact_person_email
        ),
        purchaseOrder:purchase_orders(
          id,
          po_number,
          status,
          order_date,
          expected_delivery_date
        ),
        items:purchase_invoice_items(
          id,
          purchase_order_item_id,
          product_id,
          quantity,
          unit_price,
          total_amount,
          description,
          product:products(id, name, product_code, unit, cost_price),
          purchaseOrderItem:purchase_order_items(id, quantity, unit_price)
        ),
        payments:purchase_payments(
          id,
          amount,
          payment_date,
          payment_method,
          status,
          reference_number,
          notes,
          created_by,
          paidBy:users!purchase_payments_createdBy_fkey(first_name, last_name)
        ),
        approvals:purchase_invoice_approvals(
          id,
          status,
          approved_by,
          approved_at,
          comments,
          approver:users!purchase_invoice_approvals_approvedBy_fkey(first_name, last_name, email)
        ),
        createdByUser:users!purchase_invoices_createdBy_fkey(first_name, last_name, email)
      `)
      .eq('id', invoiceId)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Purchase invoice not found' }, { status: 404 })
    }

    // Calculate totals and payment summary
    const items = invoice.items || []
    const payments = invoice.payments || []

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.total_amount || 0), 0)
    const taxAmount = subtotal * (invoice.tax_rate || 0) / 100
    const totalAmount = subtotal + taxAmount + (invoice.shipping_cost || 0) - (invoice.discount_amount || 0)

    const paidAmount = payments
      .filter((p: any) => p.status === 'COMPLETED')
      .reduce((sum: number, payment: any) => sum + payment.amount, 0)

    const pendingAmount = payments
      .filter((p: any) => p.status === 'PENDING')
      .reduce((sum: number, payment: any) => sum + payment.amount, 0)

    const remainingAmount = totalAmount - paidAmount
    const isOverdue = new Date(invoice.due_date) < new Date() && remainingAmount > 0

    // Calculate days overdue
    const daysOverdue = isOverdue
      ? Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const invoiceWithCalculations = {
      ...invoice,
      // Financial calculations
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount,
      pendingAmount,
      remainingAmount,

      // Status calculations
      isOverdue,
      daysOverdue,

      // Counts
      itemsCount: items.length,
      paymentsCount: payments.length,

      // Payment summary
      paymentSummary: {
        total: totalAmount,
        paid: paidAmount,
        pending: pendingAmount,
        remaining: remainingAmount,
        isFullyPaid: remainingAmount <= 0,
        isOverdue,
        daysOverdue
      },

      // Approval summary
      approvalSummary: {
        status: invoice.status,
        approvals: invoice.approvals || [],
        needsApproval: invoice.status === 'PENDING_APPROVAL',
        isApproved: invoice.status === 'APPROVED'
      }
    }

    return NextResponse.json({
      success: true,
      data: invoiceWithCalculations
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/purchases/invoices/[id] - Update purchase invoice
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
    const { id: invoiceId } = await params
    const body = await request.json()

    // Validate request data
    const validationResult = purchaseInvoiceUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const updateData = validationResult.data

    // Check if invoice exists and can be updated
    const { data: existingInvoice, error: invoiceError } = await supabase
      .from('purchase_invoices')
      .select('id, status, payment_status, supplier_id, supplier_invoice_number, tax_rate, shipping_cost, discount_amount')
      .eq('id', invoiceId)
      .is('deleted_at', null)
      .single()

    if (invoiceError || !existingInvoice) {
      return NextResponse.json({ error: 'Purchase invoice not found' }, { status: 404 })
    }

    // Check if invoice can be edited (not if it's paid or cancelled)
    if (['PAID', 'CANCELLED'].includes(existingInvoice.status)) {
      return NextResponse.json({
        error: 'Cannot edit paid or cancelled invoices'
      }, { status: 400 })
    }

    // If updating supplier invoice number, check for duplicates
    if (updateData.supplier_invoice_number && updateData.supplier_invoice_number !== existingInvoice.supplier_invoice_number) {
      const { data: duplicateInvoice } = await supabase
        .from('purchase_invoices')
        .select('id')
        .eq('supplier_id', existingInvoice.supplier_id)
        .eq('supplier_invoice_number', updateData.supplier_invoice_number)
        .neq('id', invoiceId)
        .is('deleted_at', null)
        .single()

      if (duplicateInvoice) {
        return NextResponse.json({
          error: 'Invoice number already exists for this supplier'
        }, { status: 409 })
      }
    }

    // If financial fields are updated, recalculate totals
    let recalculatedFields = {}
    if (updateData.tax_rate !== undefined || updateData.shipping_cost !== undefined || updateData.discount_amount !== undefined) {
      // Get current items to recalculate
      const { data: items } = await supabase
        .from('purchase_invoice_items')
        .select('total_amount')
        .eq('purchase_invoice_id', invoiceId)

      if (items) {
        const subtotal = items.reduce((sum, item) => sum + item.total_amount, 0)
        const tax_rate = updateData.tax_rate !== undefined ? updateData.tax_rate : existingInvoice.tax_rate || 0
        const shipping_cost = updateData.shipping_cost !== undefined ? updateData.shipping_cost : existingInvoice.shipping_cost || 0
        const discount_amount = updateData.discount_amount !== undefined ? updateData.discount_amount : existingInvoice.discount_amount || 0

        const tax_amount = subtotal * tax_rate / 100
        const total_amount = subtotal + tax_amount + shipping_cost - discount_amount

        recalculatedFields = {
          subtotal,
          tax_amount,
          total_amount
        }
      }
    }

    // Update the purchase invoice
    const { data: updatedInvoice, error } = await supabase
      .from('purchase_invoices')
      .update({
        ...updateData,
        ...recalculatedFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update purchase invoice' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedInvoice
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/purchases/invoices/[id] - Cancel purchase invoice (soft delete)
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
    const { id: invoiceId } = await params

    // Check invoice status - can only cancel unpaid invoices
    const { data: existingInvoice, error: invoiceError } = await supabase
      .from('purchase_invoices')
      .select('id, status, payment_status, invoice_number')
      .eq('id', invoiceId)
      .is('deleted_at', null)
      .single()

    if (invoiceError || !existingInvoice) {
      return NextResponse.json({ error: 'Purchase invoice not found' }, { status: 404 })
    }

    if (existingInvoice.payment_status === 'PAID' || existingInvoice.payment_status === 'PARTIALLY_PAID') {
      return NextResponse.json({
        error: 'Cannot cancel paid or partially paid invoices'
      }, { status: 400 })
    }

    // Check for pending payments
    const { data: pendingPayments } = await supabase
      .from('purchase_payments')
      .select('id')
      .eq('purchase_invoice_id', invoiceId)
      .eq('status', 'PENDING')
      .limit(1)

    if (pendingPayments && pendingPayments.length > 0) {
      return NextResponse.json({
        error: 'Cannot cancel invoice with pending payments'
      }, { status: 400 })
    }

    // Cancel the invoice
    const { data: cancelledInvoice, error } = await supabase
      .from('purchase_invoices')
      .update({
        status: 'CANCELLED',
        payment_status: 'UNPAID',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to cancel purchase invoice' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Purchase invoice ${existingInvoice.invoice_number} cancelled successfully`,
        invoice: cancelledInvoice
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}