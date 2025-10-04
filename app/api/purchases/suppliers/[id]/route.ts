import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Supplier update validation schema
const supplierUpdateSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').optional(),
  type: z.enum(['INDIVIDUAL', 'COMPANY']).optional(),
  category: z.enum(['RAW_MATERIALS', 'SERVICES', 'EQUIPMENT', 'CONSUMABLES', 'OTHER']).optional(),

  // Contact Information
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().min(1, 'Phone number is required').optional(),
  website: z.string().url().optional().or(z.literal('')),

  // Address
  address: z.string().min(1, 'Address is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  country: z.string().min(1, 'Country is required').optional(),
  postalCode: z.string().min(1, 'Postal code is required').optional(),

  // Business Details
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  industry: z.string().optional(),

  // Payment Terms
  paymentTerms: z.enum(['NET_15', 'NET_30', 'NET_45', 'NET_60', 'COD', 'ADVANCE']).optional(),
  creditLimit: z.number().min(0).optional(),
  currency: z.string().optional(),

  // Contact Person
  contactPersonName: z.string().min(1, 'Contact person name is required').optional(),
  contactPersonTitle: z.string().optional(),
  contactPersonEmail: z.string().email().optional().or(z.literal('')),
  contactPersonPhone: z.string().optional(),

  // Performance Tracking
  rating: z.number().min(1).max(5).optional(),

  // Status
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/purchases/suppliers/[id] - Get single supplier with performance data
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
    const { id: supplierId } = await params

    // Get supplier with performance data
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        purchase_orders(
          id,
          status,
          totalAmount,
          createdAt,
          receivedAt,
          expectedDeliveryDate
        )
      `)
      .eq('id', supplierId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Calculate performance metrics
    const purchaseOrders = supplier.purchase_orders || []
    const totalOrders = purchaseOrders.length
    const completedOrders = purchaseOrders.filter((po: any) => po.status === 'RECEIVED').length
    const totalValue = purchaseOrders.reduce((sum: number, po: any) => sum + (po.totalAmount || 0), 0)

    // Calculate on-time delivery rate
    const deliveredOrders = purchaseOrders.filter((po: any) => po.receivedAt && po.expectedDeliveryDate)
    const onTimeDeliveries = deliveredOrders.filter((po: any) =>
      new Date(po.receivedAt) <= new Date(po.expectedDeliveryDate)
    ).length
    const onTimeDeliveryRate = deliveredOrders.length > 0 ? (onTimeDeliveries / deliveredOrders.length) * 100 : 0

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0

    const supplierWithMetrics = {
      ...supplier,
      performance: {
        totalOrders,
        completedOrders,
        totalValue,
        averageOrderValue,
        onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100 * 100) / 100 : 0
      }
    }

    return NextResponse.json({
      success: true,
      data: supplierWithMetrics
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/purchases/suppliers/[id] - Update supplier
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
    const { id: supplierId } = await params
    const body = await request.json()

    // Validate request data
    const validationResult = supplierUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const updateData = validationResult.data

    // Check if email is being updated and not duplicate
    if (updateData.email) {
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('email', updateData.email)
        .neq('id', supplierId)
        .single()

      if (existingSupplier) {
        return NextResponse.json({
          error: 'Email already exists'
        }, { status: 409 })
      }
    }

    // Update the supplier
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', supplierId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: supplier
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/purchases/suppliers/[id] - Soft delete supplier
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
    const { id: supplierId } = await params

    // Check if supplier has active purchase orders
    const { data: activePOs, error: poError } = await supabase
      .from('purchase_orders')
      .select('id')
      .eq('supplier_id', supplierId)
      .in('status', ['DRAFT', 'SENT', 'CONFIRMED'])
      .limit(1)

    if (poError) {
      console.error('Database error:', poError)
      return NextResponse.json({ error: 'Failed to check dependencies' }, { status: 500 })
    }

    if (activePOs && activePOs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete supplier with active purchase orders'
      }, { status: 409 })
    }

    // Soft delete the supplier
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update({
        isActive: false,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', supplierId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Supplier deleted successfully' }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}