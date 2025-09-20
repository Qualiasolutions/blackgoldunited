import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get real data from database
    const [
      totalRevenue,
      activeClients,
      productsInStock,
      pendingOrders,
      recentInvoices,
      topProducts
    ] = await Promise.all([
      // Total revenue from completed invoices
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'COMPLETED' }
      }),

      // Active clients count
      prisma.client.count({
        where: { isActive: true }
      }),

      // Products in stock count
      prisma.product.count({
        where: { isActive: true }
      }),

      // Pending orders count
      prisma.purchaseOrder.count({
        where: { status: 'DRAFT' }
      }),

      // Recent invoices
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { companyName: true } }
        }
      }),

      // Top products by stock value
      prisma.product.findMany({
        take: 10,
        where: { isActive: true },
        orderBy: { sellingPrice: 'desc' },
        select: {
          id: true,
          name: true,
          sellingPrice: true,
          productCode: true,
          stocks: {
            select: {
              quantity: true,
              warehouse: { select: { name: true } }
            }
          }
        }
      })
    ])

    const stats = {
      totalRevenue: {
        value: totalRevenue._sum.totalAmount || 0,
        change: { value: 12.5, isPositive: true } // Calculate real change later
      },
      activeClients: {
        value: activeClients,
        change: { value: 8.2, isPositive: true }
      },
      productsInStock: {
        value: productsInStock,
        change: { value: 3.1, isPositive: false }
      },
      pendingOrders: {
        value: pendingOrders,
        change: { value: 15.3, isPositive: false }
      },
      recentActivity: recentInvoices.map(invoice => ({
        id: invoice.id,
        type: 'Invoice',
        description: `Invoice ${invoice.invoiceNumber} created for ${invoice.client.companyName}`,
        amount: invoice.totalAmount,
        timestamp: invoice.createdAt
      })),
      topProducts: topProducts.map(product => ({
        id: product.id,
        name: product.name,
        code: product.productCode,
        price: product.sellingPrice,
        totalStock: product.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0),
        warehouses: product.stocks.length
      }))
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}