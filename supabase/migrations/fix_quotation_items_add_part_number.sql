-- Migration: fix_quotation_items_add_part_number
-- Date: 2025-01-12
-- Description: Add missing part_number column to quotation_items table if it doesn't exist

-- Add part_number column if it doesn't exist
ALTER TABLE quotation_items
ADD COLUMN IF NOT EXISTS part_number VARCHAR(100);

-- Add comment
COMMENT ON COLUMN quotation_items.part_number IS 'Product/Part number';
