import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/sales/clients/[id] - Get specific client
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await authenticateAndAuthorize(request, 'clients', 'GET')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { id } = await params
  try {
    const supabase = await createClient()

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('deletedAt', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
    }

    return NextResponse.json({ client })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/sales/clients/[id] - Update client
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await authenticateAndAuthorize(request, 'clients', 'PUT')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { id } = await params
  try {
    const supabase = await createClient()

    const body = await request.json()

    // Remove fields that shouldn't be updated
    const { id, createdAt, ...updateData } = body
    updateData.updatedAt = new Date().toISOString()

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .eq('deletedAt', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Client code or email already exists' }, { status: 409 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    return NextResponse.json({ client })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/sales/clients/[id] - Soft delete client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await authenticateAndAuthorize(request, 'clients', 'DELETE')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { id } = await params
  try {
    const supabase = await createClient()

    // Soft delete by setting deletedAt timestamp
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .eq('deletedAt', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Client deleted successfully' })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}