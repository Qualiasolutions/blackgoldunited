/**
 * Novu Server Configuration
 *
 * Server-side notification handling for the BlackGoldUnited ERP system.
 * Provides notification triggers for critical business events.
 */

import { Novu } from '@novu/node';

// Initialize Novu client conditionally
const novu = process.env.NOVU_API_KEY ? new Novu(process.env.NOVU_API_KEY) : null;

/**
 * Notification event types for the ERP system
 */
export enum NotificationEvent {
  // Client Management
  CLIENT_CREATED = 'client-created',
  CLIENT_PAYMENT_OVERDUE = 'client-payment-overdue',
  CLIENT_CREDIT_LIMIT_EXCEEDED = 'client-credit-limit-exceeded',

  // Sales & Revenue
  INVOICE_CREATED = 'invoice-created',
  INVOICE_PAYMENT_RECEIVED = 'invoice-payment-received',
  SALES_TARGET_ACHIEVED = 'sales-target-achieved',

  // Inventory Management
  STOCK_LOW_ALERT = 'stock-low-alert',
  STOCK_OUT_ALERT = 'stock-out-alert',
  INVENTORY_REORDER_NEEDED = 'inventory-reorder-needed',

  // Employee & HR
  EMPLOYEE_ONBOARDED = 'employee-onboarded',
  PAYROLL_GENERATED = 'payroll-generated',
  ATTENDANCE_ANOMALY = 'attendance-anomaly',

  // System & Admin
  SYSTEM_BACKUP_COMPLETED = 'system-backup-completed',
  SYSTEM_ERROR_CRITICAL = 'system-error-critical',
  REPORT_GENERATED = 'report-generated',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Base notification payload interface
 */
interface BaseNotificationPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  priority?: NotificationPriority;
}

/**
 * Client-related notification payload
 */
interface ClientNotificationPayload extends BaseNotificationPayload {
  clientName: string;
  clientId: string;
  amount?: number;
  dueDate?: string;
}

/**
 * Invoice notification payload
 */
interface InvoiceNotificationPayload extends BaseNotificationPayload {
  invoiceNumber: string;
  invoiceId: string;
  amount: number;
  clientName: string;
  dueDate?: string;
}

/**
 * Inventory notification payload
 */
interface InventoryNotificationPayload extends BaseNotificationPayload {
  productName: string;
  productId: string;
  currentStock: number;
  minimumStock: number;
  warehouseName?: string;
}

/**
 * Employee notification payload
 */
interface EmployeeNotificationPayload extends BaseNotificationPayload {
  employeeName: string;
  employeeId: string;
  department?: string;
  amount?: number;
}

/**
 * System notification payload
 */
interface SystemNotificationPayload extends BaseNotificationPayload {
  message: string;
  errorCode?: string;
  module?: string;
}

/**
 * Send client-related notifications
 */
export class ClientNotificationService {
  static async notifyClientCreated(payload: ClientNotificationPayload) {
    if (!novu) {
      console.warn('Novu client not initialized - skipping notification');
      return { success: false, error: 'Notification service not configured' };
    }
    return await novu.trigger(NotificationEvent.CLIENT_CREATED, {
      to: {
        subscriberId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      payload: {
        clientName: payload.clientName,
        clientId: payload.clientId,
        priority: payload.priority || NotificationPriority.MEDIUM,
      }
    });
  }

  static async notifyPaymentOverdue(payload: ClientNotificationPayload) {
    if (!novu) {
      console.warn('Novu client not initialized - skipping notification');
      return { success: false, error: 'Notification service not configured' };
    }
    return await novu.trigger(NotificationEvent.CLIENT_PAYMENT_OVERDUE, {
      to: {
        subscriberId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      payload: {
        clientName: payload.clientName,
        clientId: payload.clientId,
        amount: payload.amount,
        dueDate: payload.dueDate,
        priority: NotificationPriority.HIGH,
      }
    });
  }

  static async notifyCreditLimitExceeded(payload: ClientNotificationPayload) {
    if (!novu) {
      console.warn('Novu client not initialized - skipping notification');
      return { success: false, error: 'Notification service not configured' };
    }
    return await novu.trigger(NotificationEvent.CLIENT_CREDIT_LIMIT_EXCEEDED, {
      to: {
        subscriberId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      payload: {
        clientName: payload.clientName,
        clientId: payload.clientId,
        amount: payload.amount,
        priority: NotificationPriority.CRITICAL,
      }
    });
  }
}

/**
 * Send invoice-related notifications
 */
export class InvoiceNotificationService {
  static async notifyInvoiceCreated(payload: InvoiceNotificationPayload) {
    if (!novu) {
      console.warn('Novu client not initialized - skipping notification');
      return { success: false, error: 'Notification service not configured' };
    }
    return await novu.trigger(NotificationEvent.INVOICE_CREATED, {
      to: {
        subscriberId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      payload: {
        invoiceNumber: payload.invoiceNumber,
        invoiceId: payload.invoiceId,
        amount: payload.amount,
        clientName: payload.clientName,
        dueDate: payload.dueDate,
        priority: payload.priority || NotificationPriority.MEDIUM,
      }
    });
  }

  static async notifyPaymentReceived(payload: InvoiceNotificationPayload) {
    if (!novu) {
      console.warn('Novu client not initialized - skipping notification');
      return { success: false, error: 'Notification service not configured' };
    }
    return await novu.trigger(NotificationEvent.INVOICE_PAYMENT_RECEIVED, {
      to: {
        subscriberId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      payload: {
        invoiceNumber: payload.invoiceNumber,
        invoiceId: payload.invoiceId,
        amount: payload.amount,
        clientName: payload.clientName,
        priority: NotificationPriority.MEDIUM,
      }
    });
  }
}

/**
 * Send inventory-related notifications
 */
export class InventoryNotificationService {
  static async notifyStockLow(payload: InventoryNotificationPayload) {
    if (!novu) {
      console.warn('Novu client not initialized - skipping notification');
      return { success: false, error: 'Notification service not configured' };
    }
    return await novu.trigger(NotificationEvent.STOCK_LOW_ALERT, {
      to: {
        subscriberId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      payload: {
        productName: payload.productName,
        productId: payload.productId,
        currentStock: payload.currentStock,
        minimumStock: payload.minimumStock,
        warehouseName: payload.warehouseName,
        priority: NotificationPriority.HIGH,
      }
    });
  }

  static async notifyStockOut(payload: InventoryNotificationPayload) {
    if (!novu) {
      console.warn('Novu client not initialized - skipping notification');
      return { success: false, error: 'Notification service not configured' };
    }
    return await novu.trigger(NotificationEvent.STOCK_OUT_ALERT, {
      to: {
        subscriberId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      payload: {
        productName: payload.productName,
        productId: payload.productId,
        currentStock: payload.currentStock,
        warehouseName: payload.warehouseName,
        priority: NotificationPriority.CRITICAL,
      }
    });
  }
}

/**
 * Send employee-related notifications
 */
export class EmployeeNotificationService {
  static async notifyEmployeeOnboarded(payload: EmployeeNotificationPayload) {
    if (!novu) {
      console.warn('Novu client not initialized - skipping notification');
      return { success: false, error: 'Notification service not configured' };
    }
    return await novu.trigger(NotificationEvent.EMPLOYEE_ONBOARDED, {
      to: {
        subscriberId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      payload: {
        employeeName: payload.employeeName,
        employeeId: payload.employeeId,
        department: payload.department,
        priority: payload.priority || NotificationPriority.MEDIUM,
      }
    });
  }

  static async notifyPayrollGenerated(payload: EmployeeNotificationPayload) {
    if (!novu) {
      console.warn('Novu client not initialized - skipping notification');
      return { success: false, error: 'Notification service not configured' };
    }
    return await novu.trigger(NotificationEvent.PAYROLL_GENERATED, {
      to: {
        subscriberId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      payload: {
        employeeName: payload.employeeName,
        employeeId: payload.employeeId,
        amount: payload.amount,
        priority: NotificationPriority.MEDIUM,
      }
    });
  }
}

/**
 * Send system-related notifications
 */
export class SystemNotificationService {
  static async notifySystemError(payload: SystemNotificationPayload) {
    if (!novu) {
      console.warn('Novu client not initialized - skipping notification');
      return { success: false, error: 'Notification service not configured' };
    }
    return await novu.trigger(NotificationEvent.SYSTEM_ERROR_CRITICAL, {
      to: {
        subscriberId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      payload: {
        message: payload.message,
        errorCode: payload.errorCode,
        module: payload.module,
        priority: NotificationPriority.CRITICAL,
      }
    });
  }

  static async notifyReportGenerated(payload: SystemNotificationPayload) {
    if (!novu) {
      console.warn('Novu client not initialized - skipping notification');
      return { success: false, error: 'Notification service not configured' };
    }
    return await novu.trigger(NotificationEvent.REPORT_GENERATED, {
      to: {
        subscriberId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      payload: {
        message: payload.message,
        module: payload.module,
        priority: payload.priority || NotificationPriority.LOW,
      }
    });
  }
}

export { novu };