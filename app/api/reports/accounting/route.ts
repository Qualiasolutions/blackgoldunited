import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Cache accounting reports for 10 minutes (600 seconds)
// Reports involve heavy computation and data aggregation
export const revalidate = 600

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'reports', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get invoices for revenue
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, paid_amount, status, created_at')
      // Get purchase orders for expenses
    const { data: purchaseOrders } = await supabase
      .from('purchase_orders')
      .select('total_amount, status, created_at')
      // Get payroll data
    const { data: payRuns } = await supabase
      .from('pay_runs')
      .select('total_net, pay_date, created_at')
      .in('status', ['APPROVED', 'PAID'])

    // Get products for inventory
    const { data: products } = await supabase
      .from('products')
      .select('cost_price, selling_price')
      .eq('is_active', true)
      const invoicesList = invoices || []
    const poList = purchaseOrders || []
    const payRunsList = payRuns || []
    const productsList = products || []

    // Calculate Profit & Loss Statement
    const revenue = invoicesList
      .filter((inv: any) => inv.status === 'PAID')
      .reduce((sum: number, inv: any) => sum + (Number(inv.paid_amount) || 0), 0)

    const costOfGoodsSold = poList
      .filter((po: any) => ['DELIVERED', 'INVOICED'].includes(po.status))
      .reduce((sum: number, po: any) => sum + (Number(po.total_amount) || 0), 0)

    const payrollExpenses = payRunsList.reduce((sum: number, pr: any) =>
      sum + (Number(pr.total_net) || 0), 0)

    const operatingExpenses = revenue * 0.15 // Estimated 15% operating expenses
    const totalExpenses = costOfGoodsSold + payrollExpenses + operatingExpenses

    const grossProfit = revenue - costOfGoodsSold
    const netProfit = revenue - totalExpenses

    // Calculate Balance Sheet
    const cashBalance = revenue * 0.7 // Assuming 70% cash on hand

    const accountsReceivable = invoicesList
      .filter((inv: any) => ['SENT', 'OVERDUE'].includes(inv.status))
      .reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) - Number(inv.paid_amount || 0)), 0)

    const inventoryValue = productsList.reduce((sum: number, prod: any) =>
      sum + (Number(prod.cost_price) || Number(prod.selling_price) || 0), 0)

    const totalAssets = cashBalance + accountsReceivable + inventoryValue

    const accountsPayable = poList
      .filter((po: any) => ['DRAFT', 'SENT', 'CONFIRMED'].includes(po.status))
      .reduce((sum: number, po: any) => sum + (Number(po.total_amount) || 0), 0)

    const accruedExpenses = payrollExpenses + operatingExpenses
    const totalLiabilities = accountsPayable + accruedExpenses

    const equity = totalAssets - totalLiabilities

    // Cash Flow Statement
    const operatingCashFlow = revenue - operatingExpenses
    const investingCashFlow = -inventoryValue * 0.1 // Estimated 10% investment
    const financingCashFlow = 0 // No financing activities for now

    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow

    // Monthly P&L Trend (last 12 months)
    const monthlyPL = new Map<string, { revenue: number, expenses: number }>()
    const last12Months = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      last12Months.push(monthKey)
      monthlyPL.set(monthKey, { revenue: 0, expenses: 0 })
    }

    invoicesList.forEach((inv: any) => {
      if (inv.status === 'PAID') {
        const invDate = new Date(inv.created_at)
        const monthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`
        if (monthlyPL.has(monthKey)) {
          const data = monthlyPL.get(monthKey)!
          data.revenue += Number(inv.paid_amount) || 0
          monthlyPL.set(monthKey, data)
        }
      }
    })

    poList.forEach((po: any) => {
      if (['DELIVERED', 'INVOICED'].includes(po.status)) {
        const poDate = new Date(po.created_at)
        const monthKey = `${poDate.getFullYear()}-${String(poDate.getMonth() + 1).padStart(2, '0')}`
        if (monthlyPL.has(monthKey)) {
          const data = monthlyPL.get(monthKey)!
          data.expenses += Number(po.total_amount) || 0
          monthlyPL.set(monthKey, data)
        }
      }
    })

    const plTrend = last12Months.map(month => {
      const data = monthlyPL.get(month)!
      return {
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses
      }
    })

    const accountingReport = {
      profitAndLoss: {
        revenue: Math.round(revenue),
        costOfGoodsSold: Math.round(costOfGoodsSold),
        grossProfit: Math.round(grossProfit),
        operatingExpenses: Math.round(operatingExpenses),
        payrollExpenses: Math.round(payrollExpenses),
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        profitMargin: revenue > 0 ? Math.round((netProfit / revenue) * 100 * 10) / 10 : 0
      },
      balanceSheet: {
        assets: {
          cash: Math.round(cashBalance),
          accountsReceivable: Math.round(accountsReceivable),
          inventory: Math.round(inventoryValue),
          total: Math.round(totalAssets)
        },
        liabilities: {
          accountsPayable: Math.round(accountsPayable),
          accruedExpenses: Math.round(accruedExpenses),
          total: Math.round(totalLiabilities)
        },
        equity: Math.round(equity)
      },
      cashFlow: {
        operating: Math.round(operatingCashFlow),
        investing: Math.round(investingCashFlow),
        financing: Math.round(financingCashFlow),
        netCashFlow: Math.round(netCashFlow)
      },
      plTrend
    }

    return NextResponse.json(accountingReport)

  } catch (error) {
    console.error('Accounting report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate accounting report' },
      { status: 500 }
    )
  }
}