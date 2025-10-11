-- Migration: add_invoice_pdf_fields
-- Date: 2025-01-12
-- Description: Add missing fields from Invoice PDF template to invoices table

-- Add missing fields to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS customer_po_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_po_date DATE,
ADD COLUMN IF NOT EXISTS attention_to VARCHAR(255),
ADD COLUMN IF NOT EXISTS sales_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS project VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'KWD',
ADD COLUMN IF NOT EXISTS bank_details TEXT;

-- Add comments to describe new columns
COMMENT ON COLUMN invoices.customer_po_number IS 'Customer Purchase Order Number';
COMMENT ON COLUMN invoices.customer_po_date IS 'Customer PO Date';
COMMENT ON COLUMN invoices.attention_to IS 'Attention to (contact person)';
COMMENT ON COLUMN invoices.sales_person IS 'Sales person assigned to this invoice';
COMMENT ON COLUMN invoices.project IS 'Project name or reference';
COMMENT ON COLUMN invoices.payment_terms IS 'Payment terms and conditions text';
COMMENT ON COLUMN invoices.currency IS 'Invoice currency (default: KWD)';
COMMENT ON COLUMN invoices.bank_details IS 'Bank payment instructions';
