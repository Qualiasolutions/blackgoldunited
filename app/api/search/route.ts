import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  // Authenticate and authorize (search is accessible to all authenticated users)
  const authResult = await authenticateAndAuthorize(request, 'reports', 'GET')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {

    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Search across real database tables
    const searchResults: any[] = []

    // Search clients
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, companyName, email, phone')
        .eq('deletedAt', null)
        .ilike('companyName', `%${query}%`)
        .limit(5)

      if (clients) {
        clients.forEach((client: any) => {
          searchResults.push({
            id: client.id,
            type: 'client',
            title: client.companyName,
            description: client.email || 'Client',
            module: 'clients',
            href: `/clients/${client.id}`,
            match: 'client',
            priority: 1
          })
        })
      }
    } catch (err) {
      console.log('Error searching clients:', err)
    }

    // Search invoices
    try {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoiceNumber, totalAmount, status')
        .eq('deletedAt', null)
        .ilike('invoiceNumber', `%${query}%`)
        .limit(5)

      if (invoices) {
        invoices.forEach((invoice: any) => {
          searchResults.push({
            id: invoice.id,
            type: 'invoice',
            title: `Invoice #${invoice.invoiceNumber}`,
            description: `AED ${invoice.totalAmount} - ${invoice.status}`,
            module: 'sales',
            href: `/sales/invoices/${invoice.id}`,
            match: 'invoice',
            priority: 2
          })
        })
      }
    } catch (err) {
      console.log('Error searching invoices:', err)
    }

    // Search products
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, productCode, sellingPrice')
        .eq('deletedAt', null)
        .eq('isActive', true)
        .ilike('name', `%${query}%`)
        .limit(5)

      if (products) {
        products.forEach((product: any) => {
          searchResults.push({
            id: product.id,
            type: 'product',
            title: product.name,
            description: `Code: ${product.productCode} - AED ${product.sellingPrice}`,
            module: 'inventory',
            href: `/inventory/products/${product.id}`,
            match: 'product',
            priority: 3
          })
        })
      }
    } catch (err) {
      console.log('Error searching products:', err)
    }

    // Sort results by priority
    searchResults.sort((a, b) => a.priority - b.priority)

    return NextResponse.json({
      results: searchResults.slice(0, 10),
      query,
      total: searchResults.length
    })

  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}