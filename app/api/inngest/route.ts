/**
 * Inngest API Route
 *
 * Serves the Inngest functions and handles webhooks for the BlackGoldUnited ERP system.
 */

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';

// Import all function modules
import {
  processClientCreated,
  processInvoiceGenerated,
  processPaymentReceived,
  processPaymentOverdue,
} from '@/lib/inngest/functions/client-functions';

import {
  processDailyBackup,
  processMonthlyReports,
  processLogCleanup,
  processBulkEmails,
} from '@/lib/inngest/functions/system-functions';

// Create the handler for the Inngest API route
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Client management functions
    processClientCreated,
    processInvoiceGenerated,
    processPaymentReceived,
    processPaymentOverdue,

    // System maintenance functions
    processDailyBackup,
    processMonthlyReports,
    processLogCleanup,
    processBulkEmails,
  ],
});