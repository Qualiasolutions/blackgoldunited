// Password Reset Request API Route for BlackGoldUnited ERP
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { validatePasswordResetRequest } from '@/lib/auth/validation'
import { PasswordResetRequest } from '@/lib/types/auth'
import { logPasswordReset } from '@/lib/auth/audit'
import { sendPasswordResetEmail } from '@/lib/auth/email'

export async function POST(request: NextRequest) {
  try {
    const body: PasswordResetRequest = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate request data
    const validation = validatePasswordResetRequest(body)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.errors.map(e => e.message).join(', '),
          errors: validation.errors
        },
        { status: 400 }
      )
    }

    const { email } = body

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user && user.isActive) {
      // Generate reset token
      const resetToken = randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

      // Save reset token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry
        }
      })

      // Send password reset email (implement this function)
      try {
        await sendPasswordResetEmail(user.email, user.firstName, resetToken)

        await logPasswordReset(user.email, true, clientIP, userAgent)
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
        await logPasswordReset(user.email, false, clientIP, userAgent)

        return NextResponse.json(
          { success: false, message: 'Failed to send password reset email' },
          { status: 500 }
        )
      }
    } else {
      // Log attempt for non-existent or inactive user
      await logPasswordReset(email.toLowerCase(), false, clientIP, userAgent)
    }

    // Always return success response
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    })

  } catch (error) {
    console.error('Password reset request error:', error)

    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}