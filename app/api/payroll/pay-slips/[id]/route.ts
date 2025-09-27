import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update pay slip validation schema
const updatePaySlipSchema = z.object({
  status: z.enum(['DRAFT', 'PROCESSED', 'APPROVED', 'PAID']).optional(),
  workingDays: z.number().min(1).max(31).optional(),
  earnings: z.array(z.object({
    component_id: z.string().uuid().nullable(),
    component_name: z.string(),
    calculation_type: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
    amount: z.number()
  })).optional(),
  deductions: z.array(z.object({
    component_id: z.string().uuid().nullable(),
    component_name: z.string(),
    calculation_type: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
    amount: z.number()
  })).optional(),
  approvalNotes: z.string().max(1000).optional()
})

// GET /api/payroll/pay-slips/[id] - Get single pay slip
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

