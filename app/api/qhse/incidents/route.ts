import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/qhse/incidents - Get QHSE incidents
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'qhse', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const status = searchParams.get('status')

    // For now, return sample incident data
    // TODO: Create qhse_incidents table in database

    const currentDate = new Date()
    const allIncidents = [
      {
        id: 'INC-001',
        type: 'Near Miss',
        description: 'Employee slipped on wet floor in warehouse',
        severity: 'Low',
        status: 'Investigating',
        date: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reporter: 'John Smith',
        reporterId: null
      },
      {
        id: 'INC-002',
        type: 'Environmental',
        description: 'Minor oil spill in machinery area',
        severity: 'Medium',
        status: 'Resolved',
        date: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reporter: 'Sarah Johnson',
        reporterId: null
      },
      {
        id: 'INC-003',
        type: 'Safety Violation',
        description: 'PPE not worn in designated area',
        severity: 'High',
        status: 'Action Required',
        date: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reporter: 'Michael Brown',
        reporterId: null
      },
      {
        id: 'INC-004',
        type: 'Equipment',
        description: 'Safety guard damaged on equipment',
        severity: 'High',
        status: 'Resolved',
        date: new Date(currentDate.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reporter: 'Emily Davis',
        reporterId: null
      },
      {
        id: 'INC-005',
        type: 'Near Miss',
        description: 'Forklift nearly collided with pedestrian',
        severity: 'Medium',
        status: 'Investigating',
        date: new Date(currentDate.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reporter: 'David Wilson',
        reporterId: null
      }
    ]

    let filteredIncidents = allIncidents
    if (status) {
      filteredIncidents = allIncidents.filter(i => i.status.toLowerCase() === status.toLowerCase())
    }

    return NextResponse.json({
      success: true,
      data: filteredIncidents.slice(0, limit)
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}