import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/qhse/compliance - Get QHSE compliance status
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'qhse', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // For now, return sample compliance data
    // TODO: Create qhse_compliance table in database

    const compliance = [
      {
        area: 'ISO 45001 (Safety)',
        status: 'Compliant',
        lastAudit: '2024-12-15',
        nextAudit: '2025-06-15',
        score: 98
      },
      {
        area: 'ISO 14001 (Environment)',
        status: 'Compliant',
        lastAudit: '2024-11-20',
        nextAudit: '2025-05-20',
        score: 97
      },
      {
        area: 'ISO 9001 (Quality)',
        status: 'Compliant',
        lastAudit: '2024-10-10',
        nextAudit: '2025-04-10',
        score: 99
      },
      {
        area: 'Local Safety Regulations',
        status: 'Action Required',
        lastAudit: '2025-01-05',
        nextAudit: '2025-07-05',
        score: 92
      }
    ]

    return NextResponse.json({
      success: true,
      data: compliance
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}