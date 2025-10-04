import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/inventory/stock - Get stock levels with filtering
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
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock') === 'true'
    const outOfStock = searchParams.get('outOfStock') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build stock query with product and warehouse details
    let stockQuery = supabase
      .from('product_stock')
      .select(`
        id,
        productId,
        warehouseId,
        quantity,
        reservedQty,
        minStock,
        maxStock,
        reorderLevel,
        lastMovement,
        createdAt,
        updatedAt,
        product:products(
          id,
          name,
          productCode,
          unit,
          categoryId,
          sellingPrice,
          costPrice,
          category:categories(id, name)
        ),
        warehouse:warehouses(
          id,
          name,
          code,
          location
        )
      `)

    // Apply search filter
    if (query) {
      stockQuery = stockQuery.or(
        `product.name.ilike.%${query}%,product.productCode.ilike.%${query}%`
      )
    }

    // Apply warehouse filter
    if (warehouse) {
      stockQuery = stockQuery.eq('warehouse_id', warehouse)
    }

    // Apply category filter
    if (category) {
      stockQuery = stockQuery.eq('product.categoryId', category)
    }

    // Get total count for pagination
    const countQuery = supabase
      .from('product_stock')
      .select('id', { count: 'exact', head: true })

    // Apply same filters to count query
    if (warehouse) {
      countQuery.eq('warehouse_id', warehouse)
    }

    const { count: totalCount } = await countQuery

    // Execute main query with pagination
    const { data: stockData, error } = await stockQuery
      .range(offset, offset + limit - 1)
      .order('product.name')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 })
    }

    // Process stock data to add calculated fields
    const processedStocks = (stockData || []).map(stock => {
      const availableStock = stock.quantity - stock.reservedQty
      const isLowStock = stock.reorderLevel ? availableStock <= stock.reorderLevel : false
      const isOutOfStock = availableStock <= 0

      // Apply stock level filters
      if (lowStock && !isLowStock) return null
      if (outOfStock && !isOutOfStock) return null

      return {
        ...stock,
        availableStock,
        lowStock: isLowStock,
        outOfStock: isOutOfStock
      }
    }).filter(Boolean)

    const filteredCount = processedStocks.length
    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      success: true,
      data: processedStocks,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: totalPages,
        filtered: filteredCount
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inventory/stock - Create stock adjustment
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
      adjustmentType, // 'IN', 'OUT', 'ADJUSTMENT'
      quantity,
      reason,
      notes
    } = body

    // Validate required fields
    if (!productId || !warehouseId || !adjustmentType || quantity === undefined || !reason) {
      return NextResponse.json({
        error: 'Missing required fields: productId, warehouseId, adjustmentType, quantity, reason'
      }, { status: 400 })
    }

    if (quantity === 0) {
      return NextResponse.json({
        error: 'Quantity cannot be zero'
      }, { status: 400 })
    }

    // Get current stock
    const { data: currentStock, error: stockError } = await supabase
      .from('product_stock')
      .select('*')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .single()

    if (stockError || !currentStock) {
      // Create new stock record if doesn't exist
      if (adjustmentType === 'OUT' || (adjustmentType === 'ADJUSTMENT' && quantity < 0)) {
        return NextResponse.json({
          error: 'Cannot reduce stock for non-existent product in warehouse'
        }, { status: 400 })
      }

      // Create new stock record
      const newQuantity = adjustmentType === 'IN' ? quantity : Math.abs(quantity)
      const { data: newStock, error: createError } = await supabase
        .from('product_stock')
        .insert([{
          productId,
          warehouseId,
          quantity: newQuantity,
          reservedQty: 0,
          lastMovement: new Date().toISOString()
        }])
        .select()
        .single()

      if (createError) {
        console.error('Error creating stock:', createError)
        return NextResponse.json({ error: 'Failed to create stock record' }, { status: 500 })
      }

      // Log movement
      await supabase
        .from('stock_movements')
        .insert([{
          productId,
          warehouseId,
          type: adjustmentType,
          quantity: Math.abs(quantity),
          previousStock: 0,
          newStock: newQuantity,
          reason,
          notes,
          createdBy: authResult.user.id
        }])

      return NextResponse.json({
        success: true,
        data: newStock
      })
    }

    // Calculate new stock quantity
    let newQuantity = currentStock.quantity
    const previousStock = currentStock.quantity

    switch (adjustmentType) {
      case 'IN':
        newQuantity += quantity
        break
      case 'OUT':
        newQuantity -= quantity
        if (newQuantity < 0) {
          return NextResponse.json({
            error: 'Insufficient stock. Cannot reduce below zero.'
          }, { status: 400 })
        }
        break
      case 'ADJUSTMENT':
        newQuantity = quantity >= 0 ? quantity : currentStock.quantity + quantity
        if (newQuantity < 0) {
          return NextResponse.json({
            error: 'Invalid adjustment. Stock cannot be negative.'
          }, { status: 400 })
        }
        break
    }

    // Update stock
    const { data: updatedStock, error: updateError } = await supabase
      .from('product_stock')
      .update({
        quantity: newQuantity,
        lastMovement: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', currentStock.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating stock:', updateError)
      return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 })
    }

    // Log movement
    const movementQuantity = adjustmentType === 'ADJUSTMENT'
      ? Math.abs(newQuantity - previousStock)
      : Math.abs(quantity)

    await supabase
      .from('stock_movements')
      .insert([{
        productId,
        warehouseId,
        type: adjustmentType,
        quantity: movementQuantity,
        previousStock,
        newStock: newQuantity,
        reason,
        notes,
        createdBy: authResult.user.id
      }])

    return NextResponse.json({
      success: true,
      data: updatedStock
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}