/**
 * Sales Invoices API Routes - Individual Invoice Endpoints
 *
 * This file implements individual invoice operations (GET, PUT, DELETE).
 * Follows the same patterns as the clients API for consistency.
 *
 * Security:
 * - All endpoints require authentication
 * - Role-based access control enforced
 * - Input validation via Zod schemas
 * - Comprehensive error handling
 *
 * Endpoints:
 * - GET /api/sales/invoices/[id] - Get single invoice with items
 * - PUT /api/sales/invoices/[id] - Update invoice and items
 * - DELETE /api/sales/invoices/[id] - Soft delete invoice
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
  id: z.string().uuid().optional(), // For existing items
  productId: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  taxRate: z.number().min(0).max(100).optional().default(0),
});

/**
 * Invoice validation schema for updates (all fields optional except items which is handled separately)
 */
const invoiceUpdateSchema = z.object({
  clientId: z.string().uuid().optional(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  discountAmount: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPeriod: z.number().optional(),
  nextRecurringDate: z.string().datetime().optional(),
  items: z.array(invoiceItemSchema).optional(),
});

/**
 * GET /api/sales/invoices/[id]
 *
 * Get a single invoice by ID with all related data including client info and line items.
 * Implements role-based access control.
 *
 * Access Control: Same as GET /api/sales/invoices
 *
 * @returns JSON response with invoice data including client and items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'sales', 'GET');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    const { id } = await params;

    // Validate ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID format' }, { status: 400 });
    }

    // Fetch invoice with client and items
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients!inner(id, company_name, contact_person, email, address_line_1, city, state, country),
        items:invoice_items(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/sales/invoices/[id]
 *
 * Update an existing invoice including its line items.
 * Recalculates totals automatically based on updated items.
 *
 * Access Control:
 * - MANAGEMENT: Update allowed ✅
 * - PROCUREMENT_BD: Update allowed ✅
 * - FINANCE_TEAM: Update denied ❌ (403 Forbidden)
 * - ADMIN_HR: Update denied ❌ (403 Forbidden)
 * - IMS_QHSE: No access ❌ (403 Forbidden)
 *
 * @returns JSON response with updated invoice data
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'sales', 'PUT');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    const { id } = await params;

    // Validate ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID format' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = invoiceUpdateSchema.parse(body);

    // Check if invoice exists first
    const { data: existingInvoice, error: checkError } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      console.error('Database error:', checkError);
      return NextResponse.json({ error: 'Failed to check invoice existence' }, { status: 500 });
    }

    // Prevent modification of paid invoices (business rule)
    if (existingInvoice.status === 'PAID' && validatedData.status !== 'PAID') {
      return NextResponse.json({
        error: 'Cannot modify a paid invoice except to update payment status'
      }, { status: 409 });
    }

    // Handle items update if provided
    let updatedTotals = {};
    if (validatedData.items) {
      // Delete existing items
      const { error: deleteItemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (deleteItemsError) {
        console.error('Database error:', deleteItemsError);
        return NextResponse.json({ error: 'Failed to update invoice items' }, { status: 500 });
      }

      // Insert new items
      const invoiceItems = validatedData.items.map(item => ({
        invoice_id: id,
        product_id: item.productId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.quantity * item.unitPrice,
        tax_rate: item.taxRate,
      }));

      const { error: insertItemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (insertItemsError) {
        console.error('Database error:', insertItemsError);
        return NextResponse.json({ error: 'Failed to update invoice items' }, { status: 500 });
      }

      // Calculate new totals
      const subtotal = validatedData.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);

      const taxAmount = validatedData.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemTax = itemTotal * (item.taxRate / 100);
        return sum + itemTax;
      }, 0);

      const total_amount = subtotal + taxAmount - (validatedData.discountAmount || 0);

      updatedTotals = {
        subtotal,
        tax_amount: taxAmount,
        total_amount,
      };
    }

    // Update invoice
    const { data: updatedInvoice, error } = await supabase
      .from('invoices')
      .update({
        ...validatedData,
        ...updatedTotals,
        updated_at: new Date().toISOString(),
        items: undefined, // Remove items from the update data
      })
      .eq('id', id)
      .select(`
        *,
        client:clients!inner(id, company_name, contact_person, email, address_line_1, city, state, country),
        items:invoice_items(*)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'An invoice with this number already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice updated successfully'
    });

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

/**
 * DELETE /api/sales/invoices/[id]
 *
 * Soft delete an invoice by setting deletedAt timestamp.
 * This preserves data integrity and audit trail.
 *
 * Access Control:
 * - MANAGEMENT: Delete allowed ✅
 * - PROCUREMENT_BD: Delete allowed ✅
 * - FINANCE_TEAM: Delete denied ❌ (403 Forbidden)
 * - ADMIN_HR: Delete denied ❌ (403 Forbidden)
 * - IMS_QHSE: No access ❌ (403 Forbidden)
 *
 * @returns JSON response confirming deletion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'sales', 'DELETE');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    const { id } = await params;

    // Validate ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID format' }, { status: 400 });
    }

    // Check if invoice exists and get some info for the response
    const { data: existingInvoice, error: checkError } = await supabase
      .from('invoices')
      .select('id, invoice_number, status')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      console.error('Database error:', checkError);
      return NextResponse.json({ error: 'Failed to check invoice existence' }, { status: 500 });
    }

    // Prevent deletion of paid invoices (business rule)
    if (existingInvoice.status === 'PAID') {
      return NextResponse.json({
        error: 'Cannot delete a paid invoice. Please contact administrator.'
      }, { status: 409 });
    }

    // Soft delete by updating deleted_at timestamp
    const { error } = await supabase
      .from('invoices')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Invoice "${existingInvoice.invoice_number}" has been deleted`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}