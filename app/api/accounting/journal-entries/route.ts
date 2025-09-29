import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/accounting/journal-entries - Get journal entries
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'accounting', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)

    // For now, return sample journal entries
    // TODO: Create journal_entries table in database

    const currentDate = new Date()
    const journalEntries = [
      {
        id: 'JE-001',
        date: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Sales revenue recognition',
        reference: 'INV-2025-001',
        debit: 45000,
        credit: 45000,
        status: 'POSTED'
      },
      {
        id: 'JE-002',
        date: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Office rent payment',
        reference: 'RENT-JAN',
        debit: 8200,
        credit: 8200,
        status: 'POSTED'
      },
      {
        id: 'JE-003',
        date: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Equipment purchase',
        reference: 'PO-2025-003',
        debit: 12500,
        credit: 12500,
        status: 'POSTED'
      },
      {
        id: 'JE-004',
        date: new Date(currentDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Utility bill payment',
        reference: 'UTIL-001',
        debit: 1850,
        credit: 1850,
        status: 'POSTED'
      },
      {
        id: 'JE-005',
        date: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Customer payment received',
        reference: 'PMT-089',
        debit: 23500,
        credit: 23500,
        status: 'POSTED'
      }
    ].slice(0, limit)

    return NextResponse.json({
      success: true,
      data: journalEntries
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}