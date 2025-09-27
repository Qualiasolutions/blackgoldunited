import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update overtime validation schema
const updateOvertimeSchema = z.object({
  overtimeHours: z.number().min(0.5).max(24).optional(),
  overtimeType: z.enum(['REGULAR', 'WEEKEND', 'HOLIDAY', 'NIGHT_SHIFT']).optional(),
  description: z.string().min(5).max(500).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).optional(),
  approvedBy: z.string().uuid().optional(),
  approvalNotes: z.string().max(1000).optional()
})

// Function to calculate overtime rate based on type
function calculateOvertimeRate(overtimeType: string, basicHourlyRate: number): number {
  const rateMultipliers = {
    'REGULAR': 1.5,      // 150% of basic rate
    'WEEKEND': 2.0,      // 200% of basic rate
    'HOLIDAY': 2.5,      // 250% of basic rate
    'NIGHT_SHIFT': 1.75  // 175% of basic rate
  }

  return basicHourlyRate * (rateMultipliers[overtimeType as keyof typeof rateMultipliers] || 1.5)
}

// GET /api/payroll/overtime/[id] - Get single overtime record
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

