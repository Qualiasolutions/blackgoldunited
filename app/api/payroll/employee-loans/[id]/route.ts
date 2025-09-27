import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update employee loan validation schema
const updateEmployeeLoanSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED']).optional(),
  interestRate: z.number().min(0).max(50).optional(),
  repaymentMonths: z.number().min(1).max(120).optional(),
  reason: z.string().min(5).max(500).optional(),
  guarantorInfo: z.string().optional(),
  approvalNotes: z.string().max(1000).optional(),
  paymentMade: z.number().min(0).optional()
})

// Function to recalculate loan installments
function calculateInstallments(amount: number, months: number, interestRate: number) {
  if (interestRate === 0) {
    return {
      monthlyInstallment: amount / months,
      totalAmount: amount,
      totalInterest: 0
    }
  }

  const monthlyRate = interestRate / 100 / 12
  const monthlyInstallment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                            (Math.pow(1 + monthlyRate, months) - 1)
  const totalAmount = monthlyInstallment * months
  const totalInterest = totalAmount - amount

  return {
    monthlyInstallment: Math.round(monthlyInstallment * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100
  }
}

// GET /api/payroll/employee-loans/[id] - Get single employee loan
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

