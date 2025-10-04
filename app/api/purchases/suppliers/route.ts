import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Supplier validation schema
const supplierSchema = z.object({
  supplierCode: z.string().min(1, 'Supplier code is required'),
  name: z.string().min(1, 'Supplier name is required'),
  type: z.enum(['INDIVIDUAL', 'COMPANY']).default('COMPANY'),
  category: z.enum(['RAW_MATERIALS', 'SERVICES', 'EQUIPMENT', 'CONSUMABLES', 'OTHER']).default('RAW_MATERIALS'),

  // Contact Information
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  website: z.string().url().optional().or(z.literal('')),

  // Address
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required'),

  // Business Details
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  industry: z.string().optional(),

  // Payment Terms
  paymentTerms: z.enum(['NET_15', 'NET_30', 'NET_45', 'NET_60', 'COD', 'ADVANCE']).default('NET_30'),
  creditLimit: z.number().min(0).default(0),
  currency: z.string().default('USD'),

  // Contact Person
  contactPersonName: z.string().min(1, 'Contact person name is required'),
  contactPersonTitle: z.string().optional(),
  contactPersonEmail: z.string().email().optional().or(z.literal('')),
  contactPersonPhone: z.string().optional(),

  // Performance Tracking (will be calculated)
  rating: z.number().min(1).max(5).default(3),

  // Status
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

const supplierUpdateSchema = supplierSchema.partial()

// GET /api/purchases/suppliers - List suppliers with search and pagination
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - purchases module uses 'purchase' key for backward compatibility
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'GET')
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
    const paymentTerms = searchParams.get('paymentTerms') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const offset = (page - 1) * limit

    // Build query with count
    let queryBuilder = supabase
      .from('suppliers')
      .select(`
        *,
        _count:purchase_orders(count)
      `, { count: 'exact' })
      // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,supplierCode.ilike.%${query}%,email.ilike.%${query}%`)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    if (type) {
      queryBuilder = queryBuilder.eq('type', type)
    }

    if (isActive !== null) {
      queryBuilder = queryBuilder.eq('isActive', isActive === 'true')
    }

    if (paymentTerms) {
      queryBuilder = queryBuilder.eq('paymentTerms', paymentTerms)
    }

    // Get paginated results
    const { data: suppliers, error, count } = await queryBuilder
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: suppliers || [],
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

// POST /api/purchases/suppliers - Create new supplier
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
    const validationResult = supplierSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const supplierData = validationResult.data

    // Check for duplicate supplier code or email
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('id, supplierCode, email')
      .or(`supplierCode.eq.${supplierData.supplierCode},email.eq.${supplierData.email}`)
      .single()

    if (existingSupplier) {
      const duplicateField = existingSupplier.supplierCode === supplierData.supplierCode ? 'Supplier code' : 'Email'
      return NextResponse.json({
        error: `${duplicateField} already exists`
      }, { status: 409 })
    }

    // Generate supplier code if not provided (auto-increment)
    if (!supplierData.supplierCode) {
      const { data: lastSupplier } = await supabase
        .from('suppliers')
        .select('supplierCode')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      const lastNumber = lastSupplier?.supplierCode ?
        parseInt(lastSupplier.supplierCode.replace('SUP-', '')) || 0 : 0
      supplierData.supplierCode = `SUP-${String(lastNumber + 1).padStart(6, '0')}`
    }

    // Create the supplier
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert([{
        ...supplierData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: supplier
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}