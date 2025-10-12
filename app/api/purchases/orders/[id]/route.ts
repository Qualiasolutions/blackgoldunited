import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAndAuthorize(request, 'purchase', 'DELETE');
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = await createClient();
  const { id } = await params;

  try {
    // First, check if the purchase order exists
    const { data: existingPO, error: checkError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status')
      .eq('id', id)
      .single();

    if (checkError || !existingPO) {
      return NextResponse.json(
        { success: false, error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Optional: Prevent deletion of certain statuses
    // Uncomment if you want to restrict deletion based on status
    // if (!['DRAFT', 'CANCELLED'].includes(existingPO.status)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Cannot delete purchase order with status: ' + existingPO.status },
    //     { status: 400 }
    //   );
    // }

    // Delete related purchase order items first (foreign key constraint)
    const { error: itemsDeleteError } = await supabase
      .from('purchase_order_items')
      .delete()
      .eq('po_id', id);

    if (itemsDeleteError) {
      console.error('Error deleting purchase order items:', itemsDeleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete purchase order items: ' + itemsDeleteError.message },
        { status: 500 }
      );
    }

    // Now delete the purchase order itself
    const { error: poDeleteError } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (poDeleteError) {
      console.error('Error deleting purchase order:', poDeleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete purchase order: ' + poDeleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Purchase order ${existingPO.po_number} deleted successfully`
    }, { status: 200 });

  } catch (error) {
    console.error('Error in DELETE /api/purchases/orders/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
