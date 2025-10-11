// Utility transformers to normalize invoice data coming from the database into
// the camelCase structure expected by the frontend pages.

export interface InvoiceRow {
  id: string
  invoice_number: string | null
  client_id: string | null
  invoice_type: 'business_development' | 'supply' | null
  issue_date: string | null
  due_date: string | null
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
  payment_status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  subtotal: number | string | null
  tax_amount: number | string | null
  discount_amount: number | string | null
  total_amount: number | string | null
  paid_amount: number | string | null
  notes?: string | null
  terms?: string | null
  terms_and_conditions?: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at?: string | null
}

export interface InvoiceItemRow {
  id: string
  invoice_id: string
  product_id: string | null
  description: string | null
  quantity: number | null
  unit_price: number | string | null
  line_total: number | string | null
  tax_rate: number | string | null
  discount_rate: number | string | null
}

export interface ClientRow {
  id: string
  company_name: string | null
  contact_person: string | null
  email: string | null
  address_line_1?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
}

type Nullable<T> = T | null | undefined

export interface InvoiceClient {
  id: string
  companyName: string
  contactPerson: string | null
  email: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
}

export interface InvoiceItem {
  id: string
  productId: string | null
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
  taxRate: number
  discountRate: number
}

export interface InvoicePayload {
  id: string
  invoiceNumber: string
  clientId: string | null
  invoiceType: InvoiceRow['invoice_type']
  issueDate: string | null
  dueDate: string | null
  status: InvoiceRow['status']
  paymentStatus: InvoiceRow['payment_status']
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  notes?: string | null
  terms?: string | null
  createdAt: string | null
  updatedAt: string | null
  client: InvoiceClient | null
  items: InvoiceItem[]
}

const toNumber = (value: Nullable<number | string>) => {
  if (value === null || value === undefined) return 0
  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(parsed) ? parsed : 0
}

export const transformInvoiceClient = (client: Nullable<ClientRow>): InvoiceClient | null => {
  if (!client) return null

  return {
    id: client.id,
    companyName: client.company_name ?? 'Unknown Client',
    contactPerson: client.contact_person,
    email: client.email,
    address: client.address_line_1 ?? client.address ?? null,
    city: client.city ?? null,
    state: client.state ?? null,
    country: client.country ?? null,
  }
}

export const transformInvoiceItem = (item: InvoiceItemRow): InvoiceItem => ({
  id: item.id,
  productId: item.product_id ?? null,
  description: item.description ?? 'Item',
  quantity: Number(item.quantity ?? 0),
  unitPrice: toNumber(item.unit_price),
  lineTotal: toNumber(item.line_total ?? (Number(item.quantity ?? 0) * toNumber(item.unit_price))),
  taxRate: toNumber(item.tax_rate),
  discountRate: toNumber(item.discount_rate),
})

export const transformInvoice = (
  invoice: InvoiceRow,
  options: {
    client?: Nullable<ClientRow>
    items?: InvoiceItemRow[]
  } = {}
): InvoicePayload => ({
  id: invoice.id,
  invoiceNumber: invoice.invoice_number ?? '',
  clientId: invoice.client_id,
  invoiceType: invoice.invoice_type,
  issueDate: invoice.issue_date,
  dueDate: invoice.due_date,
  status: invoice.status,
  paymentStatus: invoice.payment_status,
  subtotal: toNumber(invoice.subtotal),
  taxAmount: toNumber(invoice.tax_amount),
  discountAmount: toNumber(invoice.discount_amount),
  totalAmount: toNumber(invoice.total_amount),
  paidAmount: toNumber(invoice.paid_amount),
  notes: invoice.notes ?? null,
  terms: invoice.terms_and_conditions ?? invoice.terms ?? null,
  createdAt: invoice.created_at,
  updatedAt: invoice.updated_at,
  client: transformInvoiceClient(options.client ?? null),
  items: (options.items ?? []).map(transformInvoiceItem),
})
