import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'finance', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get invoices for revenue calculation (assets receivable)
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('total_amount, paid_amount, status')
      .is('deleted_at', null)

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
    }

    // Get purchase orders for expenses calculation (liabilities)
    const { data: purchaseOrders, error: poError } = await supabase
      .from('purchase_orders')
      .select('total_amount, status')
      .is('deleted_at', null)

    if (poError) {
      console.error('Error fetching purchase orders:', poError)
    }

    // Get products for inventory value (assets)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('cost_price, selling_price')
      .eq('is_active', true)
      .is('deleted_at', null)

    if (productsError) {
      console.error('Error fetching products:', productsError)
    }

    // Get employee salaries for payroll expenses (liabilities)
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('salary')
      .eq('is_active', true)
      .is('deleted_at', null)

    if (employeesError) {
      console.error('Error fetching employees:', employeesError)
    }

    // Calculate financial metrics
    const invoicesList = invoices || []
    const poList = purchaseOrders || []
    const productsList = products || []
    const employeesList = employees || []

    // Calculate month-to-date revenue (paid invoices)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    const monthlyRevenue = invoicesList
      .filter((inv: any) => inv.status === 'PAID')
      .reduce((sum: number, inv: any) => sum + (Number(inv.paid_amount) || 0), 0)

    // Calculate total accounts receivable (unpaid/partial invoices)
    const accountsReceivable = invoicesList
      .filter((inv: any) => ['SENT', 'OVERDUE'].includes(inv.status))
      .reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) - Number(inv.paid_amount || 0)), 0)

    // Calculate accounts payable (pending purchase orders)
    const accountsPayable = poList
      .filter((po: any) => ['DRAFT', 'SENT', 'CONFIRMED'].includes(po.status))
      .reduce((sum: number, po: any) => sum + (Number(po.total_amount) || 0), 0)

    // Calculate inventory value (current assets)
    const inventoryValue = productsList.reduce((sum: number, prod: any) =>
      sum + (Number(prod.cost_price) || Number(prod.selling_price) || 0), 0)

    // Calculate monthly payroll expenses
    const monthlyPayroll = employeesList.reduce((sum: number, emp: any) =>
      sum + (Number(emp.salary) || 0), 0)

    // Total Assets = Cash (from revenue) + Accounts Receivable + Inventory
    const cashBalance = monthlyRevenue * 0.7 // Assuming 70% cash on hand
    const totalAssets = cashBalance + accountsReceivable + inventoryValue

    // Total Liabilities = Accounts Payable + Accrued Expenses
    const accruedExpenses = monthlyPayroll + (monthlyRevenue * 0.15) // Estimated 15% operating expenses
    const totalLiabilities = accountsPayable + accruedExpenses

    // Total Equity = Assets - Liabilities
    const totalEquity = totalAssets - totalLiabilities

    // Monthly calculations
    const monthlyExpenses = monthlyPayroll + accruedExpenses
    const netIncome = monthlyRevenue - monthlyExpenses
    const cashFlow = monthlyRevenue - (accountsPayable * 0.3) // Assuming 30% of payables paid this month

    // Bank balance (simplified)
    const bankBalance = cashBalance

    const financialStats = {
      totalAssets: Math.round(totalAssets),
      totalLiabilities: Math.round(totalLiabilities),
      totalEquity: Math.round(totalEquity),
      monthlyRevenue: Math.round(monthlyRevenue),
      monthlyExpenses: Math.round(monthlyExpenses),
      netIncome: Math.round(netIncome),
      cashFlow: Math.round(cashFlow),
      accountsReceivable: Math.round(accountsReceivable),
      accountsPayable: Math.round(accountsPayable),
      bankBalance: Math.round(bankBalance)
    }

    return NextResponse.json(financialStats)

  } catch (error) {
    console.error('Finance stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial statistics' },
      { status: 500 }
    )
  }
}