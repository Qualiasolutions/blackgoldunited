import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/sales/quotations/[id]
 *
 * Deletes a quotation (RFQ) and all its associated line items.
 *
 * Security:
 * - Requires authentication and sales module access
 * - Uses soft delete (sets deleted_at timestamp)
 * - Verifies quotation exists before deletion
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing quotation ID
 * @returns JSON response indicating success or failure
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAndAuthorize(request, 'sales', 'DELETE');
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = await createClient();
  const { id } = await params;

  try {
    // First, check if the quotation exists and is not already deleted
    const { data: existingQuotation, error: checkError } = await supabase
      .from('quotations')
      .select('id, quotation_number, status, deleted_at')
      .eq('id', id)
      .single();

    if (checkError || !existingQuotation) {
      return NextResponse.json(
        { success: false, error: 'Quotation not found' },
        { status: 404 }
      );
    }

    if (existingQuotation.deleted_at) {
      return NextResponse.json(
        { success: false, error: 'Quotation has already been deleted' },
        { status: 400 }
      );
    }

    // Optional: Prevent deletion of certain statuses
    // Uncomment if you want to restrict deletion based on status
    // if (['ACCEPTED', 'SENT'].includes(existingQuotation.status)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Cannot delete quotation with status: ' + existingQuotation.status },
    //     { status: 400 }
    //   );
    // }

    // Soft delete quotation items first
    const { error: itemsDeleteError } = await supabase
      .from('quotation_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('quotation_id', id)
      .is('deleted_at', null);

    if (itemsDeleteError) {
      console.error('Error soft deleting quotation items:', itemsDeleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete quotation items: ' + itemsDeleteError.message },
        { status: 500 }
      );
    }

    // Soft delete the quotation itself
    const { error: quotationDeleteError } = await supabase
      .from('quotations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (quotationDeleteError) {
      console.error('Error soft deleting quotation:', quotationDeleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete quotation: ' + quotationDeleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Quotation ${existingQuotation.quotation_number} deleted successfully`
    }, { status: 200 });

  } catch (error) {
    console.error('Error in DELETE /api/sales/quotations/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
