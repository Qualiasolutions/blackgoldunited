-- Migration: create_quotation_items
-- Date: 2025-01-12
-- Description: Create quotation_items table for quotation line items

-- Create quotation_items table
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    part_number VARCHAR(100),
    description TEXT NOT NULL,
    unit VARCHAR(50) DEFAULT 'pc',
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    discount_rate NUMERIC(5, 2) DEFAULT 0,
    line_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    delivery_time VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_product_id ON quotation_items(product_id);

-- Add comments
COMMENT ON TABLE quotation_items IS 'Line items for quotations';
COMMENT ON COLUMN quotation_items.quotation_id IS 'Reference to parent quotation';
COMMENT ON COLUMN quotation_items.product_id IS 'Reference to product catalog (optional)';
COMMENT ON COLUMN quotation_items.part_number IS 'Product/Part number';
COMMENT ON COLUMN quotation_items.description IS 'Item description';
COMMENT ON COLUMN quotation_items.unit IS 'Unit of measure';
COMMENT ON COLUMN quotation_items.quantity IS 'Quantity ordered';
COMMENT ON COLUMN quotation_items.unit_price IS 'Price per unit';
COMMENT ON COLUMN quotation_items.tax_rate IS 'Tax rate percentage';
COMMENT ON COLUMN quotation_items.discount_rate IS 'Discount rate percentage';
COMMENT ON COLUMN quotation_items.line_total IS 'Total amount for this line';
COMMENT ON COLUMN quotation_items.delivery_time IS 'Delivery time for this item';

-- Enable RLS
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (mirror invoice_items policies)
CREATE POLICY "quotation_items_select_policy" ON quotation_items
    FOR SELECT USING (true);

CREATE POLICY "quotation_items_insert_policy" ON quotation_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "quotation_items_update_policy" ON quotation_items
    FOR UPDATE USING (true);

CREATE POLICY "quotation_items_delete_policy" ON quotation_items
    FOR DELETE USING (true);
