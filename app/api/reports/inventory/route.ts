/**
 * Inventory Reports API
 *
 * Provides comprehensive inventory analytics including:
 * - Stock levels and availability
 * - Warehouse utilization and capacity
 * - Inventory valuation and turnover
 * - Reorder recommendations
 *
 * @author BlackGoldUnited ERP Team
 * @version 1.0
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - Inventory reports require read access
    const authResult = await authenticateAndAuthorize(request, 'inventory', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get current date for filtering
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Fetch Products with Stock Information
    const { data: products, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        category,
        unit_price,
        cost_price,
        current_stock,
        minimum_stock,
        maximum_stock,
        is_active,
        created_at,
        warehouses (
          id,
          name,
          location
        )
      `)

    if (productError) {
      console.error('Product fetch error:', productError)
      return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 })
    }

    // Fetch Stock Movements for turnover analysis
    const { data: stockMovements } = await supabase
      .from('stock_movements')
      .select('product_id, quantity, movement_type, created_at')
      .gte('created_at', previousMonth.toISOString())

    // Fetch Warehouse Information
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id, name, location, capacity, current_utilization')

    // Calculate Inventory Statistics
    const totalProducts = products?.length || 0
    const activeProducts = products?.filter(product => product.is_active).length || 0

    // Low stock analysis
    const lowStockItems = products?.filter(product =>
      product.current_stock <= product.minimum_stock
    ).length || 0

    // Zero stock items
    const outOfStockItems = products?.filter(product =>
      product.current_stock === 0
    ).length || 0

    // Calculate total inventory value
    const totalValue = products?.reduce((sum, product) => {
      const stock = parseFloat(product.current_stock?.toString() || '0')
      const cost = parseFloat(product.cost_price?.toString() || '0')
      return sum + (stock * cost)
    }, 0) || 0

    // Calculate retail value
    const retailValue = products?.reduce((sum, product) => {
      const stock = parseFloat(product.current_stock?.toString() || '0')
      const price = parseFloat(product.unit_price?.toString() || '0')
      return sum + (stock * price)
    }, 0) || 0

    // Calculate turnover rate (simplified - would need more complex calculation with historical data)
    const outgoingMovements = stockMovements?.filter(movement =>
      movement.movement_type === 'OUT' || movement.movement_type === 'SALE'
    ) || []

    const totalOutgoing = outgoingMovements.reduce((sum, movement) =>
      sum + Math.abs(parseFloat(movement.quantity?.toString() || '0')), 0)

    const averageStock = products?.reduce((sum, product) =>
      sum + parseFloat(product.current_stock?.toString() || '0'), 0) / (totalProducts || 1)

    const turnoverRate = averageStock > 0 ? totalOutgoing / averageStock : 0

    // Category breakdown
    const categoryBreakdown = products?.reduce((acc, product) => {
      const category = product.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = { count: 0, value: 0 }
      }
      acc[category].count++
      acc[category].value += parseFloat(product.current_stock?.toString() || '0') *
                             parseFloat(product.cost_price?.toString() || '0')
      return acc
    }, {} as Record<string, { count: number; value: number }>) || {}

    // Warehouse utilization
    const warehouseUtilization = warehouses?.reduce((acc, warehouse) => {
      const utilization = parseFloat(warehouse.current_utilization?.toString() || '0')
      acc.total += utilization
      acc.count++
      return acc
    }, { total: 0, count: 0 })

    const averageUtilization = warehouseUtilization && warehouseUtilization.count > 0 ?
      warehouseUtilization.total / warehouseUtilization.count : 0

    // Fast/slow moving analysis
    const productMovements = new Map<string, number>()
    stockMovements?.forEach(movement => {
      const productId = movement.product_id
      const quantity = Math.abs(parseFloat(movement.quantity?.toString() || '0'))
      if (movement.movement_type === 'OUT' || movement.movement_type === 'SALE') {
        productMovements.set(productId, (productMovements.get(productId) || 0) + quantity)
      }
    })

    const sortedByMovement = Array.from(productMovements.entries())
      .sort(([,a], [,b]) => b - a)

    const fastMovingCount = Math.ceil(sortedByMovement.length * 0.2) // Top 20%
    const slowMovingCount = Math.ceil(sortedByMovement.length * 0.2) // Bottom 20%

    // Reorder recommendations
    const reorderRecommendations = products?.filter(product =>
      product.current_stock <= product.minimum_stock && product.is_active
    ).map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      currentStock: product.current_stock,
      minimumStock: product.minimum_stock,
      recommendedOrder: product.maximum_stock - product.current_stock
    })) || []

    // ABC Analysis (simplified)
    const sortedByValue = products?.map(product => ({
      ...product,
      totalValue: parseFloat(product.current_stock?.toString() || '0') *
                  parseFloat(product.cost_price?.toString() || '0')
    })).sort((a, b) => b.totalValue - a.totalValue) || []

    const totalInventoryValue = sortedByValue.reduce((sum, p) => sum + p.totalValue, 0)
    let runningValue = 0
    const abcAnalysis = { A: 0, B: 0, C: 0 }

    sortedByValue.forEach(product => {
      runningValue += product.totalValue
      const percentage = (runningValue / totalInventoryValue) * 100

      if (percentage <= 80) abcAnalysis.A++
      else if (percentage <= 95) abcAnalysis.B++
      else abcAnalysis.C++
    })

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          activeProducts,
          lowStockItems,
          outOfStockItems,
          totalValue: parseFloat(totalValue.toFixed(0)),
          retailValue: parseFloat(retailValue.toFixed(0)),
          turnoverRate: parseFloat(turnoverRate.toFixed(1)),
          warehouseUtilization: parseFloat(averageUtilization.toFixed(1))
        },
        analysis: {
          categoryBreakdown,
          abcAnalysis,
          fastMovingCount,
          slowMovingCount,
          reorderCount: reorderRecommendations.length
        },
        recommendations: {
          reorderItems: reorderRecommendations.slice(0, 10), // Top 10 items needing reorder
          lowStockAlert: lowStockItems,
          outOfStockAlert: outOfStockItems
        },
        period: {
          month: currentMonth.toISOString().split('T')[0],
          generated_at: now.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Inventory reports API error:', error)
    return NextResponse.json({
      error: 'Failed to generate inventory reports'
    }, { status: 500 })
  }
}