import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Start with simple queries and add complexity gradually
    const results = {}

    // Try to get clients data
    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, companyName, isActive, createdAt')
        .eq('deletedAt', null)

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
        .select('id, totalAmount, paidAmount, status, createdAt, invoiceNumber')
        .eq('deletedAt', null)

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
        .select('id, name, productCode, sellingPrice, reorderLevel, isActive')
        .eq('deletedAt', null)
        .eq('isActive', true)

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
        .select('id, status, totalAmount, createdAt')
        .eq('deletedAt', null)

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
    const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || Number(inv.totalAmount) || 0), 0)
    const previousRevenue = totalRevenue * 0.9 // Mock previous period for change calculation
    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    // Client calculations
    const activeClientsCount = clients.filter(c => c.isActive !== false).length
    const totalClientsCount = clients.length
    const previousClients = Math.max(1, activeClientsCount - 2) // Mock previous count
    const clientsChange = ((activeClientsCount - previousClients) / previousClients) * 100

    // Product calculations (simplified without stocks for now)
    const productsInStock = products.length
    const previousProducts = Math.max(1, productsInStock - 1)
    const productsChange = ((productsInStock - previousProducts) / previousProducts) * 100

    // Purchase order calculations
    const pendingOrdersCount = purchaseOrders.filter(po =>
      ['DRAFT', 'SENT', 'CONFIRMED', 'PENDING'].includes(po.status)
    ).length
    const previousOrders = Math.max(1, pendingOrdersCount + 1)
    const ordersChange = ((pendingOrdersCount - previousOrders) / previousOrders) * 100

    // Recent activity from available data
    const recentActivity = [
      ...invoices.slice(0, 3).map(inv => ({
        id: inv.id || 'unknown',
        type: 'invoice',
        description: `Invoice ${inv.invoiceNumber || 'N/A'}`,
        amount: Number(inv.totalAmount) || 0,
        timestamp: inv.createdAt || new Date().toISOString()
      })),
      ...clients.slice(0, 2).map(client => ({
        id: client.id || 'unknown',
        type: 'client',
        description: `New client: ${client.companyName}`,
        amount: 0,
        timestamp: client.createdAt || new Date().toISOString()
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

    // Top products by price (simplified)
    const topProducts = products
      .map(product => ({
        id: product.id,
        name: product.name,
        code: product.productCode,
        price: Number(product.sellingPrice) || 0,
        totalStock: 100, // Mock stock data
        warehouses: 1
      }))
      .sort((a, b) => b.price - a.price)
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
      topProducts,
      // Add debug info
      debug: {
        tablesFound: Object.keys(results),
        clientsCount: clients.length,
        invoicesCount: invoices.length,
        productsCount: products.length,
        purchaseOrdersCount: purchaseOrders.length
      }
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