import { createClient } from '@/lib/supabase/server'

export interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
  module?: string
  relatedId?: string
}

/**
 * Create a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const supabase = await createClient()

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        module: params.module,
        related_id: params.relatedId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      throw error
    }

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw error
  }
}

/**
 * Create notifications for all users with specific roles
 */
export async function createNotificationForRoles(
  roles: string[],
  notificationData: Omit<CreateNotificationParams, 'userId'>
) {
  try {
    const supabase = await createClient()

    // Get users with specified roles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('role', roles)
      .eq('is_active', true)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw usersError
    }

    if (!users || users.length === 0) {
      console.log('No users found with specified roles:', roles)
      return []
    }

    // Create notifications for all users
    const notifications = users.map(user => ({
      user_id: user.id,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      module: notificationData.module,
      related_id: notificationData.relatedId
    }))

    const { data: createdNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (insertError) {
      console.error('Error creating notifications for roles:', insertError)
      throw insertError
    }

    return createdNotifications
  } catch (error) {
    console.error('Failed to create notifications for roles:', error)
    throw error
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    throw error
  }
}

/**
 * Clean up expired notifications (usually run as a cron job)
 */
export async function cleanupExpiredNotifications() {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Error cleaning up expired notifications:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Failed to cleanup expired notifications:', error)
    throw error
  }
}

// Predefined notification templates for common ERP events
export const NotificationTemplates = {
  invoice: {
    created: (invoiceNumber: string, amount: number, clientName: string) => ({
      title: 'New Invoice Created',
      message: `Invoice ${invoiceNumber} has been created for ${clientName} - Amount: AED ${amount.toLocaleString()}`,
      type: 'info' as const,
      module: 'sales'
    }),
    paid: (invoiceNumber: string, amount: number, clientName: string) => ({
      title: 'Invoice Payment Received',
      message: `Payment of AED ${amount.toLocaleString()} received for Invoice ${invoiceNumber} from ${clientName}`,
      type: 'success' as const,
      module: 'sales'
    }),
    overdue: (invoiceNumber: string, daysPastDue: number) => ({
      title: 'Invoice Overdue',
      message: `Invoice ${invoiceNumber} is ${daysPastDue} days overdue - Follow-up required`,
      type: 'warning' as const,
      module: 'sales'
    })
  },

  inventory: {
    lowStock: (productName: string, currentStock: number, reorderLevel: number) => ({
      title: 'Low Stock Alert',
      message: `${productName} is running low (${currentStock} units remaining, reorder level: ${reorderLevel})`,
      type: 'warning' as const,
      module: 'inventory'
    }),
    outOfStock: (productName: string) => ({
      title: 'Out of Stock Alert',
      message: `${productName} is now out of stock - Immediate attention required`,
      type: 'error' as const,
      module: 'inventory'
    }),
    stockAdjustment: (productName: string, adjustment: number, reason: string) => ({
      title: 'Stock Adjustment Made',
      message: `Stock for ${productName} adjusted by ${adjustment} units - Reason: ${reason}`,
      type: 'info' as const,
      module: 'inventory'
    })
  },

  purchase: {
    orderCreated: (poNumber: string, supplierName: string, amount: number) => ({
      title: 'Purchase Order Created',
      message: `Purchase Order ${poNumber} created for ${supplierName} - Amount: AED ${amount.toLocaleString()}`,
      type: 'info' as const,
      module: 'purchase'
    }),
    orderApproved: (poNumber: string) => ({
      title: 'Purchase Order Approved',
      message: `Purchase Order ${poNumber} has been approved and sent to supplier`,
      type: 'success' as const,
      module: 'purchase'
    }),
    orderDelivered: (poNumber: string, deliveryDate: string) => ({
      title: 'Purchase Order Delivered',
      message: `Purchase Order ${poNumber} has been delivered on ${deliveryDate}`,
      type: 'success' as const,
      module: 'purchase'
    })
  },

  clients: {
    registered: (clientName: string) => ({
      title: 'New Client Registered',
      message: `${clientName} has been successfully registered as a new client`,
      type: 'success' as const,
      module: 'clients'
    }),
    creditLimitExceeded: (clientName: string, creditLimit: number) => ({
      title: 'Client Credit Limit Exceeded',
      message: `${clientName} has exceeded their credit limit of AED ${creditLimit.toLocaleString()}`,
      type: 'warning' as const,
      module: 'clients'
    })
  },

  employees: {
    hired: (employeeName: string, department: string) => ({
      title: 'New Employee Hired',
      message: `${employeeName} has been hired in the ${department} department`,
      type: 'success' as const,
      module: 'employees'
    }),
    terminated: (employeeName: string, terminationDate: string) => ({
      title: 'Employee Terminated',
      message: `${employeeName}'s employment has been terminated effective ${terminationDate}`,
      type: 'info' as const,
      module: 'employees'
    }),
    leaveRequest: (employeeName: string, leaveType: string, startDate: string, endDate: string) => ({
      title: 'Leave Request Submitted',
      message: `${employeeName} has submitted a ${leaveType} request from ${startDate} to ${endDate}`,
      type: 'info' as const,
      module: 'employees'
    })
  }
}