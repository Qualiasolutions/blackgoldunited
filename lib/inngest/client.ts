/**
 * Inngest Client Configuration
 *
 * Background function orchestration for the BlackGoldUnited ERP system.
 * Handles async processing, scheduled tasks, and workflow automation.
 */

import { Inngest } from 'inngest';

// Initialize Inngest client
export const inngest = new Inngest({
  id: 'blackgoldunited-erp',
  name: 'BlackGoldUnited ERP',
  retries: 3,
});

/**
 * Event types for background processing
 */
export enum InngestEvent {
  // Client & Sales Events
  CLIENT_CREATED = 'client/created',
  INVOICE_GENERATED = 'invoice/generated',
  PAYMENT_RECEIVED = 'invoice/payment.received',
  PAYMENT_OVERDUE = 'invoice/payment.overdue',

  // Employee & HR Events
  EMPLOYEE_ONBOARDED = 'employee/onboarded',
  PAYROLL_PROCESS = 'payroll/process',
  ATTENDANCE_SYNC = 'attendance/sync',
  LEAVE_REQUEST = 'leave/request.submitted',

  // Inventory Events
  STOCK_CHECK = 'inventory/stock.check',
  REORDER_TRIGGER = 'inventory/reorder.trigger',
  GOODS_RECEIVED = 'inventory/goods.received',

  // System Events
  DAILY_BACKUP = 'system/backup.daily',
  MONTHLY_REPORTS = 'system/reports.monthly',
  CLEANUP_LOGS = 'system/cleanup.logs',
  SYNC_EXTERNAL_DATA = 'system/sync.external',

  // Notification Events
  SEND_EMAIL = 'notification/email.send',
  SEND_BULK_EMAILS = 'notification/email.bulk',
  PROCESS_NOTIFICATIONS = 'notification/process',
}

/**
 * Event payload types
 */
export interface ClientCreatedPayload {
  clientId: string;
  clientName: string;
  email: string;
  company?: string;
  createdBy: string;
}

export interface InvoiceGeneratedPayload {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  amount: number;
  dueDate: string;
  createdBy: string;
}

export interface PaymentReceivedPayload {
  paymentId: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: string;
}

export interface EmployeeOnboardedPayload {
  employeeId: string;
  employeeName: string;
  email: string;
  department: string;
  designation: string;
  hireDate: string;
}

export interface PayrollProcessPayload {
  payrollId: string;
  month: string;
  year: number;
  employeeIds: string[];
  processedBy: string;
}

export interface StockCheckPayload {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  warehouseId: string;
}

export interface EmailNotificationPayload {
  to: string | string[];
  template: string;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface BulkEmailPayload {
  recipients: Array<{
    email: string;
    data: Record<string, any>;
  }>;
  template: string;
  batchSize?: number;
}

export interface SystemBackupPayload {
  backupType: 'daily' | 'weekly' | 'monthly';
  includeFiles: boolean;
  retention: number;
}

export interface MonthlyReportsPayload {
  reportTypes: string[];
  month: string;
  year: number;
  recipients: string[];
}