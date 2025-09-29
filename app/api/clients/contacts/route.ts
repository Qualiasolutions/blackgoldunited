import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/clients/contacts - Get client contacts
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'clients', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const clientId = searchParams.get('clientId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('client_contacts')
      .select(`
        id,
        client_id,
        first_name,
        last_name,
        email,
        phone,
        mobile,
        position,
        department,
        is_primary,
        is_active,
        notes,
        created_at,
        updated_at,
        clients!client_contacts_client_id_fkey(
          id,
          company_name,
          client_code
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch client contacts' }, { status: 500 })
    }

    // Format data for frontend
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      clientId: item.client_id,
      clientName: item.clients?.company_name || 'Unknown Client',
      firstName: item.first_name,
      lastName: item.last_name,
      fullName: `${item.first_name} ${item.last_name}`.trim(),
      email: item.email,
      phone: item.phone,
      mobile: item.mobile,
      position: item.position,
      department: item.department,
      isPrimary: item.is_primary,
      isActive: item.is_active,
      notes: item.notes,
      createdAt: item.created_at
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/clients/contacts - Create client contact
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'clients', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // If this is the first contact for the client, make it primary
    const { count } = await supabase
      .from('client_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', body.clientId)

    const isPrimary = count === 0 ? true : (body.isPrimary || false)

    // If setting as primary, unset other primary contacts for this client
    if (isPrimary) {
      await supabase
        .from('client_contacts')
        .update({ is_primary: false })
        .eq('client_id', body.clientId)
    }

    const { data, error } = await supabase
      .from('client_contacts')
      .insert({
        client_id: body.clientId,
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        mobile: body.mobile,
        position: body.position,
        department: body.department,
        is_primary: isPrimary,
        is_active: body.isActive !== undefined ? body.isActive : true,
        notes: body.notes,
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create client contact' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}