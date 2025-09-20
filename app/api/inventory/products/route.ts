import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/inventory/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type')
    const lowStock = searchParams.get('lowStock') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with category and stock information
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        stocks(
          id,
          quantity,
          reservedQty,
          warehouse:warehouses(id, name, code)
        )
      `)
      .eq('deletedAt', null)
      .order('createdAt', { ascending: false })

    // Add filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,productCode.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (categoryId) {
      query = query.eq('categoryId', categoryId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    const { data: products, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Calculate total stock and apply low stock filter if needed
    const productsWithStock = products?.map(product => {
      const totalStock = product.stocks?.reduce((sum: number, stock: any) =>
        sum + (stock.quantity || 0), 0) || 0
      const reservedStock = product.stocks?.reduce((sum: number, stock: any) =>
        sum + (stock.reservedQty || 0), 0) || 0
      const availableStock = totalStock - reservedStock

      return {
        ...product,
        totalStock,
        reservedStock,
        availableStock,
        isLowStock: product.reorderLevel ? availableStock <= product.reorderLevel : false,
        warehouses: product.stocks?.length || 0
      }
    }) || []

    // Filter by low stock if requested
    const filteredProducts = lowStock ?
      productsWithStock.filter(p => p.isLowStock) :
      productsWithStock

    return NextResponse.json({
      products: filteredProducts,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inventory/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const { name, unit, sellingPrice } = body
    if (!name || !unit || sellingPrice === undefined) {
      return NextResponse.json({
        error: 'Product name, unit, and selling price are required'
      }, { status: 400 })
    }

    // Generate product code if not provided
    if (!body.productCode) {
      const { data: lastProduct } = await supabase
        .from('products')
        .select('productCode')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      const lastNumber = lastProduct?.productCode ?
        parseInt(lastProduct.productCode.replace('PRD-', '')) || 0 : 0
      body.productCode = `PRD-${String(lastNumber + 1).padStart(6, '0')}`
    }

    // Insert new product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select(`
        *,
        category:categories(id, name)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Product code already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json({ product }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}