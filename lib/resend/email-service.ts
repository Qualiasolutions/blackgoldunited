/**
 * Resend Email Service
 *
 * Centralized email delivery service for the BlackGoldUnited ERP system.
 * Handles all transactional emails including notifications, invoices, and system alerts.
 */

import { Resend } from 'resend';

// Initialize Resend client conditionally
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Email template types for the ERP system
 */
export enum EmailTemplate {
  // Authentication & Account
  WELCOME_EMAIL = 'welcome-email',
  PASSWORD_RESET = 'password-reset',
  ACCOUNT_ACTIVATION = 'account-activation',
  LOGIN_ALERT = 'login-alert',

  // Client Management
  CLIENT_WELCOME = 'client-welcome',
  INVOICE_CREATED = 'invoice-created',
  PAYMENT_REMINDER = 'payment-reminder',
  PAYMENT_OVERDUE = 'payment-overdue',
  PAYMENT_RECEIVED = 'payment-received',

  // Employee & HR
  EMPLOYEE_WELCOME = 'employee-welcome',
  PAYSLIP_GENERATED = 'payslip-generated',
  LEAVE_REQUEST_SUBMITTED = 'leave-request-submitted',
  LEAVE_REQUEST_APPROVED = 'leave-request-approved',

  // Inventory & Stock
  STOCK_ALERT_LOW = 'stock-alert-low',
  STOCK_ALERT_OUT = 'stock-alert-out',
  PURCHASE_ORDER_CREATED = 'purchase-order-created',
  GOODS_RECEIVED = 'goods-received',

  // Reports & Analytics
  MONTHLY_REPORT = 'monthly-report',
  SYSTEM_BACKUP_COMPLETE = 'system-backup-complete',
  SYSTEM_ERROR_ALERT = 'system-error-alert',
}

/**
 * Base email payload interface
 */
interface BaseEmailPayload {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

/**
 * Authentication email payloads
 */
interface AuthEmailPayload extends BaseEmailPayload {
  userName: string;
  resetUrl?: string;
  activationUrl?: string;
  loginTime?: string;
  ipAddress?: string;
}

/**
 * Client email payloads
 */
interface ClientEmailPayload extends BaseEmailPayload {
  clientName: string;
  companyName?: string;
  invoiceNumber?: string;
  amount?: number;
  dueDate?: string;
  paymentUrl?: string;
  invoiceUrl?: string;
}

/**
 * Employee email payloads
 */
interface EmployeeEmailPayload extends BaseEmailPayload {
  employeeName: string;
  employeeId: string;
  department?: string;
  salary?: number;
  payslipUrl?: string;
  leaveType?: string;
  leaveDates?: string;
}

/**
 * Inventory email payloads
 */
interface InventoryEmailPayload extends BaseEmailPayload {
  productName: string;
  currentStock: number;
  minimumStock?: number;
  warehouseName?: string;
  supplierName?: string;
  orderNumber?: string;
}

/**
 * System email payloads
 */
interface SystemEmailPayload extends BaseEmailPayload {
  reportType?: string;
  reportUrl?: string;
  errorMessage?: string;
  errorCode?: string;
  systemModule?: string;
}

/**
 * Authentication Email Service
 */
export class AuthEmailService {
  static async sendWelcomeEmail(payload: AuthEmailPayload) {
    if (!resend) {
      console.warn('Resend client not initialized - skipping email send');
      return { success: false, error: 'Email service not configured' };
    }
    return await resend.emails.send({
      from: 'BlackGoldUnited ERP <info@blackgoldunited.com>',
      to: payload.to,
      subject: 'Welcome to BlackGoldUnited ERP System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Welcome to BlackGoldUnited ERP, ${payload.userName}!</h2>
          <p>Your account has been successfully created and activated.</p>
          <p>You can now access all the ERP modules and features available to your role.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Quick Start Guide:</h3>
            <ul>
              <li>Access your dashboard for an overview of business metrics</li>
              <li>Configure your profile and notification preferences</li>
              <li>Explore the modules relevant to your role</li>
              <li>Contact support if you need assistance</li>
            </ul>
          </div>
          <p>Best regards,<br>BlackGoldUnited ERP Team</p>
        </div>
      `,
    });
  }

  static async sendPasswordResetEmail(payload: AuthEmailPayload) {
    if (!resend) {
      console.warn('Resend client not initialized - skipping email send');
      return { success: false, error: 'Email service not configured' };
    }
    return await resend.emails.send({
      from: 'BlackGoldUnited ERP <info@blackgoldunited.com>',
      to: payload.to,
      subject: 'Password Reset Request - BlackGoldUnited ERP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Password Reset Request</h2>
          <p>Hi ${payload.userName},</p>
          <p>We received a request to reset your password for your BlackGoldUnited ERP account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${payload.resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>BlackGoldUnited ERP Team</p>
        </div>
      `,
    });
  }
}

/**
 * Client Email Service
 */
export class ClientEmailService {
  static async sendInvoiceCreated(payload: ClientEmailPayload) {
    if (!resend) {
      console.warn('Resend client not initialized - skipping email send');
      return { success: false, error: 'Email service not configured' };
    }
    return await resend.emails.send({
      from: 'BlackGoldUnited ERP <info@blackgoldunited.com>',
      to: payload.to,
      subject: `Invoice ${payload.invoiceNumber} - BlackGoldUnited`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">New Invoice Generated</h2>
          <p>Dear ${payload.clientName},</p>
          <p>A new invoice has been generated for your account.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Invoice Details:</h3>
            <p><strong>Invoice Number:</strong> ${payload.invoiceNumber}</p>
            <p><strong>Amount:</strong> $${payload.amount?.toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${payload.dueDate}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${payload.invoiceUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">View Invoice</a>
            <a href="${payload.paymentUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Now</a>
          </div>
          <p>Thank you for your business!</p>
          <p>Best regards,<br>BlackGoldUnited Team</p>
        </div>
      `,
    });
  }

  static async sendPaymentReminder(payload: ClientEmailPayload) {
    if (!resend) {
      console.warn('Resend client not initialized - skipping email send');
      return { success: false, error: 'Email service not configured' };
    }
    return await resend.emails.send({
      from: 'BlackGoldUnited ERP <info@blackgoldunited.com>',
      to: payload.to,
      subject: `Payment Reminder - Invoice ${payload.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Payment Reminder</h2>
          <p>Dear ${payload.clientName},</p>
          <p>This is a friendly reminder that your invoice payment is approaching its due date.</p>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">Invoice Details:</h3>
            <p><strong>Invoice Number:</strong> ${payload.invoiceNumber}</p>
            <p><strong>Amount Due:</strong> $${payload.amount?.toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${payload.dueDate}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${payload.paymentUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Now</a>
          </div>
          <p>Please ensure payment is made by the due date to avoid any late fees.</p>
          <p>Best regards,<br>BlackGoldUnited Team</p>
        </div>
      `,
    });
  }
}

/**
 * Employee Email Service
 */
export class EmployeeEmailService {
  static async sendWelcomeEmail(payload: EmployeeEmailPayload) {
    if (!resend) {
      console.warn('Resend client not initialized - skipping email send');
      return { success: false, error: 'Email service not configured' };
    }
    return await resend.emails.send({
      from: 'BlackGoldUnited ERP <info@blackgoldunited.com>',
      to: payload.to,
      subject: 'Welcome to BlackGoldUnited - Employee Onboarding',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Welcome to BlackGoldUnited, ${payload.employeeName}!</h2>
          <p>We're excited to have you join our team in the ${payload.department} department.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Your Details:</h3>
            <p><strong>Employee ID:</strong> ${payload.employeeId}</p>
            <p><strong>Department:</strong> ${payload.department}</p>
          </div>
          <p>Your ERP system access has been configured and you can now:</p>
          <ul>
            <li>View your attendance and leave balances</li>
            <li>Access payslips and tax documents</li>
            <li>Submit expense reports and reimbursements</li>
            <li>Update your personal information</li>
          </ul>
          <p>Welcome aboard!</p>
          <p>Best regards,<br>BlackGoldUnited HR Team</p>
        </div>
      `,
    });
  }

  static async sendPayslipGenerated(payload: EmployeeEmailPayload) {
    if (!resend) {
      console.warn('Resend client not initialized - skipping email send');
      return { success: false, error: 'Email service not configured' };
    }
    return await resend.emails.send({
      from: 'BlackGoldUnited ERP <info@blackgoldunited.com>',
      to: payload.to,
      subject: 'Payslip Generated - BlackGoldUnited',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Payslip Available</h2>
          <p>Dear ${payload.employeeName},</p>
          <p>Your payslip for this period has been generated and is now available.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Payslip Details:</h3>
            <p><strong>Employee ID:</strong> ${payload.employeeId}</p>
            <p><strong>Net Salary:</strong> $${payload.salary?.toFixed(2)}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${payload.payslipUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Payslip</a>
          </div>
          <p>Please keep this document for your records.</p>
          <p>Best regards,<br>BlackGoldUnited Payroll Team</p>
        </div>
      `,
    });
  }
}

/**
 * System Email Service
 */
export class SystemEmailService {
  static async sendCriticalErrorAlert(payload: SystemEmailPayload) {
    if (!resend) {
      console.warn('Resend client not initialized - skipping email send');
      return { success: false, error: 'Email service not configured' };
    }
    return await resend.emails.send({
      from: 'BlackGoldUnited ERP <info@blackgoldunited.com>',
      to: payload.to,
      subject: `CRITICAL: System Error in ${payload.systemModule}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Critical System Error</h2>
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #991b1b; margin-top: 0;">Error Details:</h3>
            <p><strong>Module:</strong> ${payload.systemModule}</p>
            <p><strong>Error Code:</strong> ${payload.errorCode}</p>
            <p><strong>Message:</strong> ${payload.errorMessage}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>
          <p><strong>Immediate action may be required.</strong></p>
          <p>Please investigate this error promptly to ensure system stability.</p>
          <p>BlackGoldUnited ERP System</p>
        </div>
      `,
    });
  }

  static async sendMonthlyReport(payload: SystemEmailPayload) {
    if (!resend) {
      console.warn('Resend client not initialized - skipping email send');
      return { success: false, error: 'Email service not configured' };
    }
    return await resend.emails.send({
      from: 'BlackGoldUnited ERP <info@blackgoldunited.com>',
      to: payload.to,
      subject: `Monthly ${payload.reportType} Report - BlackGoldUnited`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Monthly ${payload.reportType} Report</h2>
          <p>Your monthly ${payload.reportType?.toLowerCase()} report has been generated and is ready for review.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${payload.reportUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Report</a>
          </div>
          <p>This report contains insights and analytics for the current month.</p>
          <p>Best regards,<br>BlackGoldUnited Analytics Team</p>
        </div>
      `,
    });
  }
}

// Export the main Resend client for custom email operations
export { resend };