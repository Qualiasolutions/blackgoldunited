import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Product validation schema
const productUpdateSchema = z.object({
  productCode: z.string().min(1, 'Product code is required').optional(),
  name: z.string().min(1, 'Product name is required').optional(),
  description: z.string().optional(),
  type: z.enum(['PRODUCT', 'SERVICE']).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  unit: z.string().min(1, 'Unit is required').optional(),
  costPrice: z.number().min(0, 'Cost price must be non-negative').optional(),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative').optional(),
  minStock: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isTaxable: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  barcode: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  weight: z.number().min(0).optional(),
  dimensions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/inventory/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { id } = await params

    // Validate ID format
    if (!id || id.length < 10) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    // Get product with stock information
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        stocks(
          id,
          warehouseId,
          quantity,
          reservedQty,
          updatedAt,
          warehouse:warehouses(id, name, code, location)
        ),
        stock_movements(
          id,
          type,
          quantity,
          referencetype,
          referenceid,
          notes,
          createdat,
          createdby:profiles(full_name)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }

    // Calculate stock totals
    const totalStock = product.stocks?.reduce((total: number, stock: any) =>
      total + Number(stock.quantity || 0), 0) || 0
    const totalReserved = product.stocks?.reduce((total: number, stock: any) =>
      total + Number(stock.reservedQty || 0), 0) || 0
    const availableStock = totalStock - totalReserved

    const productWithStock = {
      ...product,
      totalStock,
      totalReserved,
      availableStock,
      lowStock: product.reorderLevel ? availableStock <= Number(product.reorderLevel) : false
    }

    return NextResponse.json({
      success: true,
      data: productWithStock
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/inventory/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    // Validate ID format
    if (!id || id.length < 10) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    // Validate request data
    const validationResult = productUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const productData = validationResult.data

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, productCode')
      .eq('id', id)
      .single()

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check for duplicate product code if being updated
    if (productData.productCode && productData.productCode !== existingProduct.productCode) {
      const { data: duplicateProduct } = await supabase
        .from('products')
        .select('id')
        .eq('productCode', productData.productCode)
        .neq('id', id)
        .single()

      if (duplicateProduct) {
        return NextResponse.json({
          error: 'Product code already exists'
        }, { status: 409 })
      }
    }

    // Update the product
    const { data: product, error } = await supabase
      .from('products')
      .update({
        ...productData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        stocks(
          warehouseId,
          quantity,
          reservedQty,
          warehouse:warehouses(id, name, code)
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    // Calculate stock totals
    const totalStock = product.stocks?.reduce((total: number, stock: any) =>
      total + Number(stock.quantity || 0), 0) || 0
    const totalReserved = product.stocks?.reduce((total: number, stock: any) =>
      total + Number(stock.reservedQty || 0), 0) || 0

    const productWithStock = {
      ...product,
      totalStock,
      totalReserved,
      availableStock: totalStock - totalReserved,
      lowStock: product.reorderLevel ? (totalStock - totalReserved) <= Number(product.reorderLevel) : false
    }

    return NextResponse.json({
      success: true,
      data: productWithStock
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/inventory/products/[id] - Delete product (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { id } = await params

    // Validate ID format
    if (!id || id.length < 10) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    // Check if product exists and isn't already deleted
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, name, totalStock:stocks(quantity)')
      .eq('id', id)
      .single()

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product has stock (prevent deletion if stock exists)
    const totalStock = existingProduct.totalStock?.reduce((total: number, stock: any) =>
      total + Number(stock.quantity || 0), 0) || 0

    if (totalStock > 0) {
      return NextResponse.json({
        error: 'Cannot delete product with existing stock. Please transfer or adjust stock to zero first.'
      }, { status: 400 })
    }

    // Perform soft delete
    const { error } = await supabase
      .from('products')
      .update({
        deletedAt: new Date().toISOString(),
        isActive: false
      })
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}