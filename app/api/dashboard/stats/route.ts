import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Return mock data for dashboard stats
    // TODO: Replace with real Supabase queries once the schema is migrated
    const stats = {
      totalRevenue: { _sum: { totalAmount: 125000 } },
      activeClients: 45,
      productsInStock: 234,
      pendingOrders: 12,
      recentInvoices: [
        {
          id: '1',
          invoiceNumber: 'INV-2024-001',
          totalAmount: 5000,
          paymentStatus: 'COMPLETED',
          createdAt: new Date().toISOString(),
          client: { companyName: 'Sample Client 1' }
        },
        {
          id: '2',
          invoiceNumber: 'INV-2024-002',
          totalAmount: 3500,
          paymentStatus: 'PENDING',
          createdAt: new Date().toISOString(),
          client: { companyName: 'Sample Client 2' }
        }
      ],
      topProducts: [
        {
          id: '1',
          name: 'Sample Product 1',
          sellingPrice: 150,
          stockQuantity: 50,
          category: { name: 'Electronics' }
        },
        {
          id: '2',
          name: 'Sample Product 2',
          sellingPrice: 99,
          stockQuantity: 25,
          category: { name: 'Office Supplies' }
        }
      ]
    }

    const dashboardData = {
      totalRevenue: stats.totalRevenue._sum.totalAmount || 0,
      activeClients: stats.activeClients,
      productsInStock: stats.productsInStock,
      pendingOrders: stats.pendingOrders,
      recentInvoices: stats.recentInvoices.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client.companyName,
        amount: invoice.totalAmount,
        status: invoice.paymentStatus,
        date: invoice.createdAt
      })),
      topProducts: stats.topProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        value: product.sellingPrice * product.stockQuantity,
        stock: product.stockQuantity,
        category: product.category?.name || 'Uncategorized'
      }))
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}