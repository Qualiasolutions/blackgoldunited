import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize using the same pattern as other APIs
    const authResult = await authenticateAndAuthorize(request, 'reports', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Start with simple queries and add complexity gradually
    const results: any = {}

    // Try to get clients data
    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, company_name, is_active, created_at')
        .is('deleted_at', null)

      if (!clientsError) {
        results.clients = clients || []
      }
    } catch (err) {
      console.log('Clients table not accessible:', err)
      results.clients = []
    }

    // Try to get invoices data
    try {
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, total_amount, paid_amount, status, created_at, invoice_number')
        .is('deleted_at', null)

      if (!invoicesError) {
        results.invoices = invoices || []
      }
    } catch (err) {
      console.log('Invoices table not accessible:', err)
      results.invoices = []
    }

    // Try to get products data
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, product_code, selling_price, reorder_level, is_active')
        .is('deleted_at', null)
        .eq('is_active', true)

      if (!productsError) {
        results.products = products || []
      }
    } catch (err) {
      console.log('Products table not accessible:', err)
      results.products = []
    }

    // Try to get purchase orders data
    try {
      const { data: purchaseOrders, error: ordersError } = await supabase
        .from('purchase_orders')
        .select('id, status, total_amount, created_at')
        .is('deleted_at', null)

      if (!ordersError) {
        results.purchaseOrders = purchaseOrders || []
      }
    } catch (err) {
      console.log('Purchase orders table not accessible:', err)
      results.purchaseOrders = []
    }

    // Calculate statistics from available data
    const { clients = [], invoices = [], products = [], purchaseOrders = [] } = results

    // Revenue calculations
    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.paid_amount) || Number(inv.total_amount) || 0), 0)

    // Calculate real historical data for last month (30 days ago)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const lastMonthRevenue = invoices
      .filter((inv: any) => new Date(inv.created_at) <= thirtyDaysAgo)
      .reduce((sum: number, inv: any) => sum + (Number(inv.paid_amount) || Number(inv.total_amount) || 0), 0)

    const revenueChange = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    // Client calculations with real historical data
    const activeClientsCount = clients.filter((c: any) => c.is_active !== false).length
    const lastMonthClients = clients
      .filter((c: any) => new Date(c.created_at) <= thirtyDaysAgo && c.is_active !== false).length
    const currentMonthNewClients = activeClientsCount - lastMonthClients
    const clientsChange = lastMonthClients > 0 ? (currentMonthNewClients / lastMonthClients) * 100 : 0

    // Product calculations with real data
    const productsInStock = products.length
    const lastMonthProducts = products
      .filter((p: any) => new Date(p.created_at || Date.now()) <= thirtyDaysAgo).length
    const newProducts = productsInStock - lastMonthProducts
    const productsChange = lastMonthProducts > 0 ? (newProducts / lastMonthProducts) * 100 : 0

    // Purchase order calculations with real data
    const pendingOrdersCount = purchaseOrders.filter((po: any) =>
      ['DRAFT', 'SENT', 'CONFIRMED', 'PENDING'].includes(po.status)
    ).length
    const lastMonthOrders = purchaseOrders
      .filter((po: any) => new Date(po.created_at) <= thirtyDaysAgo &&
        ['DRAFT', 'SENT', 'CONFIRMED', 'PENDING'].includes(po.status)).length
    const ordersChange = lastMonthOrders > 0 ? ((pendingOrdersCount - lastMonthOrders) / lastMonthOrders) * 100 : 0

    // Recent activity from available data
    const recentActivity = [
      ...invoices.slice(0, 3).map((inv: any) => ({
        id: inv.id || 'unknown',
        type: 'invoice',
        description: `Invoice ${inv.invoice_number || 'N/A'}`,
        amount: Number(inv.total_amount) || 0,
        timestamp: inv.created_at || new Date().toISOString()
      })),
      ...clients.slice(0, 2).map((client: any) => ({
        id: client.id || 'unknown',
        type: 'client',
        description: `New client: ${client.company_name}`,
        amount: 0,
        timestamp: client.created_at || new Date().toISOString()
      }))
    ].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

    // Try to get stock data for products
    let stockData: any[] = []
    try {
      const { data: stocks, error: stocksError } = await supabase
        .from('stocks')
        .select('product_id, quantity, warehouse_id')

      if (!stocksError) {
        stockData = stocks || []
      }
    } catch (err) {
      console.log('Stocks table not accessible:', err)
    }

    // Top products by price with real stock data
    const topProducts = products
      .map((product: any) => {
        const productStocks = stockData.filter((stock: any) => stock.product_id === product.id)
        const totalStock = productStocks.reduce((sum: number, stock: any) => sum + (Number(stock.quantity) || 0), 0)
        const warehouses = new Set(productStocks.map((stock: any) => stock.warehouse_id)).size

        return {
          id: product.id,
          name: product.name,
          code: product.product_code,
          price: Number(product.selling_price) || 0,
          totalStock,
          warehouses: warehouses || 0
        }
      })
      .sort((a: any, b: any) => b.price - a.price)
      .slice(0, 5)

    const stats = {
      totalRevenue: {
        value: Math.round(totalRevenue),
        change: { value: Math.round(revenueChange * 10) / 10, isPositive: revenueChange >= 0 }
      },
      activeClients: {
        value: activeClientsCount,
        change: { value: Math.round(clientsChange * 10) / 10, isPositive: clientsChange >= 0 }
      },
      productsInStock: {
        value: productsInStock,
        change: { value: Math.round(productsChange * 10) / 10, isPositive: productsChange >= 0 }
      },
      pendingOrders: {
        value: pendingOrdersCount,
        change: { value: Math.round(ordersChange * 10) / 10, isPositive: ordersChange >= 0 }
      },
      recentActivity,
      topProducts
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}