-- BlackGoldUnited ERP Initial Migration
-- This file contains manual SQL commands for setting up triggers, functions, and constraints
-- that cannot be defined in Prisma schema

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id, timestamp)
        VALUES (TG_TABLE_NAME, NEW.id, 'CREATE', row_to_json(NEW),
                COALESCE(current_setting('app.current_user_id', true), 'system'), NOW());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id, timestamp)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW),
                COALESCE(current_setting('app.current_user_id', true), 'system'), NOW());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, user_id, timestamp)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD),
                COALESCE(current_setting('app.current_user_id', true), 'system'), NOW());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for critical tables
-- Financial tables
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_journal_entries AFTER INSERT OR UPDATE OR DELETE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_purchase_orders AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Employee and payroll tables
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON contracts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_pay_runs AFTER INSERT OR UPDATE OR DELETE ON pay_runs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Stock and inventory tables
CREATE TRIGGER audit_stock_movements AFTER INSERT OR UPDATE OR DELETE ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create function to update stock levels automatically
CREATE OR REPLACE FUNCTION update_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'IN' THEN
        UPDATE stocks
        SET quantity = quantity + NEW.quantity,
            updated_at = NOW()
        WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;

        -- Create stock record if it doesn't exist
        IF NOT FOUND THEN
            INSERT INTO stocks (id, product_id, warehouse_id, quantity, reserved_qty, updated_at)
            VALUES (gen_random_uuid(), NEW.product_id, NEW.warehouse_id, NEW.quantity, 0, NOW());
        END IF;

    ELSIF NEW.type = 'OUT' THEN
        UPDATE stocks
        SET quantity = quantity - NEW.quantity,
            updated_at = NOW()
        WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;

    ELSIF NEW.type = 'ADJUSTMENT' THEN
        UPDATE stocks
        SET quantity = NEW.quantity,
            updated_at = NOW()
        WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock level updates
CREATE TRIGGER update_stock_on_movement AFTER INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION update_stock_levels();

-- Create function to generate unique codes
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'INV';
    year_part TEXT := to_char(NOW(), 'YY');
    month_part TEXT := to_char(NOW(), 'MM');
    sequence_num INTEGER;
    result TEXT;
BEGIN
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE prefix || year_part || month_part || '%';

    result := prefix || year_part || month_part || LPAD(sequence_num::TEXT, 4, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate employee numbers
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'EMP';
    sequence_num INTEGER;
    result TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM 4) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM employees
    WHERE employee_number LIKE prefix || '%';

    result := prefix || LPAD(sequence_num::TEXT, 5, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_client_status ON invoices(client_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_due_date_status ON invoices(due_date, status) WHERE status IN ('SENT', 'OVERDUE');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_date_category ON expenses(expense_date, category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_employee_date ON attendance_logs(employee_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Create partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_active ON employees(id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_active ON clients(id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suppliers_active ON suppliers(id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active ON products(id) WHERE is_active = true;

-- Create constraints for data integrity
-- Ensure positive amounts
ALTER TABLE invoices ADD CONSTRAINT chk_invoice_positive_total CHECK (total_amount >= 0);
ALTER TABLE expenses ADD CONSTRAINT chk_expense_positive_amount CHECK (amount >= 0);
ALTER TABLE payments ADD CONSTRAINT chk_payment_positive_amount CHECK (amount >= 0);

-- Ensure valid email formats
ALTER TABLE users ADD CONSTRAINT chk_user_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE employees ADD CONSTRAINT chk_employee_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Ensure logical date ranges
ALTER TABLE invoices ADD CONSTRAINT chk_invoice_due_after_issue CHECK (due_date >= issue_date);
ALTER TABLE leave_applications ADD CONSTRAINT chk_leave_end_after_start CHECK (end_date >= start_date);
ALTER TABLE contracts ADD CONSTRAINT chk_contract_end_after_start CHECK (end_date IS NULL OR end_date >= start_date);

-- Create views for common queries
CREATE OR REPLACE VIEW v_invoice_summary AS
SELECT
    i.id,
    i.invoice_number,
    c.company_name as client_name,
    i.issue_date,
    i.due_date,
    i.total_amount,
    i.paid_amount,
    i.total_amount - i.paid_amount as outstanding_amount,
    i.status,
    i.payment_status,
    CASE
        WHEN i.due_date < CURRENT_DATE AND i.payment_status != 'COMPLETED' THEN 'OVERDUE'
        ELSE i.status::text
    END as computed_status
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_employee_summary AS
SELECT
    e.id,
    e.employee_number,
    e.first_name || ' ' || e.last_name as full_name,
    e.email,
    d.name as department_name,
    des.title as designation,
    et.type_name as employment_type,
    e.hire_date,
    e.salary,
    e.is_active
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN designations des ON e.designation_id = des.id
LEFT JOIN employment_types et ON e.employment_type_id = et.id
WHERE e.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
    p.id as product_id,
    p.product_code,
    p.name as product_name,
    w.code as warehouse_code,
    w.name as warehouse_name,
    s.quantity as current_stock,
    s.reserved_qty,
    s.quantity - s.reserved_qty as available_stock,
    p.min_stock,
    CASE
        WHEN s.quantity <= COALESCE(p.min_stock, 0) THEN 'LOW_STOCK'
        ELSE 'NORMAL'
    END as stock_status
FROM products p
JOIN stocks s ON p.id = s.product_id
JOIN warehouses w ON s.warehouse_id = w.id
WHERE p.is_active = true AND w.is_active = true;

-- Create function for data retention cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    retention_years INTEGER;
BEGIN
    -- Clean up old audit logs (keep 7 years)
    DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '7 years';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Soft delete old invoices (keep 10 years, as per requirements)
    UPDATE invoices
    SET deleted_at = NOW()
    WHERE deleted_at IS NULL
    AND issue_date < NOW() - INTERVAL '10 years';

    -- Clean up old attendance logs (keep 3 years)
    DELETE FROM attendance_logs WHERE date < CURRENT_DATE - INTERVAL '3 years';

    -- Clean up old system activity logs if they exist
    -- This would be implemented based on specific logging requirements

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create notification/reminder functions (placeholder for future implementation)
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS TABLE(invoice_id TEXT, client_name TEXT, days_overdue INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        c.company_name,
        (CURRENT_DATE - i.due_date)::INTEGER
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.due_date < CURRENT_DATE
    AND i.payment_status != 'COMPLETED'
    AND i.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Set up row level security (RLS) foundation
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies will be implemented based on specific security requirements
-- This provides the foundation for implementing role-based data access

COMMENT ON FUNCTION audit_trigger_function() IS 'Automatically logs all changes to audited tables';
COMMENT ON FUNCTION update_stock_levels() IS 'Automatically updates stock quantities based on stock movements';
COMMENT ON FUNCTION generate_invoice_number() IS 'Generates sequential invoice numbers with year/month prefix';
COMMENT ON FUNCTION generate_employee_number() IS 'Generates sequential employee numbers';
COMMENT ON FUNCTION cleanup_old_data() IS 'Removes old data according to retention policies';
COMMENT ON VIEW v_invoice_summary IS 'Comprehensive view of invoices with client and status information';
COMMENT ON VIEW v_employee_summary IS 'Employee information with department and designation details';
COMMENT ON VIEW v_stock_summary IS 'Current stock levels with availability and status indicators';