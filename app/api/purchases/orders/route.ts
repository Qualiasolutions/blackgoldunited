import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Purchase Order Item schema
const purchaseOrderItemSchema = z.object({
  productId: z.string().uuid('Product ID is required'),
  quantity: z.number().min(1, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  description: z.string().optional(),
  expectedDeliveryDate: z.string().datetime().optional()
})

// Purchase Order schema
const purchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Supplier ID is required'),
  orderDate: z.string().datetime().default(new Date().toISOString()),
  expectedDeliveryDate: z.string().datetime(),

  // Order Details
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),

  // Terms and Conditions
  paymentTerms: z.enum(['NET_15', 'NET_30', 'NET_45', 'NET_60', 'COD', 'ADVANCE']).default('NET_30'),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),

  // Addresses
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  billingAddress: z.string().optional(),

  // Financial
  taxRate: z.number().min(0).max(100).default(0),
  shippingCost: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),

  // Workflow
  status: z.enum(['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']).default('DRAFT'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),

  // Approval
  requiresApproval: z.boolean().default(true),
  approvalThreshold: z.number().min(0).default(10000), // Amount requiring approval
})

const purchaseOrderUpdateSchema = purchaseOrderSchema.partial()

// GET /api/purchases/orders - List purchase orders with search and pagination
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
    const supplierId = searchParams.get('supplierId') || ''
    const priority = searchParams.get('priority') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const needsApproval = searchParams.get('needsApproval') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const offset = (page - 1) * limit

    // Build query with supplier and items
    let queryBuilder = supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(id, name, supplierCode, email, phone),
        items:purchase_order_items(
          id,
          productId,
          quantity,
          unitPrice,
          totalAmount,
          description,
          expectedDeliveryDate,
          receivedQuantity,
          product:products(id, name, productCode, unit)
        ),
        approvals:purchase_order_approvals(
          id,
          status,
          approvedBy,
          approvedAt,
          comments,
          approver:users!purchase_order_approvals_approvedBy_fkey(firstName, lastName, email)
        )
      `, { count: 'exact' })
      .is('deletedAt', null)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`poNumber.ilike.%${query}%,notes.ilike.%${query}%`)
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    if (supplierId) {
      queryBuilder = queryBuilder.eq('supplierId', supplierId)
    }

    if (priority) {
      queryBuilder = queryBuilder.eq('priority', priority)
    }

    if (startDate && endDate) {
      queryBuilder = queryBuilder.gte('orderDate', startDate).lte('orderDate', endDate)
    }

    if (needsApproval) {
      queryBuilder = queryBuilder.eq('requiresApproval', true).eq('approvalStatus', 'PENDING')
    }

    // Get paginated results
    const { data: purchaseOrders, error, count } = await queryBuilder
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
    }

    // Calculate totals for each PO
    const ordersWithTotals = purchaseOrders?.map(po => {
      const items = po.items || []
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0)
      const tax = subtotal * (po.taxRate || 0) / 100
      const total = subtotal + tax + (po.shippingCost || 0) - (po.discountAmount || 0)

      return {
        ...po,
        subtotal,
        taxAmount: tax,
        totalAmount: total,
        itemsCount: items.length
      }
    })

    return NextResponse.json({
      success: true,
      data: ordersWithTotals || [],
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

// POST /api/purchases/orders - Create new purchase order
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
    const validationResult = purchaseOrderSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const orderData = validationResult.data
    const { items, ...poData } = orderData

    // Verify supplier exists and is active
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, isActive, paymentTerms')
      .eq('id', orderData.supplierId)
      .is('deletedAt', null)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    if (!supplier.isActive) {
      return NextResponse.json({ error: 'Supplier is not active' }, { status: 400 })
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

    const inactiveProducts = products.filter(p => !p.isActive)
    if (inactiveProducts.length > 0) {
      return NextResponse.json({
        error: `Products not active: ${inactiveProducts.map(p => p.name).join(', ')}`
      }, { status: 400 })
    }

    // Generate PO number
    const { data: lastPO } = await supabase
      .from('purchase_orders')
      .select('poNumber')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    const lastNumber = lastPO?.poNumber ?
      parseInt(lastPO.poNumber.replace('PO-', '')) || 0 : 0
    const poNumber = `PO-${String(lastNumber + 1).padStart(6, '0')}`

    // Calculate totals
    const itemsWithTotals = items.map(item => ({
      ...item,
      totalAmount: item.quantity * item.unitPrice
    }))

    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.totalAmount, 0)
    const taxAmount = subtotal * (poData.taxRate || 0) / 100
    const totalAmount = subtotal + taxAmount + (poData.shippingCost || 0) - (poData.discountAmount || 0)

    // Determine approval status
    const requiresApproval = poData.requiresApproval && totalAmount >= poData.approvalThreshold
    const approvalStatus = requiresApproval ? 'PENDING' : 'APPROVED'

    // Use supplier's payment terms if not specified
    const paymentTerms = poData.paymentTerms || supplier.paymentTerms

    // Create the purchase order
    const { data: purchaseOrder, error } = await supabase
      .from('purchase_orders')
      .insert([{
        ...poData,
        poNumber,
        paymentTerms,
        subtotal,
        taxAmount,
        totalAmount,
        approvalStatus,
        createdBy: authResult.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
    }

    // Create purchase order items
    const itemsToInsert = itemsWithTotals.map(item => ({
      ...item,
      purchaseOrderId: purchaseOrder.id,
      receivedQuantity: 0,
      createdAt: new Date().toISOString()
    }))

    const { data: createdItems, error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(itemsToInsert)
      .select(`
        *,
        product:products(id, name, productCode, unit)
      `)

    if (itemsError) {
      console.error('Items creation error:', itemsError)
      // Rollback: delete the purchase order
      await supabase.from('purchase_orders').delete().eq('id', purchaseOrder.id)
      return NextResponse.json({ error: 'Failed to create purchase order items' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...purchaseOrder,
        items: createdItems
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}