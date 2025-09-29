import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/accounting/stats - Get accounting statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'accounting', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // For now, return mock data as we need to create accounting tables
    // TODO: Create journal_entries, chart_of_accounts tables in database

    const mockStats = {
      totalAssets: 2400000,
      totalLiabilities: 890000,
      ownersEquity: 1510000,
      journalEntries: 186,
      balanceSheet: {
        assets: {
          current: 259000,
          fixed: 2141000,
          total: 2400000
        },
        liabilities: {
          current: 340000,
          longTerm: 550000,
          total: 890000
        },
        equity: {
          ownersEquity: 1510000,
          total: 1510000
        }
      },
      incomeStatement: {
        revenue: 450000,
        cogs: 180000,
        grossProfit: 270000,
        operatingExpenses: 95000,
        administrativeExpenses: 38000,
        netIncome: 137000,
        profitMargin: 30.4
      }
    }

    return NextResponse.json({
      success: true,
      data: mockStats
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}