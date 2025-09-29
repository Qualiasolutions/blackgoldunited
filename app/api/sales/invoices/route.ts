/**
 * Sales Invoices API Routes - Main Collection Endpoints
 *
 * This file implements the core CRUD operations for the Sales/Invoices module.
 * It provides GET (list) and POST (create) endpoints for invoice management.
 *
 * Security:
 * - All endpoints require authentication
 * - Role-based access control enforced
 * - Input validation via Zod schemas
 * - Comprehensive error handling
 *
 * Endpoints:
 * - GET /api/sales/invoices - List invoices with search/pagination/filtering
 * - POST /api/sales/invoices - Create new invoice with line items
 *
 * @author BlackGoldUnited ERP Team
 * @version 2.0
 * @since Week 4 - Sales Module Foundation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';

/**
 * Invoice item validation schema for line items
 */
const invoiceItemSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  taxRate: z.number().min(0).max(100).optional().default(0),
});

/**
 * Invoice validation schema for creating new invoices
 * Matches the Supabase database schema exactly
 */
const invoiceSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime('Due date is required'),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional().default('DRAFT'),
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'COMPLETED', 'FAILED', 'REFUNDED']).optional().default('PENDING'),
  subtotal: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional().default(0),
  totalAmount: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  isRecurring: z.boolean().optional().default(false),
  recurringPeriod: z.number().optional(),
  nextRecurringDate: z.string().datetime().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required'),
});

/**
 * Partial schema for invoice updates (all fields optional)
 */
const invoiceUpdateSchema = invoiceSchema.partial().extend({
  items: z.array(invoiceItemSchema).optional(),
});

/**
 * Search and pagination parameters schema
 * Supports filtering, sorting, and pagination for invoice listings
 */
const searchSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  clientId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  sortBy: z.string().optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/sales/invoices
 *
 * List all invoices with search, filtering, sorting, and pagination support.
 * Implements role-based access control - different roles have different access levels.
 *
 * Query Parameters:
 * - query: Search term (searches invoice number, notes, client name)
 * - status: Filter by invoice status (DRAFT, SENT, PAID, etc.)
 * - paymentStatus: Filter by payment status (PENDING, PARTIAL, COMPLETED, etc.)
 * - clientId: Filter by specific client
 * - dateFrom/dateTo: Filter by date range
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 10)
 * - sortBy: Field to sort by (default: createdAt)
 * - sortOrder: Sort direction asc/desc (default: desc)
 *
 * Access Control:
 * - MANAGEMENT: Full access ✅
 * - PROCUREMENT_BD: Full access ✅
 * - FINANCE_TEAM: Read-only access ✅
 * - ADMIN_HR: Read-only access ✅
 * - IMS_QHSE: No access ❌ (403 Forbidden)
 *
 * @returns JSON response with invoices array and pagination metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'sales', 'GET');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const validatedParams = searchSchema.parse(Object.fromEntries(searchParams.entries()));

    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients!inner(id, company_name, contact_person, email),
        items:invoice_items(*)
      `, { count: 'exact' })
      .is('deleted_at', null);

    // Apply search filter
    if (validatedParams.query) {
      query = query.or(`invoice_number.ilike.%${validatedParams.query}%,notes.ilike.%${validatedParams.query}%`);
    }

    // Apply status filters
    if (validatedParams.status) {
      query = query.eq('status', validatedParams.status);
    }

    if (validatedParams.paymentStatus) {
      query = query.eq('payment_status', validatedParams.paymentStatus);
    }

    if (validatedParams.clientId) {
      query = query.eq('client_id', validatedParams.clientId);
    }

    // Apply date range filters
    if (validatedParams.dateFrom) {
      query = query.gte('issue_date', validatedParams.dateFrom);
    }
    if (validatedParams.dateTo) {
      query = query.lte('issue_date', validatedParams.dateTo);
    }

    // Apply sorting
    query = query.order(validatedParams.sortBy, { ascending: validatedParams.sortOrder === 'asc' });

    // Apply pagination
    const from = (validatedParams.page - 1) * validatedParams.limit;
    const to = from + validatedParams.limit - 1;
    query = query.range(from, to);

    const { data: invoices, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: invoices || [],
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / validatedParams.limit)
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generates the next invoice number in sequence
 * Format: INV-YYYYMMDD-NNNN (e.g., INV-20250924-0001)
 */
async function generateInvoiceNumber(supabase: any): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${today}`;

  // Get the highest number for today
  const { data: lastInvoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;
  if (lastInvoice?.invoice_number) {
    const lastNumStr = lastInvoice.invoice_number.split('-').pop();
    nextNumber = (parseInt(lastNumStr) || 0) + 1;
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * POST /api/sales/invoices
 *
 * Create a new invoice with line items and comprehensive validation.
 * Only users with create permissions can access this endpoint.
 *
 * Required Fields:
 * - clientId: UUID of the client
 * - dueDate: Due date for the invoice
 * - items: Array of invoice line items (at least one required)
 *
 * Access Control:
 * - MANAGEMENT: Create allowed ✅
 * - PROCUREMENT_BD: Create allowed ✅
 * - FINANCE_TEAM: Create denied ❌ (403 Forbidden)
 * - ADMIN_HR: Create denied ❌ (403 Forbidden)
 * - IMS_QHSE: No access ❌ (403 Forbidden)
 *
 * @returns JSON response with created invoice data or validation errors
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'sales', 'POST');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = invoiceSchema.parse(body);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(supabase);

    // Calculate totals from items
    const subtotal = validatedData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const taxAmount = validatedData.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (item.taxRate / 100);
      return sum + itemTax;
    }, 0);

    const totalAmount = subtotal + taxAmount - validatedData.discountAmount;

    // Get user ID for audit trail
    const { data: { user } } = await supabase.auth.getUser();

    // Insert new invoice - mapping camelCase to snake_case for database
    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        invoice_number: invoiceNumber,
        client_id: validatedData.clientId,
        issue_date: validatedData.issueDate || new Date().toISOString().split('T')[0],
        due_date: validatedData.dueDate.split('T')[0],
        status: validatedData.status,
        payment_status: validatedData.paymentStatus,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: validatedData.discountAmount,
        total_amount: totalAmount,
        paid_amount: validatedData.paidAmount,
        notes: validatedData.notes,
        terms_and_conditions: validatedData.terms,
        created_by: user?.id,
      }])
      .select()
      .single();

    if (invoiceError) {
      console.error('Database error:', invoiceError);
      if (invoiceError.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'An invoice with this number already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // Insert invoice items - mapping camelCase to snake_case for database
    const invoiceItems = validatedData.items.map(item => ({
      invoice_id: newInvoice.id,
      product_id: item.productId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.quantity * item.unitPrice,
      tax_rate: item.taxRate,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', newInvoice.id);
      console.error('Database error:', itemsError);
      return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 });
    }

    // Fetch the complete invoice with client and items
    const { data: completeInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients!inner(id, company_name, contact_person, email),
        items:invoice_items(*)
      `)
      .eq('id', newInvoice.id)
      .single();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch created invoice' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: completeInvoice,
      message: 'Invoice created successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}