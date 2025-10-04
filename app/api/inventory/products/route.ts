import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Product validation schema
const productSchema = z.object({
  productCode: z.string().min(1, 'Product code is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  type: z.enum(['PRODUCT', 'SERVICE']).default('PRODUCT'),
  categoryId: z.string().uuid().optional(),
  unit: z.string().min(1, 'Unit is required'),
  costPrice: z.number().min(0, 'Cost price must be non-negative').optional(),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative'),
  minStock: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  isTaxable: z.boolean().default(true),
  taxRate: z.number().min(0).max(100).default(0),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.string().optional(),
  notes: z.string().optional(),
})

const productUpdateSchema = productSchema.partial()

// GET /api/inventory/products - List products with search and pagination
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
    const category = searchParams.get('category') || ''
    const type = searchParams.get('type') || ''
    const isActive = searchParams.get('isActive')
    const lowStock = searchParams.get('lowStock') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const offset = (page - 1) * limit

    // Build query
    let queryBuilder = supabase
      .from('products')
      .select(`
        *,
        stocks(
          warehouseId,
          quantity,
          reservedQty,
          warehouse:warehouses(id, name, code)
        )
      `)
      // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,productCode.ilike.%${query}%,description.ilike.%${query}%`)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category_id', category)
    }

    if (type) {
      queryBuilder = queryBuilder.eq('type', type)
    }

    if (isActive !== null) {
      queryBuilder = queryBuilder.eq('is_active', isActive === 'true')
    }

    // Get total count for pagination
    const { count } = await queryBuilder

    // Get paginated results
    const { data: products, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Calculate total stock for each product
    const productsWithStock = products?.map(product => ({
      ...product,
      totalStock: product.stocks?.reduce((total: number, stock: any) => total + Number(stock.quantity || 0), 0) || 0,
      totalReserved: product.stocks?.reduce((total: number, stock: any) => total + Number(stock.reservedQty || 0), 0) || 0,
      availableStock: product.stocks?.reduce((total: number, stock: any) => total + Number(stock.quantity || 0) - Number(stock.reservedQty || 0), 0) || 0,
      lowStock: product.reorderLevel ?
        (product.stocks?.reduce((total: number, stock: any) => total + Number(stock.quantity || 0), 0) || 0) <= Number(product.reorderLevel) :
        false
    }))

    // Filter by low stock if requested
    const filteredProducts = lowStock ?
      productsWithStock?.filter(p => p.lowStock) :
      productsWithStock

    return NextResponse.json({
      success: true,
      data: filteredProducts,
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

// POST /api/inventory/products - Create new product
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = productSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const productData = validationResult.data

    // Check for duplicate product code
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('product_code', productData.productCode)
      .single()

    if (existingProduct) {
      return NextResponse.json({
        error: 'Product code already exists'
      }, { status: 409 })
    }

    // Generate product code if not provided
    if (!productData.productCode) {
      const { data: lastProduct } = await supabase
        .from('products')
        .select('productCode')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const lastNumber = lastProduct?.productCode ?
        parseInt(lastProduct.productCode.replace('PRD-', '')) || 0 : 0
      productData.productCode = `PRD-${String(lastNumber + 1).padStart(6, '0')}`
    }

    // Create the product
    const { data: product, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    // Initialize stock entries for all active warehouses
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id')
      .eq('is_active', true)

    if (warehouses && warehouses.length > 0) {
      const stockEntries = warehouses.map(warehouse => ({
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: 0,
        reservedQty: 0,
        updatedAt: new Date().toISOString()
      }))

      await supabase.from('stocks').insert(stockEntries)
    }

    return NextResponse.json({
      success: true,
      data: product
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}