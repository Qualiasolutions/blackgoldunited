import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update salary structure validation schema
const updateSalaryStructureSchema = z.object({
  structureName: z.string().min(1, 'Structure name is required').max(100).optional(),
  isActive: z.boolean().optional(),
  components: z.array(z.object({
    salaryComponentId: z.string().uuid('Invalid component ID'),
    amount: z.number().min(0).optional(),
    percentage: z.number().min(0).max(100).optional(),
    formula: z.string().optional()
  })).optional()
})

// GET /api/payroll/salary-structures/[id] - Get single salary structure
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

