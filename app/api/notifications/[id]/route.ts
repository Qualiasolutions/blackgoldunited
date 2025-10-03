import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Authenticate and authorize (updating notifications requires authentication)
  const authResult = await authenticateAndAuthorize(request, 'reports', 'PUT')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {

    const supabase = await createClient()

    const { read } = await request.json()
    const params = await context.params
    const notificationId = params.id

    // Update notification in database
    const { data: notification, error: updateError } = await supabase
      .from('notifications')
      .update({ read })
      .eq('id', notificationId)
      .eq('user_id', authResult.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating notification:', updateError)
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Authenticate and authorize (deleting notifications requires authentication)
  const authResult = await authenticateAndAuthorize(request, 'reports', 'DELETE')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {

    const supabase = await createClient()

    const params = await context.params
    const notificationId = params.id

    // Delete notification from database
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', authResult.user.id)

    if (deleteError) {
      console.error('Error deleting notification:', deleteError)
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      id: notificationId
    })

  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}