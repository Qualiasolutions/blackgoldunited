-- Migration: add_invoice_items_unit
-- Date: 2025-01-12
-- Description: Add unit of measure field to invoice_items table

-- Add unit field to invoice_items table
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'pc';

-- Add comment
COMMENT ON COLUMN invoice_items.unit IS 'Unit of measure (e.g., pc, kg, m, etc.)';
