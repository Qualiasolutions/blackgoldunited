// Password Reset Confirmation API Route for BlackGoldUnited ERP
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { validatePasswordReset } from '@/lib/auth/validation'
import { PasswordReset } from '@/lib/types/auth'
import { logPasswordReset } from '@/lib/auth/audit'

export async function POST(request: NextRequest) {
  try {
    const body: PasswordReset = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate request data
    const validation = validatePasswordReset(body)
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

    const { token, password } = body

    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token must not be expired
        },
        isActive: true
      }
    })

    if (!user) {
      await logPasswordReset('unknown', false, clientIP, userAgent)

      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hash(password, 12)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    // Log successful password reset
    await logPasswordReset(user.email, true, clientIP, userAgent)

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    })

  } catch (error) {
    console.error('Password reset confirmation error:', error)

    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting your password' },
      { status: 500 }
    )
  }
}