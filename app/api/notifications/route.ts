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

    // For now, return structured mock notifications until DB table is created
    // In production, this would query: SELECT * FROM notifications WHERE user_id = user.id ORDER BY created_at DESC
    const mockNotifications = [
      {
        id: '1',
        user_id: user.id,
        title: 'New Invoice Payment',
        message: 'Payment received for Invoice #INV-2024-1001 from Emerald Holdings LLC',
        type: 'success',
        module: 'sales',
        related_id: 'inv-001',
        read: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        user_id: user.id,
        title: 'Low Stock Alert',
        message: 'Product "Premium Oil Filter" is running low in stock (5 units remaining)',
        type: 'warning',
        module: 'inventory',
        related_id: 'prod-002',
        read: false,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        user_id: user.id,
        title: 'Purchase Order Approved',
        message: 'Purchase Order #PO-2024-0087 has been approved and sent to supplier',
        type: 'info',
        module: 'purchase',
        related_id: 'po-087',
        read: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        user_id: user.id,
        title: 'New Client Registration',
        message: 'Phoenix Industries has been successfully registered as a new client',
        type: 'success',
        module: 'clients',
        related_id: 'client-004',
        read: true,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ]

    const unreadCount = mockNotifications.filter(n => !n.read).length

    return NextResponse.json({
      notifications: mockNotifications,
      unreadCount
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}