import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';

// Client validation schema (partial for updates)
const clientUpdateSchema = z.object({
  clientCode: z.string().min(1, 'Client code is required').optional(),
  companyName: z.string().min(1, 'Company name is required').optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
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
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

// GET - Get single client by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'clients', 'GET');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    const { id } = await params;

    // Validate ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }

    // Fetch client
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update client by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'clients', 'PUT');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    const { id } = await params;

    // Validate ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = clientUpdateSchema.parse(body);

    // Check if client exists first
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      console.error('Database error:', checkError);
      return NextResponse.json({ error: 'Failed to check client existence' }, { status: 500 });
    }

    // Map camelCase to snake_case for database
    const dbData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.clientCode !== undefined) dbData.client_code = validatedData.clientCode;
    if (validatedData.companyName !== undefined) dbData.company_name = validatedData.companyName;
    if (validatedData.contactPerson !== undefined) dbData.contact_person = validatedData.contactPerson;
    if (validatedData.email !== undefined) dbData.email = validatedData.email;
    if (validatedData.phone !== undefined) dbData.phone = validatedData.phone;
    if (validatedData.mobile !== undefined) dbData.mobile = validatedData.mobile;
    if (validatedData.address !== undefined) dbData.address_line_1 = validatedData.address;
    if (validatedData.city !== undefined) dbData.city = validatedData.city;
    if (validatedData.state !== undefined) dbData.state = validatedData.state;
    if (validatedData.country !== undefined) dbData.country = validatedData.country;
    if (validatedData.postalCode !== undefined) dbData.postal_code = validatedData.postalCode;
    if (validatedData.taxNumber !== undefined) dbData.tax_number = validatedData.taxNumber;
    if (validatedData.creditLimit !== undefined) dbData.credit_limit = validatedData.creditLimit;
    if (validatedData.paymentTerms !== undefined) dbData.payment_terms = validatedData.paymentTerms;
    if (validatedData.isActive !== undefined) dbData.is_active = validatedData.isActive;
    if (validatedData.notes !== undefined) dbData.notes = validatedData.notes;

    // Update client
    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      if (error.code === '23505') { // Unique violation
        // Determine which field caused the duplicate
        const errorMessage = error.message || '';
        if (errorMessage.includes('client_code')) {
          return NextResponse.json({ error: 'A client with this client code already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'A client with this information already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: 'Client updated successfully'
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

// DELETE - Delete client by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'clients', 'DELETE');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    const { id } = await params;

    // Validate ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }

    // Check if client exists and get some info for the response
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      console.error('Database error:', checkError);
      return NextResponse.json({ error: 'Failed to check client existence' }, { status: 500 });
    }

    // Soft delete by updating is_active instead of hard delete (preserves data integrity)
    const { error } = await supabase
      .from('clients')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Client "${existingClient.company_name}" has been deactivated`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}