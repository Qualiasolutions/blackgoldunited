// NextAuth.js Configuration for BlackGoldUnited ERP
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ACCESS_CONTROL_MATRIX, type SessionUser } from '@/lib/types/auth'
import { UserRole } from '@prisma/client'
import { logAuthEvent } from '@/lib/auth/audit'

declare module "next-auth" {
  interface Session {
    user: SessionUser
  }

  interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    employeeId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    employeeId?: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          await logAuthEvent({
            action: 'LOGIN_FAILED',
            email: credentials?.email || 'unknown',
            ipAddress: req.headers?.['x-forwarded-for'] as string,
            userAgent: req.headers?.['user-agent'],
            success: false,
            details: { reason: 'Missing credentials' }
          })
          return null
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase()
            },
            include: {
              employee: true
            }
          })

          if (!user) {
            await logAuthEvent({
              action: 'LOGIN_FAILED',
              email: credentials.email,
              ipAddress: req.headers?.['x-forwarded-for'] as string,
              userAgent: req.headers?.['user-agent'],
              success: false,
              details: { reason: 'User not found' }
            })
            return null
          }

          // Check if user is active
          if (!user.isActive) {
            await logAuthEvent({
              action: 'LOGIN_FAILED',
              userId: user.id,
              email: user.email,
              ipAddress: req.headers?.['x-forwarded-for'] as string,
              userAgent: req.headers?.['user-agent'],
              success: false,
              details: { reason: 'Account disabled' }
            })
            return null
          }

          // Verify password
          const isPasswordValid = await compare(credentials.password, user.passwordHash)

          if (!isPasswordValid) {
            await logAuthEvent({
              action: 'LOGIN_FAILED',
              userId: user.id,
              email: user.email,
              ipAddress: req.headers?.['x-forwarded-for'] as string,
              userAgent: req.headers?.['user-agent'],
              success: false,
              details: { reason: 'Invalid password' }
            })
            return null
          }

          // Update last login timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

          // Log successful login
          await logAuthEvent({
            action: 'LOGIN',
            userId: user.id,
            email: user.email,
            ipAddress: req.headers?.['x-forwarded-for'] as string,
            userAgent: req.headers?.['user-agent'],
            success: true
          })

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            employeeId: user.employeeId || undefined
          }
        } catch (error) {
          console.error('Authentication error:', error)
          await logAuthEvent({
            action: 'LOGIN_FAILED',
            email: credentials.email,
            ipAddress: req.headers?.['x-forwarded-for'] as string,
            userAgent: req.headers?.['user-agent'],
            success: false,
            details: { reason: 'System error', error: (error as Error).message }
          })
          return null
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.role = user.role
        token.employeeId = user.employeeId
      }

      // Handle session update
      if (trigger === 'update' && session) {
        if (session.firstName) token.firstName = session.firstName
        if (session.lastName) token.lastName = session.lastName
        if (session.role) token.role = session.role
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        const permissions = ACCESS_CONTROL_MATRIX[token.role as UserRole]

        session.user = {
          id: token.id,
          email: token.email,
          firstName: token.firstName,
          lastName: token.lastName,
          role: token.role,
          permissions,
          employeeId: token.employeeId
        }
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      try {
        if (new URL(url).origin === baseUrl) return url
      } catch (error) {
        console.warn('Invalid URL in redirect callback:', url)
      }
      // Default redirect to dashboard after login
      return `${baseUrl}/dashboard`
    }
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },


  events: {
    async signOut({ token }) {
      if (token?.id) {
        await logAuthEvent({
          action: 'LOGOUT',
          userId: token.id,
          email: token.email,
          success: true
        })
      }
    }
  },

  debug: process.env.NODE_ENV === 'development',

  // Ensure trust host for Vercel deployment
  trustHost: true,
}