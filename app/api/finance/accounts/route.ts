import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// For now, we'll create a simple mock API since chart of accounts table is not yet in the database
// In a real implementation, this would connect to an accounts table

// GET /api/finance/accounts - Get chart of accounts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock chart of accounts data - in real implementation this would come from database
    const accounts = [
      {
        id: '1',
        accountNumber: '1000',
        accountName: 'Cash',
        accountType: 'ASSET',
        parentAccount: null,
        isActive: true,
        balance: 125000,
        description: 'Cash on hand and in bank accounts'
      },
      {
        id: '2',
        accountNumber: '1200',
        accountName: 'Accounts Receivable',
        accountType: 'ASSET',
        parentAccount: null,
        isActive: true,
        balance: 45000,
        description: 'Money owed by customers'
      },
      {
        id: '3',
        accountNumber: '1500',
        accountName: 'Inventory',
        accountType: 'ASSET',
        parentAccount: null,
        isActive: true,
        balance: 89000,
        description: 'Cost of goods held for sale'
      },
      {
        id: '4',
        accountNumber: '2000',
        accountName: 'Accounts Payable',
        accountType: 'LIABILITY',
        parentAccount: null,
        isActive: true,
        balance: 23000,
        description: 'Money owed to suppliers'
      },
      {
        id: '5',
        accountNumber: '3000',
        accountName: 'Owner\'s Equity',
        accountType: 'EQUITY',
        parentAccount: null,
        isActive: true,
        balance: 236000,
        description: 'Owner\'s investment in the business'
      },
      {
        id: '6',
        accountNumber: '4000',
        accountName: 'Sales Revenue',
        accountType: 'REVENUE',
        parentAccount: null,
        isActive: true,
        balance: 450000,
        description: 'Income from sales of goods and services'
      },
      {
        id: '7',
        accountNumber: '5000',
        accountName: 'Cost of Goods Sold',
        accountType: 'EXPENSE',
        parentAccount: null,
        isActive: true,
        balance: 180000,
        description: 'Direct costs of producing goods sold'
      },
      {
        id: '8',
        accountNumber: '6000',
        accountName: 'Operating Expenses',
        accountType: 'EXPENSE',
        parentAccount: null,
        isActive: true,
        balance: 95000,
        description: 'General business operating expenses'
      }
    ]

    // Extract query parameters for filtering
    const { searchParams } = new URL(request.url)
    const accountType = searchParams.get('accountType')
    const search = searchParams.get('search')

    let filteredAccounts = accounts

    // Filter by account type if specified
    if (accountType && accountType !== 'all') {
      filteredAccounts = filteredAccounts.filter(account =>
        account.accountType === accountType.toUpperCase()
      )
    }

    // Filter by search term if specified
    if (search) {
      const searchTerm = search.toLowerCase()
      filteredAccounts = filteredAccounts.filter(account =>
        account.accountName.toLowerCase().includes(searchTerm) ||
        account.accountNumber.includes(searchTerm) ||
        account.description.toLowerCase().includes(searchTerm)
      )
    }

    return NextResponse.json({
      accounts: filteredAccounts,
      summary: {
        totalAssets: accounts.filter(a => a.accountType === 'ASSET').reduce((sum, a) => sum + a.balance, 0),
        totalLiabilities: accounts.filter(a => a.accountType === 'LIABILITY').reduce((sum, a) => sum + a.balance, 0),
        totalEquity: accounts.filter(a => a.accountType === 'EQUITY').reduce((sum, a) => sum + a.balance, 0),
        totalRevenue: accounts.filter(a => a.accountType === 'REVENUE').reduce((sum, a) => sum + a.balance, 0),
        totalExpenses: accounts.filter(a => a.accountType === 'EXPENSE').reduce((sum, a) => sum + a.balance, 0)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/finance/accounts - Create new account
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const { accountNumber, accountName, accountType } = body
    if (!accountNumber || !accountName || !accountType) {
      return NextResponse.json({
        error: 'Account number, name, and type are required'
      }, { status: 400 })
    }

    // Mock response - in real implementation this would insert into database
    const newAccount = {
      id: Math.random().toString(36).substr(2, 9),
      accountNumber,
      accountName,
      accountType: accountType.toUpperCase(),
      parentAccount: body.parentAccount || null,
      isActive: body.isActive !== false,
      balance: 0,
      description: body.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({ account: newAccount }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}