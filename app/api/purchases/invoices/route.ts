import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Purchase Invoice Item schema
const purchaseInvoiceItemSchema = z.object({
  purchaseOrderItemId: z.string().uuid().optional(), // Link to PO item
  productId: z.string().uuid('Product ID is required'),
  quantity: z.number().min(1, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  description: z.string().optional(),
  totalAmount: z.number().min(0).optional() // Will be calculated
})

// Purchase Invoice schema
const purchaseInvoiceSchema = z.object({
  supplierId: z.string().uuid('Supplier ID is required'),
  purchaseOrderId: z.string().uuid().optional(), // Optional - can create direct invoices

  // Invoice Details
  supplierInvoiceNumber: z.string().min(1, 'Supplier invoice number is required'),
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime(),

  // Items
  items: z.array(purchaseInvoiceItemSchema).min(1, 'At least one item is required'),

  // Financial Details
  taxRate: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  currency: z.string().default('USD'),

  // Status
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED']).default('DRAFT'),
  paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE']).default('UNPAID'),

  // Notes
  notes: z.string().optional(),
  internalNotes: z.string().optional(),

  // Attachment info
  attachmentUrl: z.string().url().optional(),
  attachmentFilename: z.string().optional()
})

const purchaseInvoiceUpdateSchema = purchaseInvoiceSchema.partial()

// GET /api/purchases/invoices - List purchase invoices with search and pagination
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const query = searchParams.get('query') || ''
    const status = searchParams.get('status') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''
    const supplierId = searchParams.get('supplierId') || ''
    const purchaseOrderId = searchParams.get('purchaseOrderId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const overdue = searchParams.get('overdue') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const offset = (page - 1) * limit

    // Build query with supplier and PO info
    let queryBuilder = supabase
      .from('purchase_invoices')
      .select(`
        *,
        supplier:suppliers(id, name, supplierCode, email),
        purchaseOrder:purchase_orders(id, poNumber, status),
        items:purchase_invoice_items(
          id,
          productId,
          quantity,
          unitPrice,
          totalAmount,
          description,
          product:products(id, name, productCode, unit)
        ),
        payments:purchase_payments(
          id,
          amount,
          paymentDate,
          paymentMethod,
          status
        )
      `, { count: 'exact' })
      .is('deletedAt', null)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`invoiceNumber.ilike.%${query}%,supplierInvoiceNumber.ilike.%${query}%,notes.ilike.%${query}%`)
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    if (paymentStatus) {
      queryBuilder = queryBuilder.eq('paymentStatus', paymentStatus)
    }

    if (supplierId) {
      queryBuilder = queryBuilder.eq('supplierId', supplierId)
    }

    if (purchaseOrderId) {
      queryBuilder = queryBuilder.eq('purchaseOrderId', purchaseOrderId)
    }

    if (startDate && endDate) {
      queryBuilder = queryBuilder.gte('invoiceDate', startDate).lte('invoiceDate', endDate)
    }

    if (overdue) {
      queryBuilder = queryBuilder.lt('dueDate', new Date().toISOString()).neq('paymentStatus', 'PAID')
    }

    // Get paginated results
    const { data: invoices, error, count } = await queryBuilder
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch purchase invoices' }, { status: 500 })
    }

    // Calculate totals and payment info for each invoice
    const invoicesWithTotals = invoices?.map(invoice => {
      const items = invoice.items || []
      const payments = invoice.payments || []

      const subtotal = items.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0)
      const taxAmount = subtotal * (invoice.taxRate || 0) / 100
      const totalAmount = subtotal + taxAmount + (invoice.shippingCost || 0) - (invoice.discountAmount || 0)

      const paidAmount = payments
        .filter((p: any) => p.status === 'COMPLETED')
        .reduce((sum: number, payment: any) => sum + payment.amount, 0)

      const remainingAmount = totalAmount - paidAmount
      const isOverdue = new Date(invoice.dueDate) < new Date() && remainingAmount > 0

      return {
        ...invoice,
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount,
        remainingAmount,
        isOverdue,
        itemsCount: items.length,
        paymentsCount: payments.length
      }
    })

    return NextResponse.json({
      success: true,
      data: invoicesWithTotals || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/purchases/invoices - Create new purchase invoice
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = purchaseInvoiceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const invoiceData = validationResult.data
    const { items, ...invoiceDetails } = invoiceData

    // Verify supplier exists and is active
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, isActive, name')
      .eq('id', invoiceData.supplierId)
      .is('deletedAt', null)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    if (!supplier.isActive) {
      return NextResponse.json({ error: 'Supplier is not active' }, { status: 400 })
    }

    // If PO is specified, verify it exists and belongs to the supplier
    if (invoiceData.purchaseOrderId) {
      const { data: purchaseOrder, error: poError } = await supabase
        .from('purchase_orders')
        .select('id, supplierId, status, poNumber')
        .eq('id', invoiceData.purchaseOrderId)
        .single()

      if (poError || !purchaseOrder) {
        return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
      }

      if (purchaseOrder.supplierId !== invoiceData.supplierId) {
        return NextResponse.json({
          error: 'Purchase order does not belong to the specified supplier'
        }, { status: 400 })
      }

      if (!['CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(purchaseOrder.status)) {
        return NextResponse.json({
          error: 'Can only create invoices for confirmed or received purchase orders'
        }, { status: 400 })
      }
    }

    // Check for duplicate supplier invoice number
    const { data: existingInvoice } = await supabase
      .from('purchase_invoices')
      .select('id')
      .eq('supplierId', invoiceData.supplierId)
      .eq('supplierInvoiceNumber', invoiceData.supplierInvoiceNumber)
      .is('deletedAt', null)
      .single()

    if (existingInvoice) {
      return NextResponse.json({
        error: 'Invoice number already exists for this supplier'
      }, { status: 409 })
    }

    // Verify all products exist
    const productIds = items.map(item => item.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, isActive')
      .in('id', productIds)
      .is('deletedAt', null)

    if (productsError || !products || products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products not found' }, { status: 404 })
    }

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('purchase_invoices')
      .select('invoiceNumber')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    const lastNumber = lastInvoice?.invoiceNumber ?
      parseInt(lastInvoice.invoiceNumber.replace('PINV-', '')) || 0 : 0
    const invoiceNumber = `PINV-${String(lastNumber + 1).padStart(6, '0')}`

    // Calculate item totals
    const itemsWithTotals = items.map(item => ({
      ...item,
      totalAmount: item.quantity * item.unitPrice
    }))

    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.totalAmount, 0)
    const taxAmount = subtotal * (invoiceDetails.taxRate || 0) / 100
    const totalAmount = subtotal + taxAmount + (invoiceDetails.shippingCost || 0) - (invoiceDetails.discountAmount || 0)

    // Create the purchase invoice
    const { data: invoice, error } = await supabase
      .from('purchase_invoices')
      .insert([{
        ...invoiceDetails,
        invoiceNumber,
        subtotal,
        taxAmount,
        totalAmount,
        createdBy: authResult.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create purchase invoice' }, { status: 500 })
    }

    // Create invoice items
    const itemsToInsert = itemsWithTotals.map(item => ({
      ...item,
      purchaseInvoiceId: invoice.id,
      createdAt: new Date().toISOString()
    }))

    const { data: createdItems, error: itemsError } = await supabase
      .from('purchase_invoice_items')
      .insert(itemsToInsert)
      .select(`
        *,
        product:products(id, name, productCode, unit)
      `)

    if (itemsError) {
      console.error('Items creation error:', itemsError)
      // Rollback: delete the invoice
      await supabase.from('purchase_invoices').delete().eq('id', invoice.id)
      return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        supplier,
        items: createdItems
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}