import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Bank account validation schema
const bankAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required').max(100),
  accountNumber: z.string().min(1, 'Account number is required').max(50),
  bankName: z.string().min(1, 'Bank name is required').max(100),
  branchName: z.string().min(1, 'Branch name is required').max(100),
  accountType: z.enum(['CHECKING', 'SAVINGS', 'BUSINESS', 'MONEY_MARKET', 'OTHER']),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  openingBalance: z.number().default(0),
  currentBalance: z.number().default(0),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  iban: z.string().optional()
})

// GET /api/finance/bank-accounts - List all bank accounts
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'finance', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const isActive = searchParams.get('isActive')
    const accountType = searchParams.get('accountType')
    const currency = searchParams.get('currency')

    // Build query
    let queryBuilder = supabase
      .from('bank_accounts')
      .select(`
        *,
        transactions_count:bank_transactions(count),
        last_transaction:bank_transactions(
          id,
          transaction_date,
          amount,
          transaction_type
        )
      `)

    // Apply filters
    if (isActive !== null) {
      queryBuilder = queryBuilder.eq('is_active', isActive === 'true')
    }

    if (accountType) {
      queryBuilder = queryBuilder.eq('account_type', accountType)
    }

    if (currency) {
      queryBuilder = queryBuilder.eq('currency', currency)
    }

    const { data: bankAccounts, error } = await queryBuilder
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 })
    }

    // Calculate total balances by currency
    const balanceSummary = bankAccounts?.reduce((acc: any, account: any) => {
      if (!acc[account.currency]) {
        acc[account.currency] = { total: 0, active_accounts: 0 }
      }
      if (account.is_active) {
        acc[account.currency].total += account.current_balance
        acc[account.currency].active_accounts += 1
      }
      return acc
    }, {})

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_BANK_ACCOUNTS',
      entity_type: 'bank_account',
      details: { account_type: accountType, currency, is_active: isActive }
    })

    return NextResponse.json({
      success: true,
      data: bankAccounts || [],
      summary: balanceSummary
    })

  } catch (error) {
    console.error('Bank accounts fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/finance/bank-accounts - Create new bank account
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'finance', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = bankAccountSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const validatedData = validation.data
    const supabase = await createClient()

    // Check if account number already exists for the same bank
    const { data: existingAccount } = await supabase
      .from('bank_accounts')
      .select('account_number, bank_name')
      .eq('account_number', validatedData.accountNumber)
      .eq('bank_name', validatedData.bankName)
      .single()

    if (existingAccount) {
      return NextResponse.json({
        error: 'Account number already exists for this bank'
      }, { status: 400 })
    }

    // Set current balance to opening balance for new accounts
    validatedData.currentBalance = validatedData.openingBalance

    // Create bank account
    const { data: bankAccount, error: createError } = await supabase
      .from('bank_accounts')
      .insert({
        account_name: validatedData.accountName,
        account_number: validatedData.accountNumber,
        bank_name: validatedData.bankName,
        branch_name: validatedData.branchName,
        account_type: validatedData.accountType,
        currency: validatedData.currency,
        opening_balance: validatedData.openingBalance,
        current_balance: validatedData.currentBalance,
        is_active: validatedData.isActive,
        description: validatedData.description || null,
        routing_number: validatedData.routingNumber || null,
        swift_code: validatedData.swiftCode || null,
        iban: validatedData.iban || null,
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Bank account creation error:', createError)
      return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 })
    }

    // If opening balance is not zero, create an opening balance transaction
    if (validatedData.openingBalance !== 0) {
      await supabase.from('bank_transactions').insert({
        bank_account_id: bankAccount.id,
        transaction_type: validatedData.openingBalance > 0 ? 'DEPOSIT' : 'WITHDRAWAL',
        amount: Math.abs(validatedData.openingBalance),
        transaction_date: new Date().toISOString().split('T')[0],
        description: 'Opening balance',
        reference_number: `OB-${bankAccount.id.slice(-8)}`,
        created_by: authResult.user.id
      })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_BANK_ACCOUNT',
      entity_type: 'bank_account',
      entity_id: bankAccount.id,
      details: {
        account_name: validatedData.accountName,
        bank_name: validatedData.bankName,
        account_type: validatedData.accountType,
        currency: validatedData.currency
      }
    })

    return NextResponse.json({
      success: true,
      data: bankAccount,
      message: 'Bank account created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Bank account creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}