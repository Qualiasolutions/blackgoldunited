import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query notifications from database
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Count unread notifications
    const unreadCount = notifications?.filter(n => !n.read).length || 0

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, type, module, related_id, target_user_id } = body

    // Validate required fields
    if (!title || !message || !type) {
      return NextResponse.json({ error: 'Missing required fields: title, message, type' }, { status: 400 })
    }

    // Validate type
    if (!['success', 'warning', 'error', 'info'].includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    // Create notification
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: target_user_id || user.id,
        title,
        message,
        type,
        module,
        related_id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating notification:', insertError)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}