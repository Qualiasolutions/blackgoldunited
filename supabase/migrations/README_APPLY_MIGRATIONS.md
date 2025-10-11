# Database Migrations - Invoice & Quotation PDF Fields

**Date**: January 12, 2025
**Purpose**: Add all missing fields from PDF templates to match invoice and quotation documents exactly

## Quick Apply Instructions

1. **Go to**: [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/kqkrzvgbugjtamsjxyfd/sql)
2. **Run each migration in order** (copy-paste and execute)

## Migration Order

### 1. Invoice Table Fields
**File**: `add_invoice_pdf_fields.sql`
**Adds**: customer_po_number, customer_po_date, attention_to, sales_person, project, payment_terms, currency, bank_details

### 2. Invoice Items Unit Field
**File**: `add_invoice_items_unit.sql`
**Adds**: unit (Unit of Measure like pc, kg, m, etc.)

### 3. Quotation Items Table
**File**: `create_quotation_items.sql`
**Creates**: New quotation_items table with all line item fields

### 4. Quotation Table Fields
**File**: `add_quotation_pdf_fields.sql`
**Adds**: client_ref_no, customer_rfq_no, bgu_ref_no, subject, discount_percentage, sales_person, delivery_time, payment_terms_text, currency, attention_to

## Verification Queries

After running all migrations, verify with these queries:

```sql
-- Check invoices table columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- Check invoice_items table columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'invoice_items'
ORDER BY ordinal_position;

-- Check quotations table columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'quotations'
ORDER BY ordinal_position;

-- Check quotation_items table was created
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'quotation_items'
ORDER BY ordinal_position;
```

## Rollback (if needed)

If you need to rollback these changes:

```sql
-- Rollback Invoice fields
ALTER TABLE invoices
DROP COLUMN IF EXISTS customer_po_number,
DROP COLUMN IF EXISTS customer_po_date,
DROP COLUMN IF EXISTS attention_to,
DROP COLUMN IF EXISTS sales_person,
DROP COLUMN IF EXISTS project,
DROP COLUMN IF EXISTS payment_terms,
DROP COLUMN IF EXISTS currency,
DROP COLUMN IF EXISTS bank_details;

-- Rollback Invoice Items unit
ALTER TABLE invoice_items
DROP COLUMN IF EXISTS unit;

-- Rollback Quotation Items table
DROP TABLE IF EXISTS quotation_items CASCADE;

-- Rollback Quotation fields
ALTER TABLE quotations
DROP COLUMN IF EXISTS client_ref_no,
DROP COLUMN IF EXISTS customer_rfq_no,
DROP COLUMN IF EXISTS bgu_ref_no,
DROP COLUMN IF EXISTS subject,
DROP COLUMN IF EXISTS discount_percentage,
DROP COLUMN IF EXISTS sales_person,
DROP COLUMN IF EXISTS delivery_time,
DROP COLUMN IF EXISTS payment_terms_text,
DROP COLUMN IF EXISTS currency,
DROP COLUMN IF EXISTS attention_to;
```
