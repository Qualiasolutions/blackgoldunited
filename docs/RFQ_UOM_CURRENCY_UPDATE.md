# RFQ UOM and Currency Fields Update

**Date**: October 5, 2025
**Feature**: Add Unit of Measure (UOM) and Currency fields to RFQ items

## Overview

Added two new fields to the RFQ (Request for Quotation) item creation:
1. **UOM (Unit of Measure)** - Manual text input field (blank by default)
2. **Currency** - Dropdown selector with default value "KD"

## Changes Made

### 1. Database Schema Changes

**File**: `supabase/migrations/add_uom_currency_to_quotation_items.sql`

Added two new columns to the `quotation_items` table:
```sql
ALTER TABLE quotation_items
ADD COLUMN IF NOT EXISTS uom VARCHAR(50);

ALTER TABLE quotation_items
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'KD';
```

**Migration Instructions**:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the SQL from `supabase/migrations/add_uom_currency_to_quotation_items.sql`
3. Execute the migration
4. Verify columns were added: `SELECT * FROM quotation_items LIMIT 1;`

### 2. Frontend Changes

**File**: `app/sales/rfq/create/page.tsx`

#### Interface Update
```typescript
interface RFQItem {
  id: string
  description: string
  quantity: number
  uom: string           // NEW FIELD
  unitPrice: number
  currency: string      // NEW FIELD
  total: number
}
```

#### UI Layout Changes
- Updated grid layout from 4 columns to 6 columns for better spacing
- Field order (left to right):
  1. **Description** (3 columns wide)
  2. **Quantity** (1 column)
  3. **UOM** (1 column) - Manual text input with placeholder "pcs, kg, box..."
  4. **Est. Unit Price** (1 column)
- Added second row below:
  5. **Currency** (3 columns wide) - Dropdown with 5 options

#### Currency Options
- **KD** - Kuwaiti Dinar (Default)
- **USD** - US Dollar ($)
- **EUR** - Euro (€)
- **SAR** - Saudi Riyal
- **EGP** - Egyptian Pound

#### Database Persistence
Updated the `saveRFQ` function to include new fields:
```typescript
const itemsData = items
  .filter(item => item.description.trim() !== '')
  .map(item => ({
    quotation_id: rfq.id,
    description: item.description,
    quantity: item.quantity,
    uom: item.uom || null,        // NEW - allows blank
    unit_price: item.unitPrice,
    currency: item.currency,       // NEW - defaults to 'KD'
    line_total: item.total
  }))
```

#### Total Display
Updated to show currency code:
```typescript
// Before: $123.45
// After:  KD 123.45
<span>{item.currency} {item.total.toFixed(2)}</span>
```

## User Experience

### Creating an RFQ Item

1. Enter item description
2. Enter quantity
3. **[NEW]** Optionally enter Unit of Measure (UOM) - e.g., "pcs", "kg", "box", "m"
4. Enter estimated unit price
5. **[NEW]** Select currency from dropdown (defaults to KD)
6. Total automatically calculated and displayed with currency code

### Example

**Item Entry**:
- Description: "Steel Pipes"
- Quantity: 100
- UOM: "pcs"
- Unit Price: 25.50
- Currency: "KD"

**Display**:
- Total: **KD 2,550.00**

## Database Schema Reference

```sql
-- quotation_items table structure (updated)
CREATE TABLE quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    uom VARCHAR(50),                    -- NEW COLUMN
    unit_price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KD',  -- NEW COLUMN
    line_total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Testing Checklist

- [ ] Run database migration in Supabase dashboard
- [ ] Create new RFQ with UOM field populated
- [ ] Create new RFQ with UOM field blank (should allow)
- [ ] Test all 5 currency options (KD, USD, EUR, SAR, EGP)
- [ ] Verify currency code appears in total display
- [ ] Verify data saves correctly to database
- [ ] Check RFQ list page displays correctly
- [ ] Test TypeScript compilation: `npm run type-check`

## Files Modified

1. `supabase/migrations/add_uom_currency_to_quotation_items.sql` (NEW)
2. `app/sales/rfq/create/page.tsx` (MODIFIED)
3. `docs/RFQ_UOM_CURRENCY_UPDATE.md` (NEW - this file)

## Notes

- UOM field is **optional** (can be left blank)
- Currency field **defaults to KD** (Kuwaiti Dinar)
- Both fields are included in all new RFQ items automatically
- Existing RFQ items will have NULL for UOM and 'KD' for currency (from default)
- Column naming uses snake_case to match PostgreSQL database standards

## Next Steps

After applying the migration, you can:
1. Test the functionality in development
2. Deploy to production
3. Consider adding UOM and Currency to other similar forms (invoices, purchase orders, etc.)
