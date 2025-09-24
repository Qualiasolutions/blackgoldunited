import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';

// Client validation schema
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

const clientUpdateSchema = clientSchema.partial();

// Search/filter schema
const searchSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  sortBy: z.string().optional().default('companyName'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// GET - List clients with search and pagination
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
      query = query.or(`clientCode.ilike.%${validatedParams.query}%,companyName.ilike.%${validatedParams.query}%,contactPerson.ilike.%${validatedParams.query}%,email.ilike.%${validatedParams.query}%`);
    }

    // Apply status filter (using isActive boolean instead of status string)
    if (validatedParams.status) {
      const isActive = validatedParams.status === 'Active';
      query = query.eq('isActive', isActive);
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

// POST - Create new client
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

    // Insert new client
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert([validatedData])
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