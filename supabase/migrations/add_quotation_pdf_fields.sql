-- Migration: add_quotation_pdf_fields
-- Date: 2025-01-12
-- Description: Add missing fields from Quotation PDF templates to quotations table

-- Add missing fields to quotations table
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS client_ref_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_rfq_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS bgu_ref_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_terms_text TEXT,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'KWD',
ADD COLUMN IF NOT EXISTS attention_to VARCHAR(255);

-- Add comments to describe new columns
COMMENT ON COLUMN quotations.client_ref_no IS 'Client reference number';
COMMENT ON COLUMN quotations.customer_rfq_no IS 'Customer RFQ number';
COMMENT ON COLUMN quotations.bgu_ref_no IS 'BGU internal reference number';
COMMENT ON COLUMN quotations.subject IS 'Quotation subject/title';
COMMENT ON COLUMN quotations.discount_percentage IS 'Discount percentage applied';
COMMENT ON COLUMN quotations.sales_person IS 'Sales person assigned';
COMMENT ON COLUMN quotations.delivery_time IS 'Expected delivery time';
COMMENT ON COLUMN quotations.payment_terms_text IS 'Payment terms description';
COMMENT ON COLUMN quotations.currency IS 'Quotation currency (default: KWD)';
COMMENT ON COLUMN quotations.attention_to IS 'Attention to (contact person)';
