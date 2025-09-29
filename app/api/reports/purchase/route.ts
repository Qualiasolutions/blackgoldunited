import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'reports', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get all purchase orders
    const { data: purchaseOrders, error: poError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, total_amount, status, order_date, supplier_id, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (poError) {
      console.error('Error fetching purchase orders:', poError)
      return NextResponse.json({ error: 'Failed to fetch purchase data' }, { status: 500 })
    }

    // Get suppliers
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id, company_name, is_active')
      .is('deleted_at', null)

    const poList = purchaseOrders || []
    const suppliersList = suppliers || []

    // Calculate report metrics
    const totalPurchases = poList.reduce((sum: number, po: any) =>
      sum + (Number(po.total_amount) || 0), 0)

    const poByStatus = {
      DRAFT: poList.filter((po: any) => po.status === 'DRAFT').length,
      SENT: poList.filter((po: any) => po.status === 'SENT').length,
      CONFIRMED: poList.filter((po: any) => po.status === 'CONFIRMED').length,
      DELIVERED: poList.filter((po: any) => po.status === 'DELIVERED').length,
      INVOICED: poList.filter((po: any) => po.status === 'INVOICED').length,
      CANCELLED: poList.filter((po: any) => po.status === 'CANCELLED').length
    }

    // Top suppliers by purchase value
    const supplierPurchases = new Map<string, { name: string, amount: number, orders: number }>()

    poList.forEach((po: any) => {
      const supplier = suppliersList.find((s: any) => s.id === po.supplier_id)
      if (supplier) {
        const existing = supplierPurchases.get(supplier.id) || { name: supplier.company_name, amount: 0, orders: 0 }
        existing.amount += Number(po.total_amount) || 0
        existing.orders += 1
        supplierPurchases.set(supplier.id, existing)
      }
    })

    const topSuppliers = Array.from(supplierPurchases.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    // Monthly purchase trend (last 12 months)
    const monthlyPurchases = new Map<string, number>()
    const last12Months = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      last12Months.push(monthKey)
      monthlyPurchases.set(monthKey, 0)
    }

    poList.forEach((po: any) => {
      const poDate = new Date(po.created_at)
      const monthKey = `${poDate.getFullYear()}-${String(poDate.getMonth() + 1).padStart(2, '0')}`
      if (monthlyPurchases.has(monthKey)) {
        monthlyPurchases.set(monthKey, (monthlyPurchases.get(monthKey) || 0) + (Number(po.total_amount) || 0))
      }
    })

    const purchaseTrend = last12Months.map(month => ({
      month,
      purchases: monthlyPurchases.get(month) || 0
    }))

    const purchaseReport = {
      summary: {
        totalPurchases: Math.round(totalPurchases),
        orderCount: poList.length,
        avgOrderValue: poList.length > 0 ? Math.round(totalPurchases / poList.length) : 0,
        activeSuppliers: suppliersList.filter((s: any) => s.is_active).length
      },
      ordersByStatus: poByStatus,
      topSuppliers,
      purchaseTrend
    }

    return NextResponse.json(purchaseReport)

  } catch (error) {
    console.error('Purchase report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate purchase report' },
      { status: 500 }
    )
  }
}