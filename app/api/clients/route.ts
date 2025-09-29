/**
 * Clients API Routes - Main Collection Endpoints
 *
 * This file implements the core CRUD operations for the Clients module.
 * It provides GET (list) and POST (create) endpoints for client management.
 *
 * Security:
 * - All endpoints require authentication
 * - Role-based access control enforced
 * - Input validation via Zod schemas
 * - Comprehensive error handling
 *
 * Endpoints:
 * - GET /api/clients - List clients with search/pagination/filtering
 * - POST /api/clients - Create new client
 *
 * @author BlackGoldUnited ERP Team
 * @version 1.0
 * @since Week 2 - API Infrastructure Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';

/**
 * Client validation schema for creating new clients
 * Matches the Supabase database schema exactly
 */
const clientSchema = z.object({
  clientCode: z.string().min(1, 'Client code is required'),
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxNumber: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  paymentTerms: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

/**
 * Partial schema for client updates (all fields optional)
 */
const clientUpdateSchema = clientSchema.partial();

/**
 * Search and pagination parameters schema
 * Supports filtering, sorting, and pagination for client listings
 */
const searchSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  sortBy: z.string().optional().default('company_name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * GET /api/clients
 *
 * List all clients with search, filtering, sorting, and pagination support.
 * Implements role-based access control - different roles have different access levels.
 *
 * Query Parameters:
 * - query: Search term (searches company name, contact person, email)
 * - status: Filter by Active/Inactive status
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 10)
 * - sortBy: Field to sort by (default: companyName)
 * - sortOrder: Sort direction asc/desc (default: asc)
 *
 * Access Control:
 * - MANAGEMENT: Full access ✅
 * - PROCUREMENT_BD: Full access ✅
 * - FINANCE_TEAM: Read-only access ✅
 * - ADMIN_HR: Read-only access ✅
 * - IMS_QHSE: No access ❌ (403 Forbidden)
 *
 * @returns JSON response with clients array and pagination metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'clients', 'GET');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const validatedParams = searchSchema.parse(Object.fromEntries(searchParams.entries()));

    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (validatedParams.query) {
      query = query.or(`client_code.ilike.%${validatedParams.query}%,company_name.ilike.%${validatedParams.query}%,contact_person.ilike.%${validatedParams.query}%,email.ilike.%${validatedParams.query}%`);
    }

    // Apply status filter (using is_active boolean instead of status string)
    if (validatedParams.status) {
      const isActive = validatedParams.status === 'Active';
      query = query.eq('is_active', isActive);
    }

    // Apply sorting
    query = query.order(validatedParams.sortBy, { ascending: validatedParams.sortOrder === 'asc' });

    // Apply pagination
    const from = (validatedParams.page - 1) * validatedParams.limit;
    const to = from + validatedParams.limit - 1;
    query = query.range(from, to);

    const { data: clients, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: clients || [],
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
 * POST /api/clients
 *
 * Create a new client with comprehensive validation and error handling.
 * Only users with create permissions can access this endpoint.
 *
 * Required Fields:
 * - clientCode: Unique client identifier
 * - companyName: Company name
 * - email: Valid email address
 *
 * Access Control:
 * - MANAGEMENT: Create allowed ✅
 * - PROCUREMENT_BD: Create allowed ✅
 * - FINANCE_TEAM: Create denied ❌ (403 Forbidden)
 * - ADMIN_HR: Create denied ❌ (403 Forbidden)
 * - IMS_QHSE: No access ❌ (403 Forbidden)
 *
 * @returns JSON response with created client data or validation errors
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'clients', 'POST');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = clientSchema.parse(body);

    // Map camelCase to snake_case for database
    const dbData = {
      client_code: validatedData.clientCode,
      company_name: validatedData.companyName,
      contact_person: validatedData.contactPerson,
      email: validatedData.email,
      phone: validatedData.phone,
      mobile: validatedData.mobile,
      address_line_1: validatedData.address,
      city: validatedData.city,
      state: validatedData.state,
      country: validatedData.country || 'United Arab Emirates',
      postal_code: validatedData.postalCode,
      tax_number: validatedData.taxNumber,
      credit_limit: validatedData.creditLimit || 0,
      payment_terms: validatedData.paymentTerms || 30,
      is_active: validatedData.isActive !== false,
      created_by: authResult.user.id
    };

    // Insert new client
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'A client with this email already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: newClient,
      message: 'Client created successfully'
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