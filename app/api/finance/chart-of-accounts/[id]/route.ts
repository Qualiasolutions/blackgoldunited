import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update account validation schema
const updateAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required').max(100).optional(),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
  parentAccountId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional()
})

// GET /api/finance/chart-of-accounts/[id] - Get single account
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'finance', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Fetch account with full details
    const { data: account, error } = await supabase
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
        ),
        journal_entries_count:journal_entries(count)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'VIEW_ACCOUNT',
      entity_type: 'chart_of_accounts',
      entity_id: id,
      details: { account_code: account.account_code }
    })

    return NextResponse.json({
      success: true,
      data: account
    })

  } catch (error) {
    console.error('Account fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/finance/chart-of-accounts/[id] - Update account
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'finance', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = updateAccountSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { accountName, accountType, parentAccountId, isActive, description } = validation.data
    const supabase = await createClient()

    // Check if account exists
    const { data: existingAccount, error: fetchError } = await supabase
      .from('chart_of_accounts')
      .select('id, account_code, account_name')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
    }

    // If parent account is being changed, validate the new parent
    if (parentAccountId !== undefined) {
      if (parentAccountId === id) {
        return NextResponse.json({
          error: 'Account cannot be its own parent'
        }, { status: 400 })
      }

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
    }

    // Prepare update data
    const updateData: any = {}
    if (accountName !== undefined) updateData.account_name = accountName
    if (accountType !== undefined) updateData.account_type = accountType
    if (parentAccountId !== undefined) updateData.parent_account_id = parentAccountId
    if (isActive !== undefined) updateData.is_active = isActive
    if (description !== undefined) updateData.description = description

    // Update account
    const { data: updatedAccount, error: updateError } = await supabase
      .from('chart_of_accounts')
      .update(updateData)
      .eq('id', id)
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

    if (updateError) {
      console.error('Account update error:', updateError)
      return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'UPDATE_ACCOUNT',
      entity_type: 'chart_of_accounts',
      entity_id: id,
      details: {
        account_code: existingAccount.account_code,
        updated_fields: Object.keys(updateData)
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedAccount,
      message: 'Account updated successfully'
    })

  } catch (error) {
    console.error('Account update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/finance/chart-of-accounts/[id] - Delete account
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'finance', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Check if account exists and get details for logging
    const { data: account, error: fetchError } = await supabase
      .from('chart_of_accounts')
      .select('id, account_code, account_name')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
    }

    // Check if account is being used in journal entries
    const { data: journalEntries, error: journalError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('account_id', id)
      .limit(1)

    if (journalError) {
      console.error('Journal entries check error:', journalError)
      return NextResponse.json({ error: 'Failed to check account usage' }, { status: 500 })
    }

    if (journalEntries && journalEntries.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete account as it has associated journal entries'
      }, { status: 400 })
    }

    // Check if account has child accounts
    const { data: childAccounts, error: childError } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('parent_account_id', id)
      .limit(1)

    if (childError) {
      console.error('Child accounts check error:', childError)
      return NextResponse.json({ error: 'Failed to check child accounts' }, { status: 500 })
    }

    if (childAccounts && childAccounts.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete account as it has child accounts'
      }, { status: 400 })
    }

    // Delete account
    const { error: deleteError } = await supabase
      .from('chart_of_accounts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Account deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'DELETE_ACCOUNT',
      entity_type: 'chart_of_accounts',
      entity_id: id,
      details: {
        account_code: account.account_code,
        account_name: account.account_name
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })

  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}