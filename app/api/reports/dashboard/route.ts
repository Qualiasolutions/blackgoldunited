/**
 * Reports Dashboard API - Comprehensive Analytics
 *
 * This endpoint provides dashboard-level analytics across all modules
 * for the reports section. It aggregates data from multiple tables
 * to provide executive-level insights.
 *
 * @author BlackGoldUnited ERP Team
 * @version 1.0
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - Reports require at least READ access
    const authResult = await authenticateAndAuthorize(request, 'reports', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get current date for filtering
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentYear = new Date(now.getFullYear(), 0, 1)

    // Fetch Sales Analytics
    const { data: salesData } = await supabase
      .from('invoices')
      .select('total_amount, issue_date, status, payment_status')
      .gte('issue_date', currentMonth.toISOString().split('T')[0])

    // Fetch Purchase Analytics
    const { data: purchaseData } = await supabase
      .from('purchase_orders')
      .select('total_amount, order_date, status')
      .gte('order_date', currentMonth.toISOString().split('T')[0])

    // Fetch Client Analytics
    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, created_at, is_active')

    // Fetch Employee Analytics
    const { data: employeesData } = await supabase
      .from('employees')
      .select('id, hire_date, is_active, salary')

    // Fetch Inventory Analytics
    const { data: inventoryData } = await supabase
      .from('products')
      .select('id, cost_price, selling_price, is_active')

    // Process Sales Analytics
    const salesAnalytics = {
      totalRevenue: salesData?.reduce((sum, invoice) => sum + (parseFloat(invoice.total_amount?.toString() || '0')), 0) || 0,
      invoiceCount: salesData?.length || 0,
      paidInvoices: salesData?.filter(inv => inv.payment_status === 'COMPLETED').length || 0,
      averageInvoiceValue: salesData?.length ?
        (salesData.reduce((sum, inv) => sum + parseFloat(inv.total_amount?.toString() || '0'), 0) / salesData.length) : 0
    }

    // Process Purchase Analytics
    const purchaseAnalytics = {
      totalSpend: purchaseData?.reduce((sum, po) => sum + (parseFloat(po.total_amount?.toString() || '0')), 0) || 0,
      orderCount: purchaseData?.length || 0,
      confirmedOrders: purchaseData?.filter(po => po.status === 'CONFIRMED').length || 0,
      averageOrderValue: purchaseData?.length ?
        (purchaseData.reduce((sum, po) => sum + parseFloat(po.total_amount?.toString() || '0'), 0) / purchaseData.length) : 0
    }

    // Process Client Analytics
    const clientAnalytics = {
      totalClients: clientsData?.length || 0,
      activeClients: clientsData?.filter(client => client.is_active).length || 0,
      newClientsThisMonth: clientsData?.filter(client =>
        new Date(client.created_at) >= currentMonth
      ).length || 0
    }

    // Process Employee Analytics
    const employeeAnalytics = {
      totalEmployees: employeesData?.length || 0,
      activeEmployees: employeesData?.filter(emp => emp.is_active).length || 0,
      newHiresThisMonth: employeesData?.filter(emp =>
        new Date(emp.hire_date) >= currentMonth
      ).length || 0,
      averageSalary: employeesData?.length ?
        (employeesData.reduce((sum, emp) => sum + (parseFloat(emp.salary?.toString() || '0')), 0) / employeesData.length) : 0
    }

    // Process Inventory Analytics
    const inventoryAnalytics = {
      totalProducts: inventoryData?.length || 0,
      activeProducts: inventoryData?.filter(product => product.is_active).length || 0,
      totalInventoryValue: inventoryData?.reduce((sum, product) =>
        sum + (parseFloat(product.cost_price?.toString() || '0')), 0) || 0,
      averageMargin: inventoryData?.length ?
        inventoryData.reduce((sum, product) => {
          const cost = parseFloat(product.cost_price?.toString() || '0')
          const price = parseFloat(product.selling_price?.toString() || '0')
          const margin = cost > 0 ? ((price - cost) / cost) * 100 : 0
          return sum + margin
        }, 0) / inventoryData.length : 0
    }

    // Calculate growth rates (mock data for now - in real implementation, compare with previous period)
    const growthRates = {
      salesGrowth: 12.5,
      purchaseGrowth: -5.2,
      clientGrowth: 8.3,
      employeeGrowth: 3.1
    }

    // Return comprehensive dashboard data
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          sales: salesAnalytics,
          purchases: purchaseAnalytics,
          clients: clientAnalytics,
          employees: employeeAnalytics,
          inventory: inventoryAnalytics,
          growth: growthRates
        },
        period: {
          month: currentMonth.toISOString().split('T')[0],
          year: currentYear.toISOString().split('T')[0],
          generated_at: now.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Reports dashboard API error:', error)
    return NextResponse.json({
      error: 'Failed to generate dashboard analytics'
    }, { status: 500 })
  }
}