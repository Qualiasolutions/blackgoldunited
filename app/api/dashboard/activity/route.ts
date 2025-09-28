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

    // For now, return structured activity data
    // In production, this would aggregate from multiple tables: invoices, purchase_orders, clients, etc.
    const recentTransactions = [
      {
        id: '1',
        type: 'invoice_payment',
        title: 'Invoice #INV-2024-1001',
        description: 'Payment received from Emerald Holdings LLC',
        amount: 8750,
        module: 'sales',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        status: 'completed'
      },
      {
        id: '2',
        type: 'purchase_order',
        title: 'Purchase Order #PO-2024-0087',
        description: 'Automotive Parts Supply Order',
        amount: -12300,
        module: 'purchase',
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
        status: 'pending'
      },
      {
        id: '3',
        type: 'invoice_payment',
        title: 'Invoice #INV-2024-0998',
        description: 'Payment received from Phoenix Industries',
        amount: 15600,
        module: 'sales',
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        status: 'completed'
      },
      {
        id: '4',
        type: 'expense',
        title: 'Office Supplies',
        description: 'Monthly office equipment purchase',
        amount: -850,
        module: 'finance',
        created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours ago
        status: 'completed'
      },
      {
        id: '5',
        type: 'invoice_payment',
        title: 'Invoice #INV-2024-0995',
        description: 'Payment received from Gulf Machinery LLC',
        amount: 22400,
        module: 'sales',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        status: 'completed'
      }
    ]

    const systemActivity = [
      {
        id: '1',
        action: 'Client registered',
        description: 'Phoenix Industries successfully added to client database',
        user: 'System',
        module: 'clients',
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
        type: 'success'
      },
      {
        id: '2',
        action: 'Low stock alert',
        description: 'Premium Oil Filter inventory below minimum threshold',
        user: 'System',
        module: 'inventory',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        type: 'warning'
      },
      {
        id: '3',
        action: 'Invoice generated',
        description: 'Automated invoice INV-2024-1002 created for recurring client',
        user: 'System',
        module: 'sales',
        created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(), // 22 minutes ago
        type: 'info'
      },
      {
        id: '4',
        action: 'Purchase order approved',
        description: 'PO-2024-0087 approved by management team',
        user: user.email?.split('@')[0] || 'User',
        module: 'purchase',
        created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 minutes ago
        type: 'success'
      },
      {
        id: '5',
        action: 'Report generated',
        description: 'Monthly financial summary report completed',
        user: 'System',
        module: 'finance',
        created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(), // 55 minutes ago
        type: 'info'
      }
    ]

    return NextResponse.json({
      recentTransactions,
      systemActivity
    })

  } catch (error) {
    console.error('Error fetching dashboard activity:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}