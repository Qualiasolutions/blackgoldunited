import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get all purchase orders
    const { data: purchaseOrders, error: poError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, total_amount, status, order_date, created_at, supplier_id')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (poError) {
      console.error('Error fetching purchase orders:', poError)
      return NextResponse.json(
        { error: 'Failed to fetch purchase orders' },
        { status: 500 }
      )
    }

    // Get active suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id, company_name, is_active')
      .is('deleted_at', null)
      .eq('is_active', true)

    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError)
    }

    // Get products for inventory tracking
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('is_active', true)
      .eq('type', 'PRODUCT')
      .is('deleted_at', null)

    if (productsError) {
      console.error('Error fetching products:', productsError)
    }

    const poList = purchaseOrders || []
    const suppliersList = suppliers || []
    const productsList = products || []

    // Calculate this quarter's purchase value (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const quarterlyPurchaseValue = poList
      .filter((po: any) => new Date(po.created_at) >= ninetyDaysAgo)
      .reduce((sum: number, po: any) => sum + (Number(po.total_amount) || 0), 0)

    // Count active suppliers
    const activeSuppliersCount = suppliersList.length

    // Count pending orders
    const pendingOrders = poList.filter((po: any) =>
      ['DRAFT', 'SENT', 'CONFIRMED'].includes(po.status)
    ).length

    // Calculate items received this month
    const oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)

    const itemsReceivedThisMonth = poList.filter((po: any) =>
      po.status === 'DELIVERED' &&
      new Date(po.created_at) >= oneMonthAgo
    ).length

    // Get recent purchase orders with supplier info
    const recentOrders = poList.slice(0, 10).map((po: any) => {
      const supplier = suppliersList.find((s: any) => s.id === po.supplier_id)

      return {
        id: po.po_number || `PO-${po.id.substring(0, 8)}`,
        supplier: supplier?.company_name || 'Unknown Supplier',
        amount: Number(po.total_amount) || 0,
        status: po.status === 'DRAFT' ? 'Pending' :
                po.status === 'DELIVERED' ? 'Delivered' :
                po.status === 'CONFIRMED' ? 'Approved' :
                po.status === 'SENT' ? 'Pending' : 'Pending',
        date: new Date(po.order_date || po.created_at).toISOString().split('T')[0]
      }
    })

    const purchaseStats = {
      totalPurchaseValue: Math.round(quarterlyPurchaseValue),
      activeSuppliers: activeSuppliersCount,
      pendingOrders,
      itemsReceived: itemsReceivedThisMonth,
      recentOrders
    }

    return NextResponse.json(purchaseStats)

  } catch (error) {
    console.error('Purchase stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase statistics' },
      { status: 500 }
    )
  }
}