// Authentication Audit Logging for BlackGoldUnited ERP
import { prisma } from '@/lib/prisma'
import type { AuthAuditLog } from '@/lib/types/auth'

interface LogAuthEventParams {
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET' | 'ACCOUNT_LOCKED'
  userId?: string
  email: string
  ipAddress?: string
  userAgent?: string
  success: boolean
  details?: any
}

export async function logAuthEvent(params: LogAuthEventParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tableName: 'authentication',
        recordId: params.userId || 'anonymous',
        action: params.action,
        oldData: undefined,
        newData: {
          email: params.email,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          success: params.success,
          timestamp: new Date().toISOString(),
          details: params.details
        },
        userId: params.userId || 'system',
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      }
    })
  } catch (error) {
    // Don't throw errors from audit logging to avoid breaking auth flow
    console.error('Failed to log auth event:', error)
  }
}

export async function getAuthAuditLogs(options: {
  userId?: string
  email?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}): Promise<AuthAuditLog[]> {
  const where: any = {
    tableName: 'authentication'
  }

  if (options.userId) {
    where.userId = options.userId
  }

  if (options.email) {
    where.newData = {
      path: ['email'],
      equals: options.email
    }
  }

  if (options.action) {
    where.action = options.action
  }

  if (options.startDate || options.endDate) {
    where.timestamp = {}
    if (options.startDate) {
      where.timestamp.gte = options.startDate
    }
    if (options.endDate) {
      where.timestamp.lte = options.endDate
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: {
      timestamp: 'desc'
    },
    take: options.limit || 50,
    skip: options.offset || 0
  })

  return logs.map(log => ({
    id: log.id,
    action: log.action as any,
    userId: log.userId !== 'system' ? log.userId : undefined,
    email: (log.newData as any)?.email || '',
    ipAddress: log.ipAddress || undefined,
    userAgent: log.userAgent || undefined,
    timestamp: log.timestamp,
    success: (log.newData as any)?.success || false,
    details: (log.newData as any)?.details
  }))
}

export async function getFailedLoginAttempts(
  email: string,
  since: Date = new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
): Promise<number> {
  const attempts = await prisma.auditLog.count({
    where: {
      tableName: 'authentication',
      action: 'LOGIN_FAILED',
      newData: {
        path: ['email'],
        equals: email
      },
      timestamp: {
        gte: since
      }
    }
  })

  return attempts
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const failedAttempts = await getFailedLoginAttempts(email)
  return failedAttempts >= 5 // Lock account after 5 failed attempts in 15 minutes
}

export async function logPasswordChange(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
  await logAuthEvent({
    action: 'PASSWORD_CHANGE',
    userId,
    email: '', // Will be populated by getting user email
    ipAddress,
    userAgent,
    success: true
  })
}

export async function logPasswordReset(email: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<void> {
  await logAuthEvent({
    action: 'PASSWORD_RESET',
    email,
    ipAddress,
    userAgent,
    success
  })
}