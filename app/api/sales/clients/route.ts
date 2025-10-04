import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/sales/clients - Get all clients
export async function GET(request: NextRequest) {
  const authResult = await authenticateAndAuthorize(request, 'clients', 'GET')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const supabase = await createClient()

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with CORRECT snake_case column names
    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    // Add search filter if provided (using snake_case)
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    const { data: clients, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    return NextResponse.json({
      clients,
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

// POST /api/sales/clients - Create new client
export async function POST(request: NextRequest) {
  const authResult = await authenticateAndAuthorize(request, 'clients', 'POST')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const supabase = await createClient()

    const body = await request.json()

    // Validate required fields
    const { company_name, email } = body
    if (!company_name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Generate client code if not provided
    if (!body.client_code) {
      const { data: lastClient } = await supabase
        .from('clients')
        .select('client_code')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const lastNumber = lastClient?.client_code ? parseInt(lastClient.client_code.replace('CL', '')) || 0 : 0
      body.client_code = `CL${String(lastNumber + 1).padStart(4, '0')}`
    }

    // Insert new client (Supabase automatically handles created_at, updated_at if they have defaults)
    const { data: client, error } = await supabase
      .from('clients')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Client code or email already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }

    return NextResponse.json({ client }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
