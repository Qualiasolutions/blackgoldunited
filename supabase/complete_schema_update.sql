-- BlackGoldUnited ERP Complete Schema Update
-- Adding all new tables for Weeks 9-14 with optimizations

-- Finance & Accounting Tables (Week 9)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_code VARCHAR(20) UNIQUE NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  branch_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CHECKING', 'SAVINGS', 'BUSINESS', 'MONEY_MARKET', 'OTHER')),
  currency VARCHAR(3) DEFAULT 'USD',
  opening_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  routing_number VARCHAR(50),
  swift_code VARCHAR(20),
  iban VARCHAR(50),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_number, bank_name)
);

CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID REFERENCES bank_accounts(id) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'FEE', 'INTEREST')),
  amount DECIMAL(15,2) NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  reference_number VARCHAR(100),
  reconciled BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL,
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES chart_of_accounts(id) NOT NULL,
  debit_amount DECIMAL(15,2),
  credit_amount DECIMAL(15,2),
  description TEXT,
  CHECK ((debit_amount IS NOT NULL AND credit_amount IS NULL) OR (debit_amount IS NULL AND credit_amount IS NOT NULL))
);

-- Document Management Tables (Week 10)
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_code VARCHAR(50) UNIQUE NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('INVOICE', 'CONTRACT', 'LETTER', 'REPORT', 'CERTIFICATE', 'MEMO', 'PROPOSAL', 'OTHER')),
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  access_level VARCHAR(20) DEFAULT 'PUBLIC' CHECK (access_level IN ('PUBLIC', 'PRIVATE', 'DEPARTMENT')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_number VARCHAR(100) UNIQUE NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('CONTRACT', 'INVOICE', 'REPORT', 'CERTIFICATE', 'LETTER', 'MEMO', 'PROPOSAL', 'OTHER')),
  category VARCHAR(50) NOT NULL,
  template_id UUID REFERENCES document_templates(id),
  content TEXT,
  variables JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED')),
  access_level VARCHAR(20) DEFAULT 'PRIVATE' CHECK (access_level IN ('PUBLIC', 'PRIVATE', 'DEPARTMENT')),
  expiry_date DATE,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  change_notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED')),
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_approval_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  approval_id UUID REFERENCES document_approvals(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  approver_role VARCHAR(50),
  approver_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED')),
  comments TEXT,
  approved_at TIMESTAMPTZ
);

-- QHSE Compliance Tables (Week 11)
CREATE TABLE IF NOT EXISTS qhse_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_number VARCHAR(50) UNIQUE NOT NULL,
  policy_name VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('QUALITY', 'HEALTH', 'SAFETY', 'ENVIRONMENT', 'INTEGRATED')),
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL,
  review_date DATE NOT NULL,
  expiry_date DATE,
  approval_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'ACTIVE', 'EXPIRED', 'SUPERSEDED')),
  tags TEXT[] DEFAULT '{}',
  related_policies UUID[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qhse_procedures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_number VARCHAR(50) UNIQUE NOT NULL,
  procedure_name VARCHAR(255) NOT NULL,
  policy_id UUID REFERENCES qhse_policies(id),
  category VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL,
  review_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qhse_compliance_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_name VARCHAR(255) NOT NULL,
  form_code VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('QUALITY', 'HEALTH', 'SAFETY', 'ENVIRONMENT', 'AUDIT', 'INSPECTION', 'INCIDENT', 'TRAINING')),
  description TEXT NOT NULL,
  fields JSONB NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'AS_NEEDED')),
  deadline INTEGER, -- Days after creation
  assigned_roles TEXT[] DEFAULT '{"IMS_QHSE"}',
  is_active BOOLEAN DEFAULT true,
  auto_reminders BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qhse_form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES qhse_compliance_forms(id),
  instance_id UUID, -- References qhse_form_instances if scheduled
  submission_data JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED')),
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT
);

CREATE TABLE IF NOT EXISTS qhse_audit_trail (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qhse_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reporting & Analytics Tables (Week 12)
CREATE TABLE IF NOT EXISTS report_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_name VARCHAR(255) NOT NULL,
  report_code VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('FINANCIAL', 'SALES', 'INVENTORY', 'HR', 'PAYROLL', 'QHSE', 'OPERATIONAL', 'EXECUTIVE')),
  description TEXT NOT NULL,
  data_source JSONB NOT NULL,
  columns JSONB NOT NULL,
  parameters JSONB DEFAULT '[]',
  scheduling JSONB,
  access_roles TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES report_definitions(id),
  parameters JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
  result_data JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  row_count INTEGER,
  executed_by UUID REFERENCES users(id),
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES report_definitions(id),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY')),
  time TIME,
  recipients TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes (Week 13)
-- Finance indexes
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_code ON chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_date ON bank_transactions(bank_account_id, transaction_date);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_type_status ON documents(document_type, status);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);

-- QHSE indexes
CREATE INDEX IF NOT EXISTS idx_qhse_policies_category ON qhse_policies(category);
CREATE INDEX IF NOT EXISTS idx_qhse_policies_review_date ON qhse_policies(review_date);
CREATE INDEX IF NOT EXISTS idx_qhse_form_submissions_form ON qhse_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_qhse_audit_trail_entity ON qhse_audit_trail(entity_type, entity_id);

-- Reporting indexes
CREATE INDEX IF NOT EXISTS idx_report_executions_report ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_executed_at ON report_executions(executed_at);

-- RLS Policies for new tables
-- Finance tables
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- Document tables
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;

-- QHSE tables
ALTER TABLE qhse_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE qhse_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE qhse_compliance_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE qhse_form_submissions ENABLE ROW LEVEL SECURITY;

-- Reporting tables
ALTER TABLE report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- Finance RLS Policies
CREATE POLICY "finance_select_policy" ON chart_of_accounts FOR SELECT
USING (
  CASE
    WHEN auth.jwt() ->> 'user_role' IN ('MANAGEMENT', 'FINANCE_TEAM') THEN true
    ELSE false
  END
);

CREATE POLICY "finance_insert_policy" ON chart_of_accounts FOR INSERT
WITH CHECK (
  CASE
    WHEN auth.jwt() ->> 'user_role' IN ('MANAGEMENT', 'FINANCE_TEAM') THEN true
    ELSE false
  END
);

-- Apply similar policies to all finance tables
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY['bank_accounts', 'bank_transactions', 'journal_entries', 'journal_entry_lines']) LOOP
    EXECUTE format('
      CREATE POLICY "%s_select_policy" ON %s FOR SELECT
      USING (
        CASE
          WHEN auth.jwt() ->> ''user_role'' IN (''MANAGEMENT'', ''FINANCE_TEAM'') THEN true
          ELSE false
        END
      )', table_name, table_name);

    EXECUTE format('
      CREATE POLICY "%s_insert_policy" ON %s FOR INSERT
      WITH CHECK (
        CASE
          WHEN auth.jwt() ->> ''user_role'' IN (''MANAGEMENT'', ''FINANCE_TEAM'') THEN true
          ELSE false
        END
      )', table_name, table_name);
  END LOOP;
END $$;

-- Document RLS Policies
CREATE POLICY "documents_select_policy" ON documents FOR SELECT
USING (
  CASE
    WHEN auth.jwt() ->> 'user_role' IN ('MANAGEMENT', 'ADMIN_HR') THEN true
    WHEN access_level = 'PUBLIC' THEN true
    WHEN access_level = 'DEPARTMENT' AND auth.jwt() ->> 'user_role' = ANY(ARRAY['PROCUREMENT_BD', 'FINANCE_TEAM', 'IMS_QHSE']) THEN true
    WHEN access_level = 'PRIVATE' AND created_by = auth.uid() THEN true
    ELSE false
  END
);

-- QHSE RLS Policies
CREATE POLICY "qhse_select_policy" ON qhse_policies FOR SELECT
USING (
  CASE
    WHEN auth.jwt() ->> 'user_role' IN ('MANAGEMENT', 'IMS_QHSE') THEN true
    WHEN is_active = true THEN true
    ELSE false
  END
);

CREATE POLICY "qhse_insert_policy" ON qhse_policies FOR INSERT
WITH CHECK (
  CASE
    WHEN auth.jwt() ->> 'user_role' IN ('MANAGEMENT', 'IMS_QHSE') THEN true
    ELSE false
  END
);

-- Reporting RLS Policies
CREATE POLICY "reports_select_policy" ON report_definitions FOR SELECT
USING (
  CASE
    WHEN auth.jwt() ->> 'user_role' = 'MANAGEMENT' THEN true
    WHEN auth.jwt() ->> 'user_role' = ANY(access_roles) THEN true
    ELSE false
  END
);

-- Add trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to tables that need them
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY[
    'chart_of_accounts', 'bank_accounts', 'journal_entries',
    'document_templates', 'documents', 'qhse_policies', 'qhse_procedures',
    'qhse_compliance_forms', 'report_definitions'
  ]) LOOP
    EXECUTE format('
      CREATE TRIGGER update_%s_updated_at
      BEFORE UPDATE ON %s
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      table_name, table_name);
  END LOOP;
END $$;

-- Insert default chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) VALUES
('1000', 'Cash and Cash Equivalents', 'ASSET', 'Current assets - cash accounts'),
('1100', 'Accounts Receivable', 'ASSET', 'Current assets - amounts owed by customers'),
('1200', 'Inventory', 'ASSET', 'Current assets - goods for sale'),
('1500', 'Equipment', 'ASSET', 'Fixed assets - office and operational equipment'),
('2000', 'Accounts Payable', 'LIABILITY', 'Current liabilities - amounts owed to suppliers'),
('2100', 'Accrued Expenses', 'LIABILITY', 'Current liabilities - accrued but unpaid expenses'),
('3000', 'Owner Equity', 'EQUITY', 'Owner''s equity in the business'),
('4000', 'Sales Revenue', 'REVENUE', 'Revenue from sales of goods and services'),
('4100', 'Service Revenue', 'REVENUE', 'Revenue from services provided'),
('5000', 'Cost of Goods Sold', 'EXPENSE', 'Direct costs of goods sold'),
('6000', 'Operating Expenses', 'EXPENSE', 'General operating expenses'),
('6100', 'Salaries and Wages', 'EXPENSE', 'Employee compensation expenses'),
('6200', 'Rent Expense', 'EXPENSE', 'Office and facility rent'),
('6300', 'Utilities Expense', 'EXPENSE', 'Utilities and communication expenses')
ON CONFLICT (account_code) DO NOTHING;

-- Insert sample document templates
INSERT INTO document_templates (template_code, template_name, template_type, category, content, variables) VALUES
('INV-001', 'Standard Invoice Template', 'INVOICE', 'Sales',
'<h1>INVOICE</h1><p>Invoice Number: {{invoice_number}}</p><p>Date: {{current_date}}</p><p>Bill To: {{client_name}}</p><p>Amount: {{total_amount}}</p>',
ARRAY['invoice_number', 'client_name', 'total_amount']),
('CON-001', 'Service Contract Template', 'CONTRACT', 'Legal',
'<h1>SERVICE CONTRACT</h1><p>Between: {{company_name}} and {{client_name}}</p><p>Service: {{service_description}}</p><p>Duration: {{contract_duration}}</p>',
ARRAY['company_name', 'client_name', 'service_description', 'contract_duration'])
ON CONFLICT (template_code) DO NOTHING;

-- Insert sample QHSE policies
INSERT INTO qhse_policies (policy_number, policy_name, category, description, content, effective_date, review_date) VALUES
('QMS-001', 'Quality Management System Policy', 'QUALITY', 'Overall quality management policy',
'This policy establishes our commitment to quality management...',
CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year'),
('HSE-001', 'Health and Safety Policy', 'SAFETY', 'Employee health and safety policy',
'This policy outlines our commitment to employee health and safety...',
CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year')
ON CONFLICT (policy_number) DO NOTHING;

-- Insert sample report definitions
INSERT INTO report_definitions (report_name, report_code, category, description, data_source, columns, access_roles) VALUES
('Sales Summary Report', 'RPT-SALES-001', 'SALES', 'Monthly sales summary report',
'{"tables": ["invoices"], "filters": []}',
'[{"name": "invoice_number", "label": "Invoice Number", "type": "STRING"}, {"name": "total_amount", "label": "Amount", "type": "CURRENCY"}]',
ARRAY['MANAGEMENT', 'FINANCE_TEAM', 'PROCUREMENT_BD']),
('Employee Report', 'RPT-HR-001', 'HR', 'Employee summary report',
'{"tables": ["employees"], "filters": []}',
'[{"name": "employee_number", "label": "Employee #", "type": "STRING"}, {"name": "first_name", "label": "First Name", "type": "STRING"}]',
ARRAY['MANAGEMENT', 'ADMIN_HR'])
ON CONFLICT (report_code) DO NOTHING;