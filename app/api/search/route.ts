import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    // For now, return structured search results across modules
    // In production, this would search across multiple tables: clients, invoices, products, etc.
    const searchResults = [
      // Client results
      {
        id: 'client-1',
        type: 'client',
        title: 'Emerald Holdings LLC',
        description: 'Active client in Dubai, UAE',
        module: 'clients',
        href: '/clients/client-1',
        match: 'emerald',
        priority: query.toLowerCase().includes('emerald') ? 1 : 5
      },
      {
        id: 'client-2',
        type: 'client',
        title: 'Phoenix Industries',
        description: 'New client registered today',
        module: 'clients',
        href: '/clients/client-2',
        match: 'phoenix',
        priority: query.toLowerCase().includes('phoenix') ? 1 : 5
      },
      // Invoice results
      {
        id: 'invoice-1',
        type: 'invoice',
        title: 'Invoice #INV-2024-1001',
        description: 'AED 8,750 - Emerald Holdings LLC',
        module: 'sales',
        href: '/sales/invoices/inv-2024-1001',
        match: 'inv-2024-1001',
        priority: query.toLowerCase().includes('1001') || query.toLowerCase().includes('inv') ? 1 : 4
      },
      {
        id: 'invoice-2',
        type: 'invoice',
        title: 'Invoice #INV-2024-0998',
        description: 'AED 15,600 - Phoenix Industries',
        module: 'sales',
        href: '/sales/invoices/inv-2024-0998',
        match: 'inv-2024-0998',
        priority: query.toLowerCase().includes('0998') || query.toLowerCase().includes('inv') ? 1 : 4
      },
      // Product results
      {
        id: 'product-1',
        type: 'product',
        title: 'Premium Oil Filter',
        description: 'SKU: POF-001 - Low stock alert',
        module: 'inventory',
        href: '/inventory/products/pof-001',
        match: 'premium oil filter',
        priority: query.toLowerCase().includes('oil') || query.toLowerCase().includes('filter') ? 1 : 3
      },
      {
        id: 'product-2',
        type: 'product',
        title: 'Brake Pad Set',
        description: 'SKU: BPS-205 - 45 units in stock',
        module: 'inventory',
        href: '/inventory/products/bps-205',
        match: 'brake pad',
        priority: query.toLowerCase().includes('brake') || query.toLowerCase().includes('pad') ? 1 : 3
      },
      // Purchase Order results
      {
        id: 'po-1',
        type: 'purchase_order',
        title: 'Purchase Order #PO-2024-0087',
        description: 'AED 12,300 - Automotive Parts Supply',
        module: 'purchase',
        href: '/purchase/orders/po-2024-0087',
        match: 'po-2024-0087',
        priority: query.toLowerCase().includes('0087') || query.toLowerCase().includes('po') ? 1 : 4
      }
    ]

    // Filter and sort results based on relevance
    const filteredResults = searchResults
      .filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase()) ||
        result.match.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 10) // Limit to top 10 results

    return NextResponse.json({
      results: filteredResults,
      query,
      total: filteredResults.length
    })

  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}