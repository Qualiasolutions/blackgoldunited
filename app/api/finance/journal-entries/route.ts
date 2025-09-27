import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Journal entry line item schema
const journalLineSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  debitAmount: z.number().min(0).optional(),
  creditAmount: z.number().min(0).optional(),
  description: z.string().optional()
})

// Journal entry validation schema
const journalEntrySchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  referenceNumber: z.string().max(50).optional(),
  description: z.string().min(1, 'Description is required').max(255),
  journalLines: z.array(journalLineSchema).min(2, 'At least 2 journal lines required')
}).refine((data) => {
  // Validate that each line has either debit or credit (not both, not neither)
  const validLines = data.journalLines.every(line =>
    (line.debitAmount || 0) > 0 !== (line.creditAmount || 0) > 0
  )
  if (!validLines) return false

  // Validate that total debits equal total credits
  const totalDebits = data.journalLines.reduce((sum, line) => sum + (line.debitAmount || 0), 0)
  const totalCredits = data.journalLines.reduce((sum, line) => sum + (line.creditAmount || 0), 0)

  return Math.abs(totalDebits - totalCredits) < 0.01 // Allow for small rounding differences
}, {
  message: "Total debits must equal total credits"
})

// GET /api/finance/journal-entries - List all journal entries
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const accountId = searchParams.get('accountId')
    const query = searchParams.get('query') || ''
    const offset = (page - 1) * limit

    // Build query
    let queryBuilder = supabase
      .from('journal_entries')
      .select(`
        *,
        journal_lines:journal_entry_lines(
          *,
          account:chart_of_accounts(
            id,
            account_code,
            account_name,
            account_type
          )
        ),
        created_by_user:users!journal_entries_created_by_fkey(
          first_name,
          last_name
        )
      `)

    // Apply filters
    if (startDate && endDate) {
      queryBuilder = queryBuilder
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
    }

    if (query) {
      queryBuilder = queryBuilder.or(`description.ilike.%${query}%,reference_number.ilike.%${query}%`)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: journalEntries, error } = await queryBuilder
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // If filtering by account, also get summary
    let accountSummary = null
    if (accountId) {
      const { data: summaryData } = await supabase
        .from('journal_entry_lines')
        .select('debit_amount, credit_amount')
        .eq('account_id', accountId)

      if (summaryData) {
        const totalDebits = summaryData.reduce((sum, line) => sum + (line.debit_amount || 0), 0)
        const totalCredits = summaryData.reduce((sum, line) => sum + (line.credit_amount || 0), 0)
        accountSummary = {
          total_debits: totalDebits,
          total_credits: totalCredits,
          net_balance: totalDebits - totalCredits
        }
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_JOURNAL_ENTRIES',
      entity_type: 'journal_entry',
      details: { page, limit, start_date: startDate, end_date: endDate, account_id: accountId }
    })

    return NextResponse.json({
      success: true,
      data: journalEntries || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      },
      account_summary: accountSummary
    })

  } catch (error) {
    console.error('Journal entries fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/finance/journal-entries - Create new journal entry
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'finance', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = journalEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { entryDate, referenceNumber, description, journalLines } = validation.data
    const supabase = await createClient()

    // Validate all account IDs exist and are active
    const accountIds = journalLines.map(line => line.accountId)
    const { data: accounts, error: accountsError } = await supabase
      .from('chart_of_accounts')
      .select('id, account_code, account_name, is_active')
      .in('id', accountIds)

    if (accountsError) {
      console.error('Accounts validation error:', accountsError)
      return NextResponse.json({ error: 'Failed to validate accounts' }, { status: 500 })
    }

    if (accounts.length !== accountIds.length) {
      return NextResponse.json({
        error: 'One or more account IDs are invalid'
      }, { status: 400 })
    }

    const inactiveAccounts = accounts.filter(acc => !acc.is_active)
    if (inactiveAccounts.length > 0) {
      return NextResponse.json({
        error: `Cannot use inactive accounts: ${inactiveAccounts.map(acc => acc.account_code).join(', ')}`
      }, { status: 400 })
    }

    // Generate journal entry number if reference number not provided
    const entryNumber = referenceNumber || await generateJournalEntryNumber(supabase, entryDate)

    // Start transaction
    const { data: journalEntry, error: entryError } = await supabase
      .from('journal_entries')
      .insert({
        entry_date: entryDate,
        reference_number: entryNumber,
        description,
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (entryError) {
      console.error('Journal entry creation error:', entryError)
      return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
    }

    // Create journal entry lines
    const journalLineData = journalLines.map(line => ({
      journal_entry_id: journalEntry.id,
      account_id: line.accountId,
      debit_amount: line.debitAmount || null,
      credit_amount: line.creditAmount || null,
      description: line.description || null
    }))

    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(journalLineData)

    if (linesError) {
      console.error('Journal lines creation error:', linesError)
      // Rollback - delete the journal entry
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return NextResponse.json({ error: 'Failed to create journal entry lines' }, { status: 500 })
    }

    // Fetch complete journal entry with lines
    const { data: completeEntry } = await supabase
      .from('journal_entries')
      .select(`
        *,
        journal_lines:journal_entry_lines(
          *,
          account:chart_of_accounts(
            id,
            account_code,
            account_name,
            account_type
          )
        )
      `)
      .eq('id', journalEntry.id)
      .single()

    // Calculate totals for logging
    const totalAmount = journalLines.reduce((sum, line) => sum + (line.debitAmount || line.creditAmount || 0), 0) / 2

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_JOURNAL_ENTRY',
      entity_type: 'journal_entry',
      entity_id: journalEntry.id,
      details: {
        reference_number: entryNumber,
        description,
        entry_date: entryDate,
        total_amount: totalAmount,
        lines_count: journalLines.length
      }
    })

    return NextResponse.json({
      success: true,
      data: completeEntry,
      message: 'Journal entry created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Journal entry creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate journal entry number
async function generateJournalEntryNumber(supabase: any, entryDate: string): Promise<string> {
  const year = entryDate.substring(0, 4)
  const month = entryDate.substring(5, 7)

  // Get the count of entries for this month
  const { count } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .gte('entry_date', `${year}-${month}-01`)
    .lt('entry_date', `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`)

  const nextNumber = (count || 0) + 1
  return `JE-${year}${month}-${String(nextNumber).padStart(4, '0')}`
}