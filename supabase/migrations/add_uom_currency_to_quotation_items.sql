-- Migration: Add UOM, Currency, Title, and Description fields
-- Date: 2025-10-05
-- Description: Add Unit of Measure (UOM) and Currency fields to quotation_items table
--              Add Title and Description fields to quotations table

-- ============================================
-- PART 1: Add columns to quotation_items
-- ============================================

-- Add UOM (Unit of Measure) column - manual entry, blank by default
ALTER TABLE quotation_items
ADD COLUMN IF NOT EXISTS uom VARCHAR(50);

-- Add Currency column with default value 'KD' (Kuwaiti Dinar)
-- Supported currencies: KD, USD, EUR, SAR (Saudi Riyal), EGP (Egyptian Pound)
ALTER TABLE quotation_items
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'KD';

-- Add comments for documentation
COMMENT ON COLUMN quotation_items.uom IS 'Unit of Measure (e.g., pcs, kg, m, box) - manually entered';
COMMENT ON COLUMN quotation_items.currency IS 'Currency code (KD, USD, EUR, SAR, EGP) - defaults to KD';


-- ============================================
-- PART 2: Add columns to quotations table
-- ============================================

-- Add Title column for RFQ title
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add Description column for RFQ description
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update issue_date to allow NULL (will be set programmatically)
ALTER TABLE quotations
ALTER COLUMN issue_date DROP NOT NULL;

-- Set default value for issue_date
ALTER TABLE quotations
ALTER COLUMN issue_date SET DEFAULT CURRENT_DATE;

-- Add comments for documentation
COMMENT ON COLUMN quotations.title IS 'RFQ title - main subject of the request';
COMMENT ON COLUMN quotations.description IS 'RFQ description - detailed requirements';
