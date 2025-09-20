// Change Password API Route for BlackGoldUnited ERP
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { hash, compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth/config'
import { validateChangePassword } from '@/lib/auth/validation'
import { ChangePasswordData } from '@/lib/types/auth'
import { logPasswordChange } from '@/lib/auth/audit'
import { sendPasswordChangedNotification } from '@/lib/auth/email'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: ChangePasswordData = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate request data
    const validation = validateChangePassword(body)
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

    const { currentPassword, newPassword } = body

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const newPasswordHash = await hash(newPassword, 12)

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    })

    // Log password change
    await logPasswordChange(user.id, clientIP, userAgent)

    // Send notification email
    try {
      await sendPasswordChangedNotification(user.email, user.firstName)
    } catch (emailError) {
      console.error('Failed to send password changed notification:', emailError)
      // Don't fail the request if email notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)

    return NextResponse.json(
      { success: false, message: 'An error occurred while changing your password' },
      { status: 500 }
    )
  }
}