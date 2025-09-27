import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// QHSE policy validation schema
const policySchema = z.object({
  policyNumber: z.string().min(1, 'Policy number is required').max(50),
  policyName: z.string().min(1, 'Policy name is required').max(255),
  category: z.enum(['QUALITY', 'HEALTH', 'SAFETY', 'ENVIRONMENT', 'INTEGRATED']),
  description: z.string().min(1, 'Description is required'),
  content: z.string().min(1, 'Policy content is required'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  approvalRequired: z.boolean().default(true),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  relatedPolicies: z.array(z.string().uuid()).default([])
})

// GET /api/qhse/policies - List all QHSE policies
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'qhse', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const query = searchParams.get('query') || ''
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const dueForReview = searchParams.get('dueForReview') === 'true'
    const offset = (page - 1) * limit

    // Build query
    let queryBuilder = supabase
      .from('qhse_policies')
      .select(`
        *,
        created_by_user:users!qhse_policies_created_by_fkey(
          first_name,
          last_name
        ),
        approved_by_user:users!qhse_policies_approved_by_fkey(
          first_name,
          last_name
        ),
        procedures_count:qhse_procedures(count),
        compliance_forms_count:qhse_compliance_forms(count)
      `)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`policy_name.ilike.%${query}%,description.ilike.%${query}%,policy_number.ilike.%${query}%`)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    if (isActive !== null) {
      queryBuilder = queryBuilder.eq('is_active', isActive === 'true')
    }

    if (dueForReview) {
      const today = new Date().toISOString().split('T')[0]
      queryBuilder = queryBuilder.lte('review_date', today)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('qhse_policies')
      .select('*', { count: 'exact', head: true })

    // Apply pagination and ordering
    const { data: policies, error } = await queryBuilder
      .order('effective_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch QHSE policies' }, { status: 500 })
    }

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Get statistics
    const today = new Date().toISOString().split('T')[0]
    const { data: allPolicies } = await supabase
      .from('qhse_policies')
      .select('category, review_date, is_active, status')

    const statistics = {
      total: allPolicies?.length || 0,
      active: allPolicies?.filter(p => p.is_active).length || 0,
      dueForReview: allPolicies?.filter(p => p.review_date <= today).length || 0,
      byCategory: allPolicies?.reduce((acc: any, policy: any) => {
        acc[policy.category] = (acc[policy.category] || 0) + 1
        return acc
      }, {}) || {}
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'LIST_QHSE_POLICIES',
      entity_type: 'qhse_policy',
      details: { page, limit, query, category, due_for_review: dueForReview }
    })

    return NextResponse.json({
      success: true,
      data: policies || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      },
      statistics
    })

  } catch (error) {
    console.error('QHSE policies fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/qhse/policies - Create new QHSE policy
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'qhse', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const validation = policySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 })
    }

    const {
      policyNumber,
      policyName,
      category,
      description,
      content,
      effectiveDate,
      reviewDate,
      expiryDate,
      approvalRequired,
      isActive,
      tags,
      relatedPolicies
    } = validation.data

    const supabase = await createClient()

    // Check if policy number already exists
    const { data: existingPolicy } = await supabase
      .from('qhse_policies')
      .select('policy_number')
      .eq('policy_number', policyNumber)
      .single()

    if (existingPolicy) {
      return NextResponse.json({
        error: 'Policy number already exists'
      }, { status: 400 })
    }

    // Validate related policies exist
    if (relatedPolicies.length > 0) {
      const { data: relatedPoliciesData, error: relatedError } = await supabase
        .from('qhse_policies')
        .select('id')
        .in('id', relatedPolicies)

      if (relatedError || relatedPoliciesData.length !== relatedPolicies.length) {
        return NextResponse.json({
          error: 'One or more related policies not found'
        }, { status: 400 })
      }
    }

    // Create policy
    const { data: policy, error: createError } = await supabase
      .from('qhse_policies')
      .insert({
        policy_number: policyNumber,
        policy_name: policyName,
        category,
        description,
        content,
        effective_date: effectiveDate,
        review_date: reviewDate,
        expiry_date: expiryDate || null,
        approval_required: approvalRequired,
        is_active: isActive,
        tags: tags || [],
        related_policies: relatedPolicies || [],
        status: approvalRequired ? 'DRAFT' : 'ACTIVE',
        created_by: authResult.user.id
      })
      .select(`
        *,
        created_by_user:users!qhse_policies_created_by_fkey(
          first_name,
          last_name
        )
      `)
      .single()

    if (createError) {
      console.error('Policy creation error:', createError)
      return NextResponse.json({ error: 'Failed to create QHSE policy' }, { status: 500 })
    }

    // If approval is required, create approval workflow
    if (approvalRequired) {
      await supabase.from('qhse_approvals').insert({
        entity_type: 'POLICY',
        entity_id: policy.id,
        status: 'PENDING',
        requested_by: authResult.user.id
      })
    }

    // Create audit trail entry
    await supabase.from('qhse_audit_trail').insert({
      entity_type: 'POLICY',
      entity_id: policy.id,
      action: 'CREATED',
      old_values: null,
      new_values: {
        policy_number: policyNumber,
        policy_name: policyName,
        category,
        status: policy.status
      },
      changed_by: authResult.user.id
    })

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'CREATE_QHSE_POLICY',
      entity_type: 'qhse_policy',
      entity_id: policy.id,
      details: {
        policy_number: policyNumber,
        policy_name: policyName,
        category,
        approval_required: approvalRequired
      }
    })

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'QHSE policy created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('QHSE policy creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}