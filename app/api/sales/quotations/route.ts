/**
 * Sales Quotations API Routes - Main Collection Endpoints
 *
 * This file implements the core CRUD operations for the Sales/Quotations (RFQ) module.
 * It provides GET (list) and POST (create) endpoints for quotation management.
 *
 * Security:
 * - All endpoints require authentication
 * - Role-based access control enforced
 * - Input validation via Zod schemas
 * - Comprehensive error handling
 *
 * Endpoints:
 * - GET /api/sales/quotations - List quotations with search/pagination/filtering
 * - POST /api/sales/quotations - Create new quotation with line items
 *
 * @author BlackGoldUnited ERP Team
 * @version 1.0
 * @since PDF Fields Update - October 12, 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Quotation item validation schema for line items
 */
const quotationItemSchema = z.object({
  productId: z.string().uuid().optional(),
  partNumber: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  unit: z.string().optional().default('pc'), // Unit of measure (pc, kg, m, etc.)
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  taxRate: z.number().min(0).max(100).optional().default(0),
  discountRate: z.number().min(0).max(100).optional().default(0),
  deliveryTime: z.string().optional(),
});

/**
 * Quotation validation schema for creating new quotations
 * Matches the Supabase database schema exactly (including new PDF fields)
 */
const quotationSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  issueDate: z.string().datetime().optional(),
  validUntil: z.string().datetime('Valid until date is required'),
  status: z.enum(['DRAFT', 'SENT', 'RESPONDED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional().default('DRAFT'),
  subtotal: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional().default(0),
  totalAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  // New fields from PDF template
  clientRefNo: z.string().optional(),
  customerRfqNo: z.string().optional(),
  bguRefNo: z.string().optional(),
  subject: z.string().optional(),
  discountPercentage: z.number().min(0).max(100).optional().default(0),
  salesPerson: z.string().optional(),
  deliveryTime: z.string().optional(),
  paymentTermsText: z.string().optional(),
  currency: z.string().length(3).optional().default('KWD'),
  attentionTo: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, 'At least one quotation item is required'),
});

/**
 * Search and pagination parameters schema
 */
const searchSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  clientId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  sortBy: z.string().optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/sales/quotations
 *
 * List all quotations with search, filtering, sorting, and pagination support.
 *
 * Query Parameters:
 * - query: Search term (searches quotation number, title, description)
 * - status: Filter by quotation status
 * - clientId: Filter by specific client
 * - dateFrom/dateTo: Filter by date range
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 10)
 * - sortBy: Field to sort by (default: createdAt)
 * - sortOrder: Sort direction asc/desc (default: desc)
 *
 * @returns JSON response with quotations array and pagination metadata
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
      .from('quotations')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    // Apply search filter
    if (validatedParams.query) {
      query = query.or(`quotation_number.ilike.%${validatedParams.query}%,title.ilike.%${validatedParams.query}%,description.ilike.%${validatedParams.query}%`);
    }

    // Apply status filter
    if (validatedParams.status) {
      query = query.eq('status', validatedParams.status);
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

    // Map camelCase to snake_case for database column names
    const columnMapping: Record<string, string> = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'issueDate': 'issue_date',
      'validUntil': 'valid_until',
      'clientId': 'client_id',
      'quotationNumber': 'quotation_number',
      'totalAmount': 'total_amount',
      'taxAmount': 'tax_amount',
      'discountAmount': 'discount_amount'
    };

    const dbSortColumn = columnMapping[validatedParams.sortBy] || validatedParams.sortBy;

    // Apply sorting
    query = query.order(dbSortColumn, { ascending: validatedParams.sortOrder === 'asc' });

    // Apply pagination
    const from = (validatedParams.page - 1) * validatedParams.limit;
    const to = from + validatedParams.limit - 1;
    query = query.range(from, to);

    const { data: quotations, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
    }

    if (!quotations || quotations.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    // Fetch related client data separately
    const clientIds = quotations
      .map((q: any) => q.client_id)
      .filter(Boolean);

    let clientsMap: Record<string, any> = {};
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, company_name, contact_person, email')
        .in('id', clientIds);

      clientsMap = (clients || []).reduce((acc: Record<string, any>, client) => {
        acc[client.id] = client;
        return acc;
      }, {});
    }

    // Fetch quotation items separately
    const quotationIds = quotations.map((q: any) => q.id);

    let itemsByQuotation: Record<string, any[]> = {};
    if (quotationIds.length > 0) {
      const { data: items } = await supabase
        .from('quotation_items')
        .select('*')
        .in('quotation_id', quotationIds);

      itemsByQuotation = (items || []).reduce((acc: Record<string, any[]>, item: any) => {
        if (!acc[item.quotation_id]) {
          acc[item.quotation_id] = [];
        }
        acc[item.quotation_id].push(item);
        return acc;
      }, {});
    }

    // Transform to camelCase for frontend
    const transformedQuotations = quotations.map((q: any) => ({
      id: q.id,
      quotationNumber: q.quotation_number,
      clientId: q.client_id,
      client: q.client_id ? clientsMap[q.client_id] : null,
      title: q.title,
      description: q.description,
      issueDate: q.issue_date,
      validUntil: q.valid_until,
      status: q.status,
      subtotal: q.subtotal,
      taxAmount: q.tax_amount,
      discountAmount: q.discount_amount,
      totalAmount: q.total_amount,
      notes: q.notes,
      termsAndConditions: q.terms_and_conditions,
      // PDF fields
      clientRefNo: q.client_ref_no,
      customerRfqNo: q.customer_rfq_no,
      bguRefNo: q.bgu_ref_no,
      subject: q.subject,
      discountPercentage: q.discount_percentage,
      salesPerson: q.sales_person,
      deliveryTime: q.delivery_time,
      paymentTermsText: q.payment_terms_text,
      currency: q.currency,
      attentionTo: q.attention_to,
      items: itemsByQuotation[q.id] || [],
      createdAt: q.created_at,
      updatedAt: q.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: transformedQuotations,
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
 * Generates the next quotation number in sequence
 * Format: QUOT-YYYYMMDD-NNNN (e.g., QUOT-20250924-0001)
 */
async function generateQuotationNumber(supabase: SupabaseClient): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `QUOT-${today}`;

  // Get the highest number for today
  const { data: lastQuotation } = await supabase
    .from('quotations')
    .select('quotation_number')
    .like('quotation_number', `${prefix}%`)
    .order('quotation_number', { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;
  if (lastQuotation?.quotation_number) {
    const lastNumStr = lastQuotation.quotation_number.split('-').pop();
    nextNumber = (parseInt(lastNumStr) || 0) + 1;
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * POST /api/sales/quotations
 *
 * Create a new quotation with line items and comprehensive validation.
 *
 * Required Fields:
 * - clientId: UUID of the client
 * - title: Quotation title
 * - validUntil: Valid until date
 * - items: Array of quotation line items (at least one required)
 *
 * @returns JSON response with created quotation data or validation errors
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
    const validatedData = quotationSchema.parse(body);

    // Generate quotation number
    const quotationNumber = await generateQuotationNumber(supabase);

    // Calculate totals from items
    const subtotal = validatedData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = itemSubtotal * (item.discountRate / 100);
      return sum + (itemSubtotal - discountAmount);
    }, 0);

    const taxAmount = validatedData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = itemSubtotal * (item.discountRate / 100);
      const itemAfterDiscount = itemSubtotal - discountAmount;
      const itemTax = itemAfterDiscount * (item.taxRate / 100);
      return sum + itemTax;
    }, 0);

    const discountAmount = subtotal * (validatedData.discountPercentage / 100);
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Get user ID for audit trail
    const { data: { user } } = await supabase.auth.getUser();

    // Insert new quotation - mapping camelCase to snake_case for database
    const { data: newQuotation, error: quotationError } = await supabase
      .from('quotations')
      .insert([{
        quotation_number: quotationNumber,
        client_id: validatedData.clientId,
        title: validatedData.title,
        description: validatedData.description,
        issue_date: validatedData.issueDate || new Date().toISOString().split('T')[0],
        valid_until: validatedData.validUntil.split('T')[0],
        status: validatedData.status,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        notes: validatedData.notes,
        terms_and_conditions: validatedData.termsAndConditions,
        // New PDF fields
        client_ref_no: validatedData.clientRefNo,
        customer_rfq_no: validatedData.customerRfqNo,
        bgu_ref_no: validatedData.bguRefNo,
        subject: validatedData.subject,
        discount_percentage: validatedData.discountPercentage,
        sales_person: validatedData.salesPerson,
        delivery_time: validatedData.deliveryTime,
        payment_terms_text: validatedData.paymentTermsText,
        currency: validatedData.currency,
        attention_to: validatedData.attentionTo,
        created_by: user?.id,
      }])
      .select()
      .single();

    if (quotationError) {
      console.error('Database error:', quotationError);
      if (quotationError.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'A quotation with this number already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 });
    }

    // Insert quotation items - mapping camelCase to snake_case for database
    const quotationItems = validatedData.items.map(item => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineDiscount = lineSubtotal * (item.discountRate / 100);
      const lineAfterDiscount = lineSubtotal - lineDiscount;
      const lineTax = lineAfterDiscount * (item.taxRate / 100);
      const lineTotal = lineAfterDiscount + lineTax;

      return {
        quotation_id: newQuotation.id,
        product_id: item.productId,
        part_number: item.partNumber,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        discount_rate: item.discountRate,
        line_total: lineTotal,
        delivery_time: item.deliveryTime,
      };
    });

    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(quotationItems);

    if (itemsError) {
      // Rollback quotation creation
      await supabase.from('quotations').delete().eq('id', newQuotation.id);
      console.error('Database error:', itemsError);
      return NextResponse.json({ error: 'Failed to create quotation items' }, { status: 500 });
    }

    // Fetch the complete quotation with client and items
    const { data: completeQuotation } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', newQuotation.id)
      .single();

    const { data: clientData } = await supabase
      .from('clients')
      .select('id, company_name, contact_person, email')
      .eq('id', newQuotation.client_id)
      .single();

    const { data: itemsData } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', newQuotation.id);

    return NextResponse.json({
      success: true,
      data: {
        ...completeQuotation,
        client: clientData,
        items: itemsData
      },
      message: 'Quotation created successfully'
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
