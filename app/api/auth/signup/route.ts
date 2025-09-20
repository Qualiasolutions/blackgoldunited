// Signup API Route for BlackGoldUnited ERP
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { validateSignup } from '@/lib/auth/validation'
import { SignupData } from '@/lib/types/auth'
import { logAuthEvent } from '@/lib/auth/audit'

export async function POST(request: NextRequest) {
  try {
    const body: SignupData = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate request data
    const validation = validateSignup(body)
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

    const { firstName, lastName, email, password, role } = body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      await logAuthEvent({
        action: 'LOGIN_FAILED',
        email: email.toLowerCase(),
        ipAddress: clientIP,
        userAgent,
        success: false,
        details: { reason: 'Email already exists', action: 'signup' }
      })

      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        passwordHash,
        role: role || 'PROCUREMENT_BD',
        isActive: true,
        emailVerified: false // In production, this should be false until email verification
      }
    })

    // Log successful signup
    await logAuthEvent({
      action: 'LOGIN',
      userId: user.id,
      email: user.email,
      ipAddress: clientIP,
      userAgent,
      success: true,
      details: { action: 'signup', role: user.role }
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Signup error:', error)

    return NextResponse.json(
      { success: false, message: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}