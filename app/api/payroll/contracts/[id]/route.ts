import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update contract validation schema
const updateContractSchema = z.object({
  salaryStructureId: z.string().uuid().optional(),
  basicSalary: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().or(z.literal('')),
  contractType: z.enum(['PERMANENT', 'TEMPORARY', 'CONTRACT']).optional(),
  workingHoursPerWeek: z.number().min(1).max(168).optional(),
  probationPeriod: z.number().min(0).max(12).optional(),
  noticePeriod: z.number().min(0).max(365).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']).optional()
})

// GET /api/payroll/contracts/[id] - Get single contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
