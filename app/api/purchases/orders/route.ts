import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const authResult = await authenticateAndAuthorize(request, 'purchase', 'GET');
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('query') || '';
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const approvalStatus = searchParams.get('approvalStatus') || '';
  const supplierId = searchParams.get('supplierId') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    // Build base query
    let ordersQuery = supabase
      .from('purchase_orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (query) {
      ordersQuery = ordersQuery.ilike('po_number', `%${query}%`);
    }
    if (status && status !== 'all') {
      ordersQuery = ordersQuery.eq('status', status);
    }
    if (supplierId && supplierId !== 'all') {
      ordersQuery = ordersQuery.eq('supplier_id', supplierId);
    }

    // Pagination
    ordersQuery = ordersQuery.range(offset, offset + limit - 1);

    const { data: orders, error: ordersError, count } = await ordersQuery;

    if (ordersError) {
      console.error('Error fetching purchase orders:', ordersError);
      return NextResponse.json(
        { success: false, error: ordersError.message },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

    // Fetch suppliers
    const supplierIds = [...new Set(orders.map(o => o.supplier_id).filter(Boolean))];
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id, supplier_code, company_name, email, phone')
      .in('id', supplierIds);

    const suppliersMap = (suppliers || []).reduce((acc: any, s: any) => {
      acc[s.id] = s;
      return acc;
    }, {});

    // Fetch order items count
    const orderIds = orders.map(o => o.id);
    const { data: itemsCounts } = await supabase
      .from('purchase_order_items')
      .select('po_id')
      .in('po_id', orderIds);

    const itemsCountMap = (itemsCounts || []).reduce((acc: any, item: any) => {
      acc[item.po_id] = (acc[item.po_id] || 0) + 1;
      return acc;
    }, {});

    // Combine data
    const enrichedOrders = orders.map((order: any) => ({
      id: order.id,
      poNumber: order.po_number,
      orderDate: order.order_date,
      expectedDeliveryDate: order.delivery_date,
      status: order.status,
      priority: 'MEDIUM', // Default priority
      approvalStatus: 'APPROVED', // Default approval
      requiresApproval: false,
      subtotal: parseFloat(order.subtotal || 0),
      taxAmount: parseFloat(order.tax_amount || 0),
      totalAmount: parseFloat(order.total_amount || 0),
      shippingCost: 0,
      discountAmount: 0,
      supplier: suppliersMap[order.supplier_id] || {
        id: order.supplier_id,
        name: 'Unknown',
        supplierCode: 'N/A',
        email: '',
        phone: ''
      },
      items: [],
      itemsCount: itemsCountMap[order.id] || 0,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: enrichedOrders,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/purchases/orders:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateAndAuthorize(request, 'purchase', 'POST');
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const {
      supplierId,
      orderDate,
      deliveryDate,
      items,
      notes,
      termsAndConditions
    } = body;

    // Validation
    if (!supplierId || !orderDate || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate PO number
    const { data: lastPO } = await supabase
      .from('purchase_orders')
      .select('po_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const nextNumber = lastPO ? parseInt(lastPO.po_number.split('-').pop() || '0') + 1 : 1;
    const poNumber = `PO-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach((item: any) => {
      const lineTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
      subtotal += lineTotal;
      taxAmount += lineTotal * (parseFloat(item.taxRate || 0) / 100);
    });

    const totalAmount = subtotal + taxAmount;

    // Create purchase order
    const { data: purchaseOrder, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id: supplierId,
        order_date: orderDate,
        delivery_date: deliveryDate,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'DRAFT',
        notes,
        terms_and_conditions: termsAndConditions,
        created_by: authResult.user.id
      })
      .select()
      .single();

    if (poError) {
      console.error('Error creating purchase order:', poError);
      return NextResponse.json(
        { success: false, error: poError.message },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      po_id: purchaseOrder.id,
      product_id: item.productId || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate || 0,
      line_total: parseFloat(item.quantity) * parseFloat(item.unitPrice),
      uom: item.uom || 'pcs',
      currency: item.currency || 'KD'
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating purchase order items:', itemsError);
      // Rollback: delete the purchase order
      await supabase.from('purchase_orders').delete().eq('id', purchaseOrder.id);
      return NextResponse.json(
        { success: false, error: itemsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: purchaseOrder.id,
        poNumber: purchaseOrder.po_number
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/purchases/orders:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
