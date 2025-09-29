import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/accounting/chart-of-accounts - Get chart of accounts
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'accounting', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // For now, return standard chart of accounts
    // TODO: Create chart_of_accounts table in database

    const chartOfAccounts = [
      { code: '1000', name: 'Cash and Cash Equivalents', type: 'ASSET', balance: 125000 },
      { code: '1200', name: 'Accounts Receivable', type: 'ASSET', balance: 45000 },
      { code: '1500', name: 'Inventory', type: 'ASSET', balance: 89000 },
      { code: '1800', name: 'Property, Plant & Equipment', type: 'ASSET', balance: 2141000 },
      { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', balance: 23000 },
      { code: '2100', name: 'Short-term Loans', type: 'LIABILITY', balance: 317000 },
      { code: '2500', name: 'Long-term Debt', type: 'LIABILITY', balance: 550000 },
      { code: '3000', name: 'Owner\'s Equity', type: 'EQUITY', balance: 1510000 },
      { code: '4000', name: 'Sales Revenue', type: 'REVENUE', balance: 450000 },
      { code: '4100', name: 'Service Revenue', type: 'REVENUE', balance: 85000 },
      { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', balance: 180000 },
      { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', balance: 95000 },
      { code: '6100', name: 'Administrative Expenses', type: 'EXPENSE', balance: 38000 },
      { code: '6200', name: 'Marketing Expenses', type: 'EXPENSE', balance: 22000 }
    ]

    return NextResponse.json({
      success: true,
      data: chartOfAccounts
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}