import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Report parameters schema
const reportParamsSchema = z.object({
  reportType: z.enum([
    'purchase_summary',
    'supplier_performance',
    'spend_analysis',
    'pending_approvals',
    'overdue_invoices',
    'inventory_receipts',
    'purchase_trends'
  ]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  supplierId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  groupBy: z.enum(['supplier', 'category', 'product', 'month', 'status']).optional(),
  limit: z.number().min(1).max(1000).default(100)
})

// GET /api/purchases/reports - Generate various purchase reports
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Parse and validate parameters
    const params = {
      reportType: searchParams.get('reportType') || 'purchase_summary',
      startDate: searchParams.get('startDate') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Default: last 90 days
      endDate: searchParams.get('endDate') || new Date().toISOString(),
      supplierId: searchParams.get('supplierId') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      status: searchParams.get('status') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      groupBy: searchParams.get('groupBy') || undefined,
      limit: parseInt(searchParams.get('limit') || '100')
    }

    const validationResult = reportParamsSchema.safeParse(params)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid report parameters',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { reportType, startDate, endDate, supplierId, limit } = validationResult.data

    let reportData: any = {}

    switch (reportType) {
      case 'purchase_summary':
        reportData = await generatePurchaseSummaryReport(supabase, { startDate, endDate, supplierId, limit })
        break

      case 'supplier_performance':
        reportData = await generateSupplierPerformanceReport(supabase, { startDate, endDate, supplierId, limit })
        break

      case 'spend_analysis':
        reportData = await generateSpendAnalysisReport(supabase, { startDate, endDate, supplierId, limit })
        break

      case 'pending_approvals':
        reportData = await generatePendingApprovalsReport(supabase, { limit })
        break

      case 'overdue_invoices':
        reportData = await generateOverdueInvoicesReport(supabase, { limit })
        break

      case 'inventory_receipts':
        reportData = await generateInventoryReceiptsReport(supabase, { startDate, endDate, limit })
        break

      case 'purchase_trends':
        reportData = await generatePurchaseTrendsReport(supabase, { startDate, endDate, limit })
        break

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        reportType,
        generatedAt: new Date().toISOString(),
        parameters: validationResult.data,
        ...reportData
      }
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

// Purchase Summary Report
async function generatePurchaseSummaryReport(supabase: any, params: any) {
  const { startDate, endDate, supplierId, limit } = params

  // Base query for purchase orders
  let poQuery = supabase
    .from('purchase_orders')
    .select(`
      id,
      poNumber,
      orderDate,
      status,
      totalAmount,
      supplier:suppliers(id, name, supplierCode)
    `)
    .gte('orderDate', startDate)
    .lte('orderDate', endDate)
    if (supplierId) {
    poQuery = poQuery.eq('supplierId', supplierId)
  }

  const { data: purchaseOrders, error: poError } = await poQuery
    .order('orderDate', { ascending: false })
    .limit(limit)

  if (poError) throw poError

  // Calculate summary metrics
  const totalOrders = purchaseOrders?.length || 0
  const totalValue = purchaseOrders?.reduce((sum: number, po: any) => sum + (po.totalAmount || 0), 0) || 0
  const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0

  const statusCounts = purchaseOrders?.reduce((acc: any, po: any) => {
    acc[po.status] = (acc[po.status] || 0) + 1
    return acc
  }, {}) || {}

  const supplierCounts = purchaseOrders?.reduce((acc: any, po: any) => {
    const supplierKey = `${po.supplier?.name || 'Unknown'} (${po.supplier?.supplierCode || 'N/A'})`
    acc[supplierKey] = (acc[supplierKey] || 0) + 1
    return acc
  }, {}) || {}

  return {
    summary: {
      totalOrders,
      totalValue,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      statusBreakdown: statusCounts,
      supplierBreakdown: supplierCounts
    },
    orders: purchaseOrders?.slice(0, 20) || [] // Top 20 recent orders
  }
}

// Supplier Performance Report
async function generateSupplierPerformanceReport(supabase: any, params: any) {
  const { startDate, endDate, supplierId, limit } = params

  let query = supabase
    .from('suppliers')
    .select(`
      id,
      name,
      supplierCode,
      rating,
      purchase_orders!inner(
        id,
        orderDate,
        status,
        totalAmount,
        expectedDeliveryDate,
        receivedAt,
        purchase_receipts(
          id,
          receivedDate,
          status
        )
      )
    `)
    if (supplierId) {
    query = query.eq('id', supplierId)
  }

  // Filter by date range on purchase orders
  query = query
    .gte('purchase_orders.orderDate', startDate)
    .lte('purchase_orders.orderDate', endDate)

  const { data: suppliers, error } = await query.limit(limit)

  if (error) throw error

  // Calculate performance metrics for each supplier
  const performanceData = suppliers?.map((supplier: any) => {
    const orders = supplier.purchase_orders || []
    const totalOrders = orders.length
    const totalValue = orders.reduce((sum: number, po: any) => sum + (po.totalAmount || 0), 0)

    const completedOrders = orders.filter((po: any) => po.status === 'RECEIVED')
    const onTimeDeliveries = orders.filter((po: any) => {
      return po.receivedAt && po.expectedDeliveryDate &&
        new Date(po.receivedAt) <= new Date(po.expectedDeliveryDate)
    })

    const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0
    const completionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0
    const onTimeDeliveryRate = orders.length > 0 ? (onTimeDeliveries.length / orders.length) * 100 : 0

    return {
      supplier: {
        id: supplier.id,
        name: supplier.name,
        supplierCode: supplier.supplierCode,
        currentRating: supplier.rating
      },
      metrics: {
        totalOrders,
        totalValue,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100
      }
    }
  }) || []

  // Sort by total value descending
  performanceData.sort((a: any, b: any) => b.metrics.totalValue - a.metrics.totalValue)

  return {
    suppliers: performanceData,
    summary: {
      totalSuppliers: performanceData.length,
      totalSpend: performanceData.reduce((sum: number, s: any) => sum + s.metrics.totalValue, 0),
      avgCompletionRate: performanceData.length > 0 ?
        performanceData.reduce((sum: number, s: any) => sum + s.metrics.completionRate, 0) / performanceData.length : 0,
      avgOnTimeRate: performanceData.length > 0 ?
        performanceData.reduce((sum: number, s: any) => sum + s.metrics.onTimeDeliveryRate, 0) / performanceData.length : 0
    }
  }
}

// Spend Analysis Report
async function generateSpendAnalysisReport(supabase: any, params: any) {
  const { startDate, endDate, supplierId, limit } = params

  // Get spend by supplier
  let spendQuery = supabase
    .from('purchase_orders')
    .select(`
      totalAmount,
      orderDate,
      supplier:suppliers(id, name, supplierCode, category)
    `)
    .gte('orderDate', startDate)
    .lte('orderDate', endDate)
    .eq('status', 'RECEIVED')
    if (supplierId) {
    spendQuery = spendQuery.eq('supplierId', supplierId)
  }

  const { data: spendData, error } = await spendQuery

  if (error) throw error

  // Group by supplier
  const supplierSpend = spendData?.reduce((acc: any, po: any) => {
    const supplierId = po.supplier?.id || 'unknown'
    const supplierInfo = po.supplier || { name: 'Unknown', supplierCode: 'N/A', category: 'OTHER' }

    if (!acc[supplierId]) {
      acc[supplierId] = {
        supplier: supplierInfo,
        totalSpend: 0,
        orderCount: 0,
        avgOrderValue: 0
      }
    }

    acc[supplierId].totalSpend += po.totalAmount || 0
    acc[supplierId].orderCount += 1
    acc[supplierId].avgOrderValue = acc[supplierId].totalSpend / acc[supplierId].orderCount

    return acc
  }, {}) || {}

  // Convert to array and sort
  const supplierArray = Object.values(supplierSpend)
    .sort((a: any, b: any) => b.totalSpend - a.totalSpend)
    .slice(0, limit)

  // Group by category
  const categorySpend = spendData?.reduce((acc: any, po: any) => {
    const category = po.supplier?.category || 'OTHER'
    acc[category] = (acc[category] || 0) + (po.totalAmount || 0)
    return acc
  }, {}) || {}

  // Monthly trend
  const monthlySpend = spendData?.reduce((acc: any, po: any) => {
    const month = new Date(po.orderDate).toISOString().substr(0, 7) // YYYY-MM
    acc[month] = (acc[month] || 0) + (po.totalAmount || 0)
    return acc
  }, {}) || {}

  const totalSpend = spendData?.reduce((sum: number, po: any) => sum + (po.totalAmount || 0), 0) || 0

  return {
    totalSpend,
    supplierSpend: supplierArray,
    categoryBreakdown: categorySpend,
    monthlyTrend: Object.entries(monthlySpend)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }
}

// Pending Approvals Report
async function generatePendingApprovalsReport(supabase: any, params: any) {
  const { limit } = params

  const { data: pendingOrders, error } = await supabase
    .from('purchase_orders')
    .select(`
      id,
      poNumber,
      orderDate,
      totalAmount,
      priority,
      supplier:suppliers(name, supplierCode),
      createdBy:users!purchase_orders_createdBy_fkey(firstName, lastName, email)
    `)
    .eq('approvalStatus', 'PENDING')
    .order('orderDate', { ascending: true })
    .limit(limit)

  if (error) throw error

  // Calculate aging
  const ordersWithAging = pendingOrders?.map((order: any) => ({
    ...order,
    daysWaiting: Math.floor((new Date().getTime() - new Date(order.orderDate).getTime()) / (1000 * 60 * 60 * 24))
  })) || []

  const totalPendingValue = ordersWithAging.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
  const avgWaitTime = ordersWithAging.length > 0 ?
    ordersWithAging.reduce((sum: number, order: any) => sum + order.daysWaiting, 0) / ordersWithAging.length : 0

  return {
    pendingOrders: ordersWithAging,
    summary: {
      totalPendingOrders: ordersWithAging.length,
      totalPendingValue,
      avgWaitTime: Math.round(avgWaitTime * 100) / 100,
      urgentOrders: ordersWithAging.filter((order: any) => order.priority === 'URGENT').length,
      overdueOrders: ordersWithAging.filter((order: any) => order.daysWaiting > 7).length
    }
  }
}

// Overdue Invoices Report
async function generateOverdueInvoicesReport(supabase: any, params: any) {
  const { limit } = params

  const currentDate = new Date().toISOString()

  const { data: overdueInvoices, error } = await supabase
    .from('purchase_invoices')
    .select(`
      id,
      invoiceNumber,
      supplierInvoiceNumber,
      invoiceDate,
      dueDate,
      totalAmount,
      paidAmount,
      remainingAmount:totalAmount,
      supplier:suppliers(name, supplierCode, contactPersonName, contactPersonEmail),
      payments:purchase_payments(amount, status)
    `)
    .lt('dueDate', currentDate)
    .neq('paymentStatus', 'PAID')
    .order('dueDate', { ascending: true })
    .limit(limit)

  if (error) throw error

  // Calculate overdue details
  const invoicesWithDetails = overdueInvoices?.map((invoice: any) => {
    const paidAmount = (invoice.payments || [])
      .filter((p: any) => p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    const remainingAmount = (invoice.totalAmount || 0) - paidAmount
    const daysOverdue = Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))

    return {
      ...invoice,
      paidAmount,
      remainingAmount,
      daysOverdue
    }
  }) || []

  const totalOverdueAmount = invoicesWithDetails.reduce((sum: number, inv: any) => sum + inv.remainingAmount, 0)
  const avgDaysOverdue = invoicesWithDetails.length > 0 ?
    invoicesWithDetails.reduce((sum: number, inv: any) => sum + inv.daysOverdue, 0) / invoicesWithDetails.length : 0

  return {
    overdueInvoices: invoicesWithDetails,
    summary: {
      totalOverdueInvoices: invoicesWithDetails.length,
      totalOverdueAmount,
      avgDaysOverdue: Math.round(avgDaysOverdue * 100) / 100,
      criticalOverdue: invoicesWithDetails.filter((inv: any) => inv.daysOverdue > 30).length
    }
  }
}

// Inventory Receipts Report
async function generateInventoryReceiptsReport(supabase: any, params: any) {
  const { startDate, endDate, limit } = params

  const { data: receipts, error } = await supabase
    .from('purchase_receipts')
    .select(`
      id,
      receiptNumber,
      receivedDate,
      status,
      purchaseOrder:purchase_orders(poNumber, supplier:suppliers(name)),
      items:purchase_receipt_items(
        receivedQuantity,
        qualityStatus,
        warehouse:warehouses(name),
        purchaseOrderItem:purchase_order_items(
          product:products(name, productCode, unit)
        )
      )
    `)
    .gte('receivedDate', startDate)
    .lte('receivedDate', endDate)
    .order('receivedDate', { ascending: false })
    .limit(limit)

  if (error) throw error

  // Calculate summary
  const totalReceipts = receipts?.length || 0
  const totalItemsReceived = receipts?.reduce((sum: number, receipt: any) =>
    sum + (receipt.items?.reduce((itemSum: number, item: any) => itemSum + item.receivedQuantity, 0) || 0), 0) || 0

  const qualityStatus = receipts?.reduce((acc: any, receipt: any) => {
    receipt.items?.forEach((item: any) => {
      acc[item.qualityStatus] = (acc[item.qualityStatus] || 0) + item.receivedQuantity
    })
    return acc
  }, {}) || {}

  return {
    receipts: receipts?.slice(0, 50) || [], // Limit display items
    summary: {
      totalReceipts,
      totalItemsReceived,
      qualityBreakdown: qualityStatus,
      avgItemsPerReceipt: totalReceipts > 0 ? Math.round((totalItemsReceived / totalReceipts) * 100) / 100 : 0
    }
  }
}

// Purchase Trends Report
async function generatePurchaseTrendsReport(supabase: any, params: any) {
  const { startDate, endDate, limit } = params

  const { data: trendData, error } = await supabase
    .from('purchase_orders')
    .select('orderDate, totalAmount, status')
    .gte('orderDate', startDate)
    .lte('orderDate', endDate)
    if (error) throw error

  // Group by month
  const monthlyTrends = trendData?.reduce((acc: any, po: any) => {
    const month = new Date(po.orderDate).toISOString().substr(0, 7) // YYYY-MM
    if (!acc[month]) {
      acc[month] = { month, orders: 0, value: 0, statuses: {} }
    }
    acc[month].orders += 1
    acc[month].value += po.totalAmount || 0
    acc[month].statuses[po.status] = (acc[month].statuses[po.status] || 0) + 1
    return acc
  }, {}) || {}

  const trendsArray = Object.values(monthlyTrends)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))

  return {
    monthlyTrends: trendsArray,
    summary: {
      totalPeriods: trendsArray.length,
      totalValue: trendsArray.reduce((sum: number, trend: any) => sum + trend.value, 0),
      totalOrders: trendsArray.reduce((sum: number, trend: any) => sum + trend.orders, 0),
      avgMonthlyValue: trendsArray.length > 0 ?
        trendsArray.reduce((sum: number, trend: any) => sum + trend.value, 0) / trendsArray.length : 0
    }
  }
}