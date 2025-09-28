/**
 * Inngest Client Functions
 *
 * Background functions for client management in the BlackGoldUnited ERP system.
 */

import { inngest, InngestEvent, type ClientCreatedPayload, type InvoiceGeneratedPayload, type PaymentReceivedPayload, type EmailNotificationPayload } from '../client';
import { ClientEmailService } from '@/lib/resend/email-service';
import { ClientNotificationService } from '@/lib/novu/server';

/**
 * Process new client creation
 */
export const processClientCreated = inngest.createFunction(
  { id: 'process-client-created' },
  { event: InngestEvent.CLIENT_CREATED },
  async ({ event, step }) => {
    const payload = event.data as ClientCreatedPayload;

    // Step 1: Send welcome email to client
    await step.run('send-welcome-email', async () => {
      await ClientEmailService.sendInvoiceCreated({
        to: payload.email,
        clientName: payload.clientName,
        companyName: payload.company,
        invoiceNumber: '', // Welcome email doesn't need invoice
        amount: 0,
      });
    });

    // Step 2: Send notification to sales team
    await step.run('notify-sales-team', async () => {
      await ClientNotificationService.notifyClientCreated({
        userId: payload.createdBy,
        email: payload.email,
        firstName: 'Sales',
        lastName: 'Team',
        clientName: payload.clientName,
        clientId: payload.clientId,
      });
    });

    // Step 3: Update CRM metrics (future implementation)
    await step.run('update-crm-metrics', async () => {
      // TODO: Update client acquisition metrics
      console.log(`Client ${payload.clientName} added to CRM metrics`);
    });

    return { success: true, clientId: payload.clientId };
  }
);

/**
 * Process invoice generation
 */
export const processInvoiceGenerated = inngest.createFunction(
  { id: 'process-invoice-generated' },
  { event: InngestEvent.INVOICE_GENERATED },
  async ({ event, step }) => {
    const payload = event.data as InvoiceGeneratedPayload;

    // Step 1: Send invoice email to client
    await step.run('send-invoice-email', async () => {
      // Get client details from database
      // For now, we'll use placeholder data
      await ClientEmailService.sendInvoiceCreated({
        to: 'info@blackgoldunited.com', // TODO: Get from database
        clientName: 'Client Name', // TODO: Get from database
        invoiceNumber: payload.invoiceNumber,
        amount: payload.amount,
        dueDate: payload.dueDate,
        invoiceUrl: `/invoices/${payload.invoiceId}`,
        paymentUrl: `/payments/${payload.invoiceId}`,
      });
    });

    // Step 2: Schedule payment reminder
    await step.run('schedule-payment-reminder', async () => {
      const reminderDate = new Date(payload.dueDate);
      reminderDate.setDate(reminderDate.getDate() - 3); // 3 days before due date

      await inngest.send({
        name: InngestEvent.PAYMENT_OVERDUE,
        data: {
          invoiceId: payload.invoiceId,
          invoiceNumber: payload.invoiceNumber,
          amount: payload.amount,
          dueDate: payload.dueDate,
        },
        ts: reminderDate.getTime(),
      });
    });

    // Step 3: Update financial metrics
    await step.run('update-financial-metrics', async () => {
      // TODO: Update revenue projections and financial metrics
      console.log(`Invoice ${payload.invoiceNumber} added to financial tracking`);
    });

    return { success: true, invoiceId: payload.invoiceId };
  }
);

/**
 * Process payment received
 */
export const processPaymentReceived = inngest.createFunction(
  { id: 'process-payment-received' },
  { event: InngestEvent.PAYMENT_RECEIVED },
  async ({ event, step }) => {
    const payload = event.data as PaymentReceivedPayload;

    // Step 1: Send payment confirmation email
    await step.run('send-payment-confirmation', async () => {
      await ClientEmailService.sendInvoiceCreated({
        to: 'info@blackgoldunited.com', // TODO: Get from database
        clientName: 'Client Name', // TODO: Get from database
        invoiceNumber: `INV-${payload.invoiceId}`, // TODO: Get actual invoice number
        amount: payload.amount,
      });
    });

    // Step 2: Update account receivables
    await step.run('update-receivables', async () => {
      // TODO: Update account receivables and cash flow
      console.log(`Payment of $${payload.amount} processed for invoice ${payload.invoiceId}`);
    });

    // Step 3: Check for early payment discounts
    await step.run('process-early-payment-discount', async () => {
      // TODO: Calculate and apply early payment discounts if applicable
      console.log(`Checking early payment discount for payment ${payload.paymentId}`);
    });

    return { success: true, paymentId: payload.paymentId };
  }
);

/**
 * Process overdue payment notifications
 */
export const processPaymentOverdue = inngest.createFunction(
  { id: 'process-payment-overdue' },
  { event: InngestEvent.PAYMENT_OVERDUE },
  async ({ event, step }) => {
    const payload = event.data as any; // TODO: Define proper type

    // Step 1: Send overdue notice
    await step.run('send-overdue-notice', async () => {
      await ClientEmailService.sendPaymentReminder({
        to: 'info@blackgoldunited.com', // TODO: Get from database
        clientName: 'Client Name', // TODO: Get from database
        invoiceNumber: payload.invoiceNumber,
        amount: payload.amount,
        dueDate: payload.dueDate,
        paymentUrl: `/payments/${payload.invoiceId}`,
      });
    });

    // Step 2: Update credit status
    await step.run('update-credit-status', async () => {
      // TODO: Update client credit status and limits
      console.log(`Updated credit status for overdue invoice ${payload.invoiceNumber}`);
    });

    // Step 3: Schedule follow-up actions
    await step.run('schedule-follow-up', async () => {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 7); // 7 days later

      // TODO: Schedule additional follow-up actions
      console.log(`Scheduled follow-up for ${followUpDate.toISOString()}`);
    });

    return { success: true, invoiceNumber: payload.invoiceNumber };
  }
);