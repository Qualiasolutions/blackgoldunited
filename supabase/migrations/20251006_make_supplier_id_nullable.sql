-- Migration: Make supplier_id nullable in purchase_orders table
-- Date: 2025-10-06
-- Reason: Purchase orders can be created with clients instead of suppliers
--         The frontend form collects client_id, not supplier_id

-- Make supplier_id nullable
ALTER TABLE purchase_orders
ALTER COLUMN supplier_id DROP NOT NULL;

-- Add comment to clarify the schema
COMMENT ON COLUMN purchase_orders.supplier_id IS 'Optional supplier reference - can be null if purchase order is linked to a client instead';
COMMENT ON COLUMN purchase_orders.client_id IS 'Optional client reference - used when purchase order is created for a client';
