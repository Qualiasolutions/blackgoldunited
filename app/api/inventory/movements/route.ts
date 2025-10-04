import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/inventory/movements - Get stock movements with filtering
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const query = searchParams.get('query') || ''
    const warehouse = searchParams.get('warehouse')
    const type = searchParams.get('type')
    const productId = searchParams.get('productId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build movements query with product, warehouse, and user details
    let movementsQuery = supabase
      .from('stock_movements')
      .select(`
        id,
        productId,
        warehouseId,
        type,
        quantity,
        previousStock,
        newStock,
        reason,
        referenceId,
        referenceType,
        notes,
        createdAt,
        createdBy,
        product:products(
          id,
          name,
          productCode,
          unit
        ),
        warehouse:warehouses(
          id,
          name,
          code,
          location
        ),
        user:auth.users(
          id,
          email
        )
      `)

    // Apply search filter
    if (query) {
      movementsQuery = movementsQuery.or(
        `product.name.ilike.%${query}%,product.productCode.ilike.%${query}%,reason.ilike.%${query}%`
      )
    }

    // Apply filters
    if (warehouse) {
      movementsQuery = movementsQuery.eq('warehouse_id', warehouse)
    }

    if (type) {
      movementsQuery = movementsQuery.eq('type', type)
    }

    if (productId) {
      movementsQuery = movementsQuery.eq('product_id', productId)
    }

    if (dateFrom) {
      movementsQuery = movementsQuery.gte('createdAt', dateFrom)
    }

    if (dateTo) {
      movementsQuery = movementsQuery.lte('createdAt', dateTo)
    }

    // Get total count for pagination
    const countQuery = supabase
      .from('stock_movements')
      .select('id', { count: 'exact', head: true })

    // Apply same filters to count query
    if (warehouse) {
      countQuery.eq('warehouse_id', warehouse)
    }
    if (type) {
      countQuery.eq('type', type)
    }
    if (productId) {
      countQuery.eq('product_id', productId)
    }
    if (dateFrom) {
      countQuery.gte('createdAt', dateFrom)
    }
    if (dateTo) {
      countQuery.lte('createdAt', dateTo)
    }

    const { count: totalCount } = await countQuery

    // Execute main query with pagination
    const { data: movements, error } = await movementsQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 })
    }

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      success: true,
      data: movements || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: totalPages
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inventory/movements - Create new stock movement
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    const {
      productId,
      warehouseId,
      type, // 'IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'
      quantity,
      reason,
      referenceId,
      referenceType, // 'PURCHASE', 'SALE', 'TRANSFER', 'MANUAL'
      notes,
      targetWarehouseId // For transfers
    } = body

    // Validate required fields
    if (!productId || !warehouseId || !type || quantity === undefined || !reason) {
      return NextResponse.json({
        error: 'Missing required fields: productId, warehouseId, type, quantity, reason'
      }, { status: 400 })
    }

    if (quantity <= 0) {
      return NextResponse.json({
        error: 'Quantity must be positive'
      }, { status: 400 })
    }

    if (type === 'TRANSFER' && !targetWarehouseId) {
      return NextResponse.json({
        error: 'Target warehouse is required for transfers'
      }, { status: 400 })
    }

    // Handle different movement types
    if (type === 'TRANSFER') {
      // Handle stock transfer between warehouses
      return await handleStockTransfer(
        supabase,
        productId,
        warehouseId,
        targetWarehouseId,
        quantity,
        reason,
        referenceId,
        referenceType,
        notes,
        authResult.user.id
      )
    } else {
      // Handle regular stock movement
      return await handleStockMovement(
        supabase,
        productId,
        warehouseId,
        type,
        quantity,
        reason,
        referenceId,
        referenceType,
        notes,
        authResult.user.id
      )
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to handle regular stock movements
async function handleStockMovement(
  supabase: any,
  productId: string,
  warehouseId: string,
  type: string,
  quantity: number,
  reason: string,
  referenceId?: string,
  referenceType?: string,
  notes?: string,
  userId?: string
) {
  // Get current stock
  const { data: currentStock, error: stockError } = await supabase
    .from('product_stock')
    .select('*')
    .eq('product_id', productId)
    .eq('warehouse_id', warehouseId)
    .single()

  let previousStock = 0
  let newStock = 0

  if (stockError || !currentStock) {
    // Handle new stock record
    if (type === 'OUT') {
      return NextResponse.json({
        error: 'Cannot reduce stock for non-existent product in warehouse'
      }, { status: 400 })
    }

    newStock = quantity

    // Create new stock record
    const { data: newStockRecord, error: createError } = await supabase
      .from('product_stock')
      .insert([{
        productId,
        warehouseId,
        quantity: newStock,
        reservedQty: 0,
        lastMovement: new Date().toISOString()
      }])
      .select()
      .single()

    if (createError) {
      console.error('Error creating stock:', createError)
      return NextResponse.json({ error: 'Failed to create stock record' }, { status: 500 })
    }
  } else {
    // Update existing stock
    previousStock = currentStock.quantity

    switch (type) {
      case 'IN':
        newStock = previousStock + quantity
        break
      case 'OUT':
        newStock = previousStock - quantity
        if (newStock < 0) {
          return NextResponse.json({
            error: 'Insufficient stock. Cannot reduce below zero.'
          }, { status: 400 })
        }
        break
      case 'ADJUSTMENT':
        newStock = quantity
        break
      default:
        return NextResponse.json({
          error: 'Invalid movement type'
        }, { status: 400 })
    }

    // Update stock quantity
    const { error: updateError } = await supabase
      .from('product_stock')
      .update({
        quantity: newStock,
        lastMovement: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', currentStock.id)

    if (updateError) {
      console.error('Error updating stock:', updateError)
      return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 })
    }
  }

  // Create movement record
  const { data: movement, error: movementError } = await supabase
    .from('stock_movements')
    .insert([{
      productId,
      warehouseId,
      type,
      quantity,
      previousStock,
      newStock,
      reason,
      referenceId,
      referenceType,
      notes,
      createdBy: userId
    }])
    .select(`
      *,
      product:products(id, name, productCode, unit),
      warehouse:warehouses(id, name, code)
    `)
    .single()

  if (movementError) {
    console.error('Error creating movement:', movementError)
    return NextResponse.json({ error: 'Failed to log stock movement' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: movement
  })
}

// Helper function to handle stock transfers
async function handleStockTransfer(
  supabase: any,
  productId: string,
  sourceWarehouseId: string,
  targetWarehouseId: string,
  quantity: number,
  reason: string,
  referenceId?: string,
  referenceType?: string,
  notes?: string,
  userId?: string
) {
  // Start transaction-like operations
  // 1. Reduce stock from source warehouse
  const outResult = await handleStockMovement(
    supabase,
    productId,
    sourceWarehouseId,
    'OUT',
    quantity,
    `Transfer out: ${reason}`,
    referenceId,
    referenceType,
    notes,
    userId
  )

  if (!outResult.ok) {
    return outResult
  }

  // 2. Add stock to target warehouse
  const inResult = await handleStockMovement(
    supabase,
    productId,
    targetWarehouseId,
    'IN',
    quantity,
    `Transfer in: ${reason}`,
    referenceId,
    referenceType,
    notes,
    userId
  )

  if (!inResult.ok) {
    // TODO: Rollback the OUT movement if IN fails
    return inResult
  }

  return NextResponse.json({
    success: true,
    message: 'Stock transfer completed successfully'
  })
}