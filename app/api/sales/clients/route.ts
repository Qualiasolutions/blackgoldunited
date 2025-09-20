import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/sales/clients - Get all clients
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
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('clients')
      .select('*')
      .eq('deletedAt', null)
      .order('createdAt', { ascending: false })

    // Add search filter if provided
    if (search) {
      query = query.or(`companyName.ilike.%${search}%,contactPerson.ilike.%${search}%,email.ilike.%${search}%`)
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
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const { companyName, email } = body
    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Generate client code if not provided
    if (!body.clientCode) {
      const { data: lastClient } = await supabase
        .from('clients')
        .select('clientCode')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      const lastNumber = lastClient?.clientCode ? parseInt(lastClient.clientCode.replace('CL', '')) || 0 : 0
      body.clientCode = `CL${String(lastNumber + 1).padStart(4, '0')}`
    }

    // Insert new client
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
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