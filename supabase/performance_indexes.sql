/**
 * Performance Optimization - Database Indexes
 *
 * This SQL file contains strategic database indexes for improving query performance.
 * Run these commands in the Supabase SQL Editor.
 *
 * Expected Performance Improvements:
 * - Filtered queries: 50-80% faster
 * - Sorted queries: 40-60% faster
 * - Search queries: 30-50% faster
 *
 * @author BlackGoldUnited ERP Team
 * @version 1.0
 * @since Phase 8 - Performance Optimization
 * @date October 3, 2025
 */

-- ============================================================================
-- CLIENTS TABLE INDEXES
-- ============================================================================

-- Index for company name searches (frequently used in autocomplete and search)
CREATE INDEX IF NOT EXISTS idx_clients_company_name
ON clients(company_name);

-- Partial index for active clients (most queries filter by is_active = true)
CREATE INDEX IF NOT EXISTS idx_clients_is_active
ON clients(is_active)
WHERE is_active = true;

-- Index for email lookups (used in search and validation)
CREATE INDEX IF NOT EXISTS idx_clients_email
ON clients(email);

-- Index for client code (unique identifier used in lookups)
CREATE INDEX IF NOT EXISTS idx_clients_client_code
ON clients(client_code);

-- Composite index for common query pattern: active clients sorted by name
CREATE INDEX IF NOT EXISTS idx_clients_active_name
ON clients(is_active, company_name)
WHERE is_active = true;

-- Index for created_at (used in sorting by date)
CREATE INDEX IF NOT EXISTS idx_clients_created_at
ON clients(created_at DESC);

-- ============================================================================
-- INVOICES TABLE INDEXES
-- ============================================================================

-- Index for client foreign key (most important - used in every client-invoice query)
CREATE INDEX IF NOT EXISTS idx_invoices_client_id
ON invoices(client_id);

-- Index for invoice status filtering
CREATE INDEX IF NOT EXISTS idx_invoices_status
ON invoices(status);

-- Index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status
ON invoices(payment_status);

-- Index for invoice number searches
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number
ON invoices(invoice_number);

-- Index for date range queries (DESC for recent-first sorting)
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date
ON invoices(issue_date DESC);

-- Index for due date queries (overdue invoices)
CREATE INDEX IF NOT EXISTS idx_invoices_due_date
ON invoices(due_date);

-- Partial index for non-deleted invoices (most queries exclude deleted)
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at
ON invoices(deleted_at)
WHERE deleted_at IS NULL;

-- Composite index for common query: client's invoices by status
CREATE INDEX IF NOT EXISTS idx_invoices_client_status
ON invoices(client_id, status);

-- Composite index for overdue invoices
CREATE INDEX IF NOT EXISTS idx_invoices_overdue
ON invoices(due_date, payment_status)
WHERE payment_status != 'COMPLETED' AND deleted_at IS NULL;

-- Index for created_at (sorting by creation date)
CREATE INDEX IF NOT EXISTS idx_invoices_created_at
ON invoices(created_at DESC);

-- ============================================================================
-- EMPLOYEES TABLE INDEXES
-- ============================================================================

-- Index for employee code
CREATE INDEX IF NOT EXISTS idx_employees_employee_code
ON employees(employee_code);

-- Index for full name searches
CREATE INDEX IF NOT EXISTS idx_employees_full_name
ON employees(full_name);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_employees_email
ON employees(email);

-- Index for department foreign key
CREATE INDEX IF NOT EXISTS idx_employees_department_id
ON employees(department_id);

-- Index for designation foreign key
CREATE INDEX IF NOT EXISTS idx_employees_designation_id
ON employees(designation_id);

-- Partial index for active employees
CREATE INDEX IF NOT EXISTS idx_employees_is_active
ON employees(is_active)
WHERE is_active = true;

-- Composite index for active employees in department
CREATE INDEX IF NOT EXISTS idx_employees_dept_active
ON employees(department_id, is_active)
WHERE is_active = true;

-- Index for hire date (used in reports and filtering)
CREATE INDEX IF NOT EXISTS idx_employees_hire_date
ON employees(hire_date DESC);

-- ============================================================================
-- PRODUCTS TABLE INDEXES
-- ============================================================================

-- Index for product code
CREATE INDEX IF NOT EXISTS idx_products_product_code
ON products(product_code);

-- Index for product name searches
CREATE INDEX IF NOT EXISTS idx_products_name
ON products(name);

-- Index for category foreign key
CREATE INDEX IF NOT EXISTS idx_products_category_id
ON products(category_id);

-- Partial index for active products
CREATE INDEX IF NOT EXISTS idx_products_is_active
ON products(is_active)
WHERE is_active = true;

-- Index for low stock alerts
CREATE INDEX IF NOT EXISTS idx_products_low_stock
ON products(stock_quantity)
WHERE stock_quantity <= reorder_level;

-- Composite index for active products by category
CREATE INDEX IF NOT EXISTS idx_products_category_active
ON products(category_id, is_active)
WHERE is_active = true;

-- ============================================================================
-- SUPPLIERS TABLE INDEXES
-- ============================================================================

-- Index for supplier code
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_code
ON suppliers(supplier_code);

-- Index for company name searches
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name
ON suppliers(company_name);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_email
ON suppliers(email);

-- Partial index for active suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active
ON suppliers(is_active)
WHERE is_active = true;

-- ============================================================================
-- PURCHASE ORDERS TABLE INDEXES
-- ============================================================================

-- Index for PO number
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number
ON purchase_orders(po_number);

-- Index for supplier foreign key
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id
ON purchase_orders(supplier_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status
ON purchase_orders(status);

-- Index for order date
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date
ON purchase_orders(order_date DESC);

-- Index for expected delivery date
CREATE INDEX IF NOT EXISTS idx_purchase_orders_delivery_date
ON purchase_orders(expected_delivery_date);

-- Composite index for supplier's orders by status
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_status
ON purchase_orders(supplier_id, status);

-- ============================================================================
-- ATTENDANCE TABLE INDEXES
-- ============================================================================

-- Index for employee foreign key
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id
ON attendance(employee_id);

-- Index for date lookups
CREATE INDEX IF NOT EXISTS idx_attendance_date
ON attendance(date DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_attendance_status
ON attendance(status);

-- Composite index for employee's attendance by date
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
ON attendance(employee_id, date DESC);

-- ============================================================================
-- LEAVE REQUESTS TABLE INDEXES
-- ============================================================================

-- Index for employee foreign key
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id
ON leave_requests(employee_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_leave_requests_status
ON leave_requests(status);

-- Index for start date
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date
ON leave_requests(start_date DESC);

-- Composite index for employee's leave requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status
ON leave_requests(employee_id, status);

-- ============================================================================
-- PAYROLL RECORDS TABLE INDEXES
-- ============================================================================

-- Index for employee foreign key
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id
ON payroll_records(employee_id);

-- Index for pay period start date
CREATE INDEX IF NOT EXISTS idx_payroll_records_period_start
ON payroll_records(pay_period_start DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_payroll_records_status
ON payroll_records(status);

-- Composite index for employee's payroll records
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_period
ON payroll_records(employee_id, pay_period_start DESC);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify indexes were created successfully:

-- List all indexes on clients table
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'clients' ORDER BY indexname;

-- List all indexes on invoices table
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'invoices' ORDER BY indexname;

-- Check index usage statistics (run after production usage)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- ============================================================================
-- PERFORMANCE TESTING
-- ============================================================================

-- Before/After comparison queries:

-- Test 1: Active clients sorted by name
-- EXPLAIN ANALYZE SELECT * FROM clients WHERE is_active = true ORDER BY company_name LIMIT 20;

-- Test 2: Client's invoices by status
-- EXPLAIN ANALYZE SELECT * FROM invoices WHERE client_id = 'some-uuid' AND status = 'SENT' ORDER BY issue_date DESC;

-- Test 3: Overdue invoices
-- EXPLAIN ANALYZE SELECT * FROM invoices WHERE due_date < NOW() AND payment_status != 'COMPLETED' AND deleted_at IS NULL;

-- ============================================================================
-- MAINTENANCE
-- ============================================================================

-- Analyze tables to update statistics (run monthly)
-- ANALYZE clients;
-- ANALYZE invoices;
-- ANALYZE employees;
-- ANALYZE products;

-- Reindex if needed (run quarterly or when performance degrades)
-- REINDEX TABLE clients;
-- REINDEX TABLE invoices;

-- ============================================================================
-- NOTES
-- ============================================================================

/**
 * Best Practices:
 * 1. Indexes speed up READ operations but slow down WRITE operations slightly
 * 2. Only create indexes on columns frequently used in WHERE, ORDER BY, JOIN
 * 3. Partial indexes (with WHERE clause) are more efficient for filtered data
 * 4. Composite indexes should match query patterns (order matters!)
 * 5. Monitor index usage with pg_stat_user_indexes
 * 6. Drop unused indexes to save storage and improve write performance
 * 7. Run ANALYZE periodically to update query planner statistics
 *
 * Index Naming Convention:
 * - idx_{table}_{column} for single-column indexes
 * - idx_{table}_{col1}_{col2} for composite indexes
 * - Add descriptive suffix for special cases (e.g., _active, _overdue)
 */

-- ============================================================================
-- END OF FILE
-- ============================================================================
