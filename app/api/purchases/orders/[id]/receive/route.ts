import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Receipt Item schema
const receiptItemSchema = z.object({
  purchaseOrderItemId: z.string().uuid('Purchase order item ID is required'),
  receivedQuantity: z.number().min(0, 'Received quantity must be non-negative'),
  warehouseId: z.string().uuid('Warehouse ID is required'),
  qualityStatus: z.enum(['ACCEPTED', 'REJECTED', 'PENDING']).default('ACCEPTED'),
  rejectedQuantity: z.number().min(0).default(0),
  notes: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  batchNumber: z.string().optional(),
  lotNumber: z.string().optional()
})

// Receipt schema
const receiptSchema = z.object({
  items: z.array(receiptItemSchema).min(1, 'At least one item must be received'),
  receivedDate: z.string().datetime().default(new Date().toISOString()),
  receivedBy: z.string().uuid().optional(), // Will be set to current user
  notes: z.string().optional(),
  deliveryNote: z.string().optional(),
  invoiceNumber: z.string().optional(),
  qualityCheckRequired: z.boolean().default(false),
  totalPackages: z.number().min(0).optional(),
  carrierName: z.string().optional(),
  trackingNumber: z.string().optional()
})

// POST /api/purchases/orders/[id]/receive - Receive purchase order items and update inventory
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const purchaseOrderId = params.id
    const body = await request.json()

    // Set receivedBy to current user
    body.receivedBy = authResult.user.id

    // Validate request data
    const validationResult = receiptSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const receiptData = validationResult.data
    const { items: receiptItems, ...receiptInfo } = receiptData

    // Get purchase order details
    const { data: purchaseOrder, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        poNumber,
        status,
        supplierId,
        items:purchase_order_items(
          id,
          productId,
          quantity,
          receivedQuantity,
          unitPrice,
          product:products(id, name, productCode, unit, costPrice)
        ),
        supplier:suppliers(name)
      `)
      .eq('id', purchaseOrderId)
      .is('deletedAt', null)
      .single()

    if (poError || !purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if PO can receive items
    if (!['CONFIRMED', 'PARTIALLY_RECEIVED'].includes(purchaseOrder.status)) {
      return NextResponse.json({
        error: 'Can only receive items from confirmed purchase orders'
      }, { status: 400 })
    }

    // Validate receipt items against PO items
    const poItemsMap = new Map(purchaseOrder.items.map(item => [item.id, item]))

    for (const receiptItem of receiptItems) {
      const poItem = poItemsMap.get(receiptItem.purchaseOrderItemId)
      if (!poItem) {
        return NextResponse.json({
          error: `Purchase order item ${receiptItem.purchaseOrderItemId} not found`
        }, { status: 404 })
      }

      const totalReceived = (poItem.receivedQuantity || 0) + receiptItem.receivedQuantity
      if (totalReceived > poItem.quantity) {
        return NextResponse.json({
          error: `Cannot receive ${receiptItem.receivedQuantity} of ${poItem.product.name}. Only ${poItem.quantity - (poItem.receivedQuantity || 0)} remaining to receive.`
        }, { status: 400 })
      }
    }

    // Validate warehouses exist
    const warehouseIds = [...new Set(receiptItems.map(item => item.warehouseId))]
    const { data: warehouses, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id, name, isActive')
      .in('id', warehouseIds)

    if (warehouseError || !warehouses || warehouses.length !== warehouseIds.length) {
      return NextResponse.json({ error: 'One or more warehouses not found' }, { status: 404 })
    }

    const inactiveWarehouses = warehouses.filter(w => !w.isActive)
    if (inactiveWarehouses.length > 0) {
      return NextResponse.json({
        error: `Warehouses not active: ${inactiveWarehouses.map(w => w.name).join(', ')}`
      }, { status: 400 })
    }

    // Generate receipt number
    const { data: lastReceipt } = await supabase
      .from('purchase_receipts')
      .select('receiptNumber')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    const lastNumber = lastReceipt?.receiptNumber ?
      parseInt(lastReceipt.receiptNumber.replace('RCP-', '')) || 0 : 0
    const receiptNumber = `RCP-${String(lastNumber + 1).padStart(6, '0')}`

    // Start transaction-like operations

    // 1. Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from('purchase_receipts')
      .insert([{
        ...receiptInfo,
        receiptNumber,
        purchaseOrderId,
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      }])
      .select()
      .single()

    if (receiptError) {
      console.error('Receipt creation error:', receiptError)
      return NextResponse.json({ error: 'Failed to create receipt record' }, { status: 500 })
    }

    // 2. Create receipt items and update stock
    const createdReceiptItems = []
    const stockUpdates = []
    const movementRecords = []

    for (const receiptItem of receiptItems) {
      const poItem = poItemsMap.get(receiptItem.purchaseOrderItemId)

      // Create receipt item
      const { data: createdReceiptItem, error: receiptItemError } = await supabase
        .from('purchase_receipt_items')
        .insert([{
          ...receiptItem,
          purchaseReceiptId: receipt.id,
          createdAt: new Date().toISOString()
        }])
        .select(`
          *,
          purchaseOrderItem:purchase_order_items(
            id,
            productId,
            quantity,
            unitPrice,
            product:products(name, productCode, unit, costPrice)
          )
        `)
        .single()

      if (receiptItemError) {
        console.error('Receipt item creation error:', receiptItemError)
        // Should implement proper rollback here
        return NextResponse.json({ error: 'Failed to create receipt item' }, { status: 500 })
      }

      createdReceiptItems.push(createdReceiptItem)

      // Update stock if quality status is ACCEPTED
      if (receiptItem.qualityStatus === 'ACCEPTED' && receiptItem.receivedQuantity > 0) {
        // Get current stock
        const { data: currentStock, error: stockError } = await supabase
          .from('stocks')
          .select('quantity')
          .eq('productId', poItem.productId)
          .eq('warehouseId', receiptItem.warehouseId)
          .single()

        if (stockError && stockError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Stock fetch error:', stockError)
          continue // Skip this stock update but don't fail the entire operation
        }

        const newQuantity = (currentStock?.quantity || 0) + receiptItem.receivedQuantity

        // Upsert stock record
        const { error: stockUpdateError } = await supabase
          .from('stocks')
          .upsert({
            productId: poItem.productId,
            warehouseId: receiptItem.warehouseId,
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
          }, {
            onConflict: 'productId,warehouseId'
          })

        if (stockUpdateError) {
          console.error('Stock update error:', stockUpdateError)
          // Continue with other items
        } else {
          stockUpdates.push({
            productId: poItem.productId,
            warehouseId: receiptItem.warehouseId,
            previousQuantity: currentStock?.quantity || 0,
            newQuantity,
            quantityChange: receiptItem.receivedQuantity
          })

          // Create stock movement record
          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert([{
              productId: poItem.productId,
              warehouseId: receiptItem.warehouseId,
              type: 'IN',
              subtype: 'PURCHASE_RECEIPT',
              quantity: receiptItem.receivedQuantity,
              unitCost: poItem.unitPrice,
              totalCost: receiptItem.receivedQuantity * poItem.unitPrice,
              referenceId: receipt.id,
              referenceType: 'purchase_receipt',
              referenceNumber: receiptNumber,
              notes: `Purchase receipt from PO ${purchaseOrder.poNumber} - ${purchaseOrder.supplier.name}`,
              batchNumber: receiptItem.batchNumber,
              expiryDate: receiptItem.expiryDate,
              movementDate: receiptInfo.receivedDate,
              createdBy: authResult.user.id,
              createdAt: new Date().toISOString()
            }])

          if (movementError) {
            console.error('Movement creation error:', movementError)
          } else {
            movementRecords.push({
              productId: poItem.productId,
              productName: poItem.product.name,
              warehouseId: receiptItem.warehouseId,
              quantity: receiptItem.receivedQuantity,
              movementType: 'IN'
            })
          }
        }
      }

      // Update purchase order item received quantity
      const newReceivedQuantity = (poItem.receivedQuantity || 0) + receiptItem.receivedQuantity
      await supabase
        .from('purchase_order_items')
        .update({
          receivedQuantity: newReceivedQuantity,
          updatedAt: new Date().toISOString()
        })
        .eq('id', receiptItem.purchaseOrderItemId)
    }

    // 3. Update purchase order status
    const totalOrdered = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)
    const totalReceived = receiptItems.reduce((sum, item) => sum + item.receivedQuantity, 0) +
      purchaseOrder.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0)

    let newPOStatus = purchaseOrder.status
    if (totalReceived >= totalOrdered) {
      newPOStatus = 'RECEIVED'
    } else if (totalReceived > 0) {
      newPOStatus = 'PARTIALLY_RECEIVED'
    }

    await supabase
      .from('purchase_orders')
      .update({
        status: newPOStatus,
        updatedAt: new Date().toISOString()
      })
      .eq('id', purchaseOrderId)

    return NextResponse.json({
      success: true,
      data: {
        receipt: {
          ...receipt,
          items: createdReceiptItems
        },
        stockUpdates,
        movementRecords,
        purchaseOrderStatus: newPOStatus,
        summary: {
          itemsReceived: receiptItems.length,
          totalQuantityReceived: receiptItems.reduce((sum, item) => sum + item.receivedQuantity, 0),
          stockLocationsUpdated: stockUpdates.length,
          movementsCreated: movementRecords.length
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/purchases/orders/[id]/receive - Get receipt history for purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const purchaseOrderId = params.id

    // Get all receipts for this PO
    const { data: receipts, error } = await supabase
      .from('purchase_receipts')
      .select(`
        *,
        items:purchase_receipt_items(
          *,
          purchaseOrderItem:purchase_order_items(
            id,
            quantity,
            unitPrice,
            product:products(id, name, productCode, unit)
          ),
          warehouse:warehouses(id, name, code)
        ),
        receivedByUser:users!purchase_receipts_receivedBy_fkey(firstName, lastName, email)
      `)
      .eq('purchaseOrderId', purchaseOrderId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
    }

    // Calculate receipt summaries
    const receiptsWithSummaries = receipts?.map(receipt => ({
      ...receipt,
      summary: {
        itemsCount: receipt.items?.length || 0,
        totalQuantity: receipt.items?.reduce((sum: number, item: any) => sum + item.receivedQuantity, 0) || 0,
        acceptedQuantity: receipt.items?.reduce((sum: number, item: any) =>
          sum + (item.qualityStatus === 'ACCEPTED' ? item.receivedQuantity : 0), 0) || 0,
        rejectedQuantity: receipt.items?.reduce((sum: number, item: any) => sum + item.rejectedQuantity, 0) || 0
      }
    }))

    return NextResponse.json({
      success: true,
      data: receiptsWithSummaries || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}