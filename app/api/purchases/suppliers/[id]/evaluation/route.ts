import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Supplier evaluation schema
const evaluationSchema = z.object({
  evaluationDate: z.string().datetime().default(new Date().toISOString()),
  qualityRating: z.number().min(1).max(5),
  deliveryRating: z.number().min(1).max(5),
  serviceRating: z.number().min(1).max(5),
  priceRating: z.number().min(1).max(5),
  overallRating: z.number().min(1).max(5),
  comments: z.string().optional(),
  evaluatedBy: z.string().uuid(),
  recommendations: z.string().optional(),
  nextEvaluationDate: z.string().datetime().optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/purchases/suppliers/[id]/evaluation - Get supplier evaluations
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { id: supplierId } = await params

    // Get supplier evaluations with evaluator info
    const { data: evaluations, error } = await supabase
      .from('supplier_evaluations')
      .select(`
        *,
        evaluatedByUser:users!supplier_evaluations_evaluatedBy_fkey(
          id,
          firstName,
          lastName,
          email
        )
      `)
      .eq('supplierId', supplierId)
      .order('evaluationDate', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 })
    }

    // Calculate average ratings
    const avgRatings = evaluations?.length > 0 ? {
      qualityAvg: evaluations.reduce((sum, e) => sum + e.qualityRating, 0) / evaluations.length,
      deliveryAvg: evaluations.reduce((sum, e) => sum + e.deliveryRating, 0) / evaluations.length,
      serviceAvg: evaluations.reduce((sum, e) => sum + e.serviceRating, 0) / evaluations.length,
      priceAvg: evaluations.reduce((sum, e) => sum + e.priceRating, 0) / evaluations.length,
      overallAvg: evaluations.reduce((sum, e) => sum + e.overallRating, 0) / evaluations.length,
    } : null

    return NextResponse.json({
      success: true,
      data: {
        evaluations: evaluations || [],
        averageRatings: avgRatings
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/purchases/suppliers/[id]/evaluation - Create supplier evaluation
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'purchase', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { id: supplierId } = await params
    const body = await request.json()

    // Set evaluatedBy to current user
    body.evaluatedBy = authResult.user.id

    // Validate request data
    const validationResult = evaluationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const evaluationData = validationResult.data

    // Verify supplier exists
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', supplierId)
      .is('deletedAt', null)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Create the evaluation
    const { data: evaluation, error } = await supabase
      .from('supplier_evaluations')
      .insert([{
        ...evaluationData,
        supplierId,
        createdAt: new Date().toISOString()
      }])
      .select(`
        *,
        evaluatedByUser:users!supplier_evaluations_evaluatedBy_fkey(
          id,
          firstName,
          lastName,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create evaluation' }, { status: 500 })
    }

    // Update supplier's overall rating based on latest evaluations
    const { data: recentEvaluations } = await supabase
      .from('supplier_evaluations')
      .select('overallRating')
      .eq('supplierId', supplierId)
      .order('evaluationDate', { ascending: false })
      .limit(5) // Consider last 5 evaluations

    if (recentEvaluations && recentEvaluations.length > 0) {
      const avgRating = recentEvaluations.reduce((sum, e) => sum + e.overallRating, 0) / recentEvaluations.length

      await supabase
        .from('suppliers')
        .update({
          rating: Math.round(avgRating * 100) / 100,
          updatedAt: new Date().toISOString()
        })
        .eq('id', supplierId)
    }

    return NextResponse.json({
      success: true,
      data: evaluation
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}