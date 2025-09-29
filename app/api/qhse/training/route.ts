import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/qhse/training - Get QHSE training progress
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'qhse', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // For now, return sample training data
    // TODO: Create qhse_training table in database

    const training = [
      {
        course: 'Fire Safety Training',
        completed: 142,
        total: 142,
        percentage: 100,
        dueDate: '2025-03-31'
      },
      {
        course: 'First Aid Certification',
        completed: 38,
        total: 50,
        percentage: 76,
        dueDate: '2025-02-28'
      },
      {
        course: 'Chemical Handling Safety',
        completed: 28,
        total: 35,
        percentage: 80,
        dueDate: '2025-03-15'
      },
      {
        course: 'Equipment Operation Safety',
        completed: 89,
        total: 95,
        percentage: 94,
        dueDate: '2025-04-30'
      },
      {
        course: 'Workplace Hazard Identification',
        completed: 125,
        total: 142,
        percentage: 88,
        dueDate: '2025-05-31'
      }
    ]

    return NextResponse.json({
      success: true,
      data: training
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}