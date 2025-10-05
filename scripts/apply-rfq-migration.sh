#!/bin/bash

# Script to apply RFQ UOM and Currency migration
# This script displays the SQL that needs to be run in Supabase Dashboard

echo "=========================================="
echo "RFQ UOM & Currency Migration"
echo "=========================================="
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/pauybhirynoyljpobiqy/sql/new"
echo "2. Copy the SQL below"
echo "3. Paste it into the SQL Editor"
echo "4. Click 'Run' to execute"
echo ""
echo "=========================================="
echo "SQL TO RUN:"
echo "=========================================="
echo ""

cat /home/qualiasolutions/Desktop/Projects/erps/blackgoldunited/supabase/migrations/add_uom_currency_to_quotation_items.sql

echo ""
echo "=========================================="
echo "After running the migration, verify with:"
echo "=========================================="
echo ""
echo "SELECT column_name, data_type, column_default"
echo "FROM information_schema.columns"
echo "WHERE table_name = 'quotation_items'"
echo "  AND column_name IN ('uom', 'currency')"
echo "ORDER BY column_name;"
echo ""
echo "SELECT column_name, data_type"
echo "FROM information_schema.columns"
echo "WHERE table_name = 'quotations'"
echo "  AND column_name IN ('title', 'description')"
echo "ORDER BY column_name;"
echo ""
