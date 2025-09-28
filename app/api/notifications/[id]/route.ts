import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { read } = await request.json()
    const params = await context.params
    const notificationId = params.id

    // Update notification in database
    const { data: notification, error: updateError } = await supabase
      .from('notifications')
      .update({ read })
      .eq('id', notificationId)
      .eq('user_id', user.id)
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
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const notificationId = params.id

    // Delete notification from database
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id)

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