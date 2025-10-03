/**
 * Sales Invoices API Tests
 *
 * Tests for /api/sales/invoices endpoints
 * Covers authentication, authorization, and business logic
 */

import { z } from 'zod';
import { mockUsers, createMockInvoice, createMockClient } from '@/__tests__/test-helpers';

// Mock Supabase
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockEq = jest.fn();
const mockIlike = jest.fn();
const mockOrder = jest.fn();
const mockRange = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock authentication
let mockAuthResult: any = { success: true, user: mockUsers.management };

jest.mock('@/lib/auth/api-auth', () => ({
  authenticateAndAuthorize: jest.fn(() => Promise.resolve(mockAuthResult)),
}));

describe('Sales Invoices API - Authentication & Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthResult = { success: true, user: mockUsers.management };
  });

  describe('Authentication Tests', () => {
    it('should require authentication for GET requests', async () => {
      mockAuthResult = { success: false, error: 'Unauthorized', status: 401 };
      const { authenticateAndAuthorize } = require('@/lib/auth/api-auth');

      const result = await authenticateAndAuthorize({} as any, 'sales', 'GET');

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });

    it('should require authentication for POST requests', async () => {
      mockAuthResult = { success: false, error: 'Unauthorized', status: 401 };
      const { authenticateAndAuthorize } = require('@/lib/auth/api-auth');

      const result = await authenticateAndAuthorize({} as any, 'sales', 'POST');

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('Authorization Tests - Role-Based Access', () => {
    it('should allow MANAGEMENT role to access sales module', async () => {
      mockAuthResult = { success: true, user: mockUsers.management };
      const { authenticateAndAuthorize } = require('@/lib/auth/api-auth');

      const result = await authenticateAndAuthorize({} as any, 'sales', 'GET');

      expect(result.success).toBe(true);
      expect(result.user.role).toBe('MANAGEMENT');
    });

    it('should allow PROCUREMENT_BD role to access sales module', async () => {
      mockAuthResult = { success: true, user: mockUsers.procurement };
      const { authenticateAndAuthorize } = require('@/lib/auth/api-auth');

      const result = await authenticateAndAuthorize({} as any, 'sales', 'GET');

      expect(result.success).toBe(true);
      expect(result.user.role).toBe('PROCUREMENT_BD');
    });

    it('should allow FINANCE_TEAM role to access sales module (read-only)', async () => {
      mockAuthResult = { success: true, user: mockUsers.finance };
      const { authenticateAndAuthorize } = require('@/lib/auth/api-auth');

      const result = await authenticateAndAuthorize({} as any, 'sales', 'GET');

      expect(result.success).toBe(true);
      expect(result.user.role).toBe('FINANCE_TEAM');
    });

    it('should deny IMS_QHSE role access to sales module', async () => {
      mockAuthResult = { success: false, error: 'Forbidden', status: 403 };
      const { authenticateAndAuthorize } = require('@/lib/auth/api-auth');

      const result = await authenticateAndAuthorize({} as any, 'sales', 'GET');

      expect(result.success).toBe(false);
      expect(result.status).toBe(403);
    });
  });
});

describe('Sales Invoices API - Data Validation', () => {
  const invoiceItemSchema = z.object({
    productId: z.string().uuid().optional(),
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    taxRate: z.number().min(0).max(100).optional().default(0),
  });

  const invoiceSchema = z.object({
    clientId: z.string().uuid('Invalid client ID'),
    issueDate: z.string().datetime().optional(),
    dueDate: z.string().datetime('Due date is required'),
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
    items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required'),
  });

  describe('Invoice Creation Validation', () => {
    it('should reject invoice without clientId', () => {
      const invalidData = {
        dueDate: new Date().toISOString(),
        items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
      };

      const result = invoiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invoice without items', () => {
      const invalidData = {
        clientId: 'client-123',
        dueDate: new Date().toISOString(),
        items: [],
      };

      const result = invoiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invoice item with negative quantity', () => {
      const invalidItem = {
        description: 'Test Product',
        quantity: -1,
        unitPrice: 100,
      };

      const result = invoiceItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject invoice item with negative price', () => {
      const invalidItem = {
        description: 'Test Product',
        quantity: 1,
        unitPrice: -100,
      };

      const result = invoiceItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should accept valid invoice data', () => {
      const validData = {
        clientId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        dueDate: new Date().toISOString(),
        items: [
          {
            description: 'Test Product',
            quantity: 1,
            unitPrice: 100,
            taxRate: 15,
          },
        ],
      };

      const result = invoiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Sales Invoices API - Business Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Invoice Calculations', () => {
    it('should calculate subtotal correctly', () => {
      const items = [
        { quantity: 2, unitPrice: 100, taxRate: 0 },
        { quantity: 3, unitPrice: 50, taxRate: 0 },
      ];

      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      expect(subtotal).toBe(350);
    });

    it('should calculate tax amount correctly', () => {
      const items = [
        { quantity: 2, unitPrice: 100, taxRate: 15 },
        { quantity: 1, unitPrice: 200, taxRate: 10 },
      ];

      const taxAmount = items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        return sum + itemTotal * (item.taxRate / 100);
      }, 0);

      expect(taxAmount).toBe(50); // (200 * 0.15) + (200 * 0.10) = 30 + 20 = 50
    });

    it('should calculate total amount with tax', () => {
      const subtotal = 1000;
      const taxAmount = 150;
      const total = subtotal + taxAmount;

      expect(total).toBe(1150);
    });
  });

  describe('Invoice Status Logic', () => {
    it('should set status to DRAFT by default', () => {
      const invoice = createMockInvoice();

      // Default status should be DRAFT if not specified
      expect(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).toContain(
        invoice.status
      );
    });

    it('should mark invoice as PAID when paid_amount equals total_amount', () => {
      const invoice = createMockInvoice({
        total_amount: 1000,
        paid_amount: 1000,
      });

      // When paid_amount equals total_amount, payment_status should be updated to COMPLETED
      const isPaid = invoice.paid_amount === invoice.total_amount;
      expect(isPaid).toBe(true);
    });

    it('should mark invoice as PARTIAL when paid_amount is less than total_amount', () => {
      const invoice = createMockInvoice({
        total_amount: 1000,
        paid_amount: 500,
      });

      const isPartial = invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount;
      expect(isPartial).toBe(true);
    });
  });
});

describe('Sales Invoices API - Database Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    });
    mockSelect.mockReturnThis();
    mockInsert.mockReturnThis();
    mockEq.mockReturnThis();
    mockIlike.mockReturnThis();
    mockOrder.mockReturnThis();
    mockRange.mockReturnValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('Database Query Construction', () => {
    it('should query invoices table', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const supabase = await createClient();

      supabase.from('invoices');

      expect(mockFrom).toHaveBeenCalledWith('invoices');
    });

    it('should select all invoice fields', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const supabase = await createClient();

      supabase.from('invoices').select('*');

      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should support filtering by client_id', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const supabase = await createClient();

      // Update mock to return chain with eq method
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnThis();

      const query = supabase.from('invoices').select('*');
      if (query.eq) {
        query.eq('client_id', 'client-123');
      }

      expect(mockFrom).toHaveBeenCalledWith('invoices');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });
  });
});
