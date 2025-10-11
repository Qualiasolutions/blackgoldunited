import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'

import { authenticateAndAuthorize } from '@/lib/auth/api-auth'
import { createClient } from '@/lib/supabase/server'
import { transformInvoice } from '@/lib/transformers/invoices'
import type { ClientRow, InvoiceItemRow, InvoiceRow } from '@/lib/transformers/invoices'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAndAuthorize(request, 'sales', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await params

    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID format' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      console.error('Invoice PDF fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
    }

    const invoiceRecord = invoice as InvoiceRow & { deleted_at?: string | null }

    if (invoiceRecord.deleted_at) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { data: clientData } = await supabase
      .from('clients')
      .select('id, company_name, contact_person, email, address_line_1, city, state, country')
      .eq('id', invoiceRecord.client_id)
      .single()

    const { data: itemsData } = await supabase
      .from('invoice_items')
      .select('id, invoice_id, product_id, description, quantity, unit_price, line_total, tax_rate')
      .eq('invoice_id', invoiceRecord.id)
      .order('created_at')

    const payload = transformInvoice(invoiceRecord, {
      client: clientData as ClientRow | undefined,
      items: itemsData as InvoiceItemRow[] | undefined,
    })

    const doc = new PDFDocument({ margin: 40 })
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk as Buffer))

    const pdfBufferPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
    })

    doc.fontSize(22).text('Invoice', { align: 'center' })
    doc.moveDown()

    doc.fontSize(10)
    doc.text(`Invoice Number: ${payload.invoiceNumber || 'N/A'}`)
    doc.text(`Status: ${payload.status}`)
    doc.text(`Payment Status: ${payload.paymentStatus}`)
    doc.text(`Issue Date: ${payload.issueDate ? new Date(payload.issueDate).toLocaleDateString() : 'N/A'}`)
    doc.text(`Due Date: ${payload.dueDate ? new Date(payload.dueDate).toLocaleDateString() : 'N/A'}`)
    doc.moveDown()

    doc.fontSize(14).text('Bill To', { underline: true })
    if (payload.client) {
      doc.fontSize(10)
      doc.text(payload.client.companyName)
      if (payload.client.contactPerson) doc.text(payload.client.contactPerson)
      if (payload.client.email) doc.text(payload.client.email)
      if (payload.client.address) doc.text(payload.client.address)
      const location = [payload.client.city, payload.client.state, payload.client.country]
        .filter(Boolean)
        .join(', ')
      if (location) doc.text(location)
    } else {
      doc.fontSize(10).text('Client information unavailable')
    }

    doc.moveDown(1.5)
    doc.fontSize(14).text('Invoice Items', { underline: true })

    const tableTop = doc.y + 10
    const descriptionX = 40
    const qtyX = 300
    const priceX = 360
    const totalX = 450

    doc.fontSize(11)
    doc.text('Description', descriptionX, tableTop)
    doc.text('Qty', qtyX, tableTop, { width: 40, align: 'right' })
    doc.text('Unit Price', priceX, tableTop, { width: 70, align: 'right' })
    doc.text('Line Total', totalX, tableTop, { width: 90, align: 'right' })

    doc.moveTo(descriptionX, tableTop + 14)
      .lineTo(totalX + 90, tableTop + 14)
      .stroke()

    let currentY = tableTop + 20

    if (payload.items.length === 0) {
      doc.fontSize(10).text('No items on this invoice.', descriptionX, currentY)
      currentY += 20
    } else {
      payload.items.forEach((item) => {
        const itemText = doc.fontSize(10).text(item.description, descriptionX, currentY, { width: 240 })
        const itemHeight = 18 // Fixed height for each item line
        doc.text(String(item.quantity), qtyX, currentY, { width: 40, align: 'right' })
        doc.text(formatCurrency(item.unitPrice), priceX, currentY, { width: 70, align: 'right' })
        doc.text(formatCurrency(item.lineTotal), totalX, currentY, { width: 90, align: 'right' })
        currentY += Math.max(itemHeight, 18)
      })
    }

    doc.moveDown(2)
    doc.fontSize(12).text('Summary', { underline: true })
    doc.fontSize(10)
    doc.text(`Subtotal: ${formatCurrency(payload.subtotal)}`)
    doc.text(`Tax: ${formatCurrency(payload.taxAmount)}`)
    if (payload.discountAmount) {
      doc.text(`Discounts: ${formatCurrency(payload.discountAmount)}`)
    }
    doc.text(`Total: ${formatCurrency(payload.totalAmount)}`)
    doc.text(`Paid: ${formatCurrency(payload.paidAmount)}`)
    doc.text(`Outstanding: ${formatCurrency(payload.totalAmount - payload.paidAmount)}`)

    if (payload.notes) {
      doc.moveDown()
      doc.fontSize(12).text('Notes', { underline: true })
      doc.fontSize(10).text(payload.notes)
    }

    if (payload.terms) {
      doc.moveDown()
      doc.fontSize(12).text('Terms & Conditions', { underline: true })
      doc.fontSize(10).text(payload.terms)
    }

    doc.end()

    const pdfBuffer = await pdfBufferPromise
    const fileName = `${payload.invoiceNumber || 'invoice'}.pdf`

    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'GENERATE_INVOICE_PDF',
      entity_type: 'invoice',
      entity_id: id,
      details: {
        invoice_number: payload.invoiceNumber,
        total_amount: payload.totalAmount,
        status: payload.status,
      },
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Invoice PDF generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
