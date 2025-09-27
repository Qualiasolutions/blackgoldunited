import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Chart of accounts validation schema
const chartOfAccountsSchema = z.object({
  accountCode: z.string().min(1, 'Account code is required').max(20),
  accountName: z.string().min(1, 'Account name is required').max(100),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentAccountId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  description: z.string().optional()
})

// GET /api/finance/chart-of-accounts - List all accounts with hierarchy
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
    const accountType = searchParams.get('accountType')
    const isActive = searchParams.get('isActive')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Build query with hierarchy
    let queryBuilder = supabase
      .from('chart_of_accounts')
      .select(`
        *,
        parent_account:chart_of_accounts!chart_of_accounts_parent_account_id_fkey(
          id,
          account_code,
          account_name,
          account_type
        ),
        child_accounts:chart_of_accounts!chart_of_accounts_parent_account_id_fkey(
          id,
          account_code,
          account_name,
          account_type,
          is_active
        )
      `)

    // Apply filters
    if (accountType) {
      queryBuilder = queryBuilder.eq('account_type', accountType)
    }

    if (!includeInactive) {
      queryBuilder = queryBuilder.eq('is_active', true)
    } else if (isActive !== null) {
      queryBuilder = queryBuilder.eq('is_active', isActive === 'true')
    }

    const { data: accounts, error } = await queryBuilder
      .order('account_code', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch chart of accounts' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_CHART_OF_ACCOUNTS',
      entity_type: 'chart_of_accounts',
      details: { account_type: accountType, include_inactive: includeInactive }
    })

    return NextResponse.json({
      success: true,
      data: accounts || []
    })

  } catch (error) {
    console.error('Chart of accounts fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/finance/chart-of-accounts - Create new account
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'finance', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = chartOfAccountsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { accountCode, accountName, accountType, parentAccountId, isActive, description } = validation.data
    const supabase = await createClient()

    // Check if account code already exists
    const { data: existingAccount } = await supabase
      .from('chart_of_accounts')
      .select('account_code')
      .eq('account_code', accountCode)
      .single()

    if (existingAccount) {
      return NextResponse.json({
        error: 'Account code already exists'
      }, { status: 400 })
    }

    // If parent account is specified, validate it exists and has correct type hierarchy
    if (parentAccountId) {
      const { data: parentAccount, error: parentError } = await supabase
        .from('chart_of_accounts')
        .select('account_type')
        .eq('id', parentAccountId)
        .single()

      if (parentError || !parentAccount) {
        return NextResponse.json({
          error: 'Parent account not found'
        }, { status: 400 })
      }
    }

    // Create account
    const { data: account, error: createError } = await supabase
      .from('chart_of_accounts')
      .insert({
        account_code: accountCode,
        account_name: accountName,
        account_type: accountType,
        parent_account_id: parentAccountId || null,
        is_active: isActive,
        description: description || null,
        created_by: authResult.user.id
      })
      .select(`
        *,
        parent_account:chart_of_accounts!chart_of_accounts_parent_account_id_fkey(
          id,
          account_code,
          account_name,
          account_type
        )
      `)
      .single()

    if (createError) {
      console.error('Account creation error:', createError)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_ACCOUNT',
      entity_type: 'chart_of_accounts',
      entity_id: account.id,
      details: {
        account_code: accountCode,
        account_name: accountName,
        account_type: accountType
      }
    })

    return NextResponse.json({
      success: true,
      data: account,
      message: 'Account created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Account creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}