import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update salary component validation schema
const updateSalaryComponentSchema = z.object({
  componentName: z.string().min(1, 'Component name is required').max(100).optional(),
  componentType: z.enum(['EARNING', 'DEDUCTION']).optional(),
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']).optional(),
  isTaxable: z.boolean().optional(),
  isActive: z.boolean().optional()
})

// GET /api/payroll/salary-components/[id] - Get single salary component
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

