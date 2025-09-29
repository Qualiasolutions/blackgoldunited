import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/qhse/stats - Get QHSE statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'qhse', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // For now, return mock data as QHSE tables need to be created
    // TODO: Create qhse_incidents, qhse_compliance, qhse_training tables

    const mockStats = {
      safetyScore: 96,
      openIncidents: 3,
      highPriorityIncidents: 1,
      complianceRate: 98.5,
      trainingCompleted: 139,
      trainingTotal: 142,
      trainingPending: 3,
      environmental: {
        co2Emissions: 2.3,
        co2Change: -15,
        waterUsage: 1240,
        waterChange: -8,
        wasteRecycled: 85,
        wasteChange: 5,
        energyUsage: 4.2,
        energyChange: -12
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