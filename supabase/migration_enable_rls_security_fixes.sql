-- Migration: Enable RLS on Critical Tables + Function Security Fixes
-- Date: October 4, 2025
-- Purpose: Fix 6 ERROR-level and 2 WARN-level security issues from Supabase linter
--
-- Issues Fixed:
-- 1. Enable RLS on clients table (has policies but RLS disabled)
-- 2. Enable RLS on invoices table (has policies but RLS disabled)
-- 3. Enable RLS on invoice_items table (has policies but RLS disabled)
-- 4. Fix search_path for set_user_role_in_jwt function
-- 5. Fix search_path for get_user_role_from_jwt function

-- =============================================================================
-- PART 1: Enable Row Level Security on Critical Tables
-- =============================================================================

-- Enable RLS on clients table
-- Policies already exist: clients_delete_policy, clients_insert_policy,
--                         clients_select_policy, clients_update_policy
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invoices table
-- Policies already exist: invoices_delete_policy, invoices_insert_policy,
--                         invoices_select_policy, invoices_update_policy
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invoice_items table
-- Policies already exist: invoice_items_delete_policy, invoice_items_insert_policy,
--                         invoice_items_select_policy, invoice_items_update_policy
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 2: Fix Function Search Path Security Issues
-- =============================================================================

-- INSTRUCTIONS: To fix these functions, you need to add "SET search_path = public"
-- to the function definition. In the Supabase dashboard:
--
-- 1. Go to Database > Functions
-- 2. Find "set_user_role_in_jwt" and "get_user_role_from_jwt"
-- 3. Click Edit on each function
-- 4. Add "SET search_path = public" after "SECURITY DEFINER" in the definition
--
-- Example:
-- CREATE OR REPLACE FUNCTION public.your_function_name()
-- RETURNS return_type
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public  <-- Add this line
-- AS $$
-- BEGIN
--   -- function body
-- END;
-- $$;
--
-- If the functions don't exist or aren't critical to your application,
-- you can safely ignore this warning. The RLS fixes above are the priority.

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('clients', 'invoices', 'invoice_items')
ORDER BY tablename;

-- Expected output:
-- schemaname | tablename     | rls_enabled
-- -----------+---------------+-------------
-- public     | clients       | t
-- public     | invoice_items | t
-- public     | invoices      | t

-- Verify function search_path settings
SELECT
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as settings
FROM pg_proc
WHERE proname IN ('set_user_role_in_jwt', 'get_user_role_from_jwt')
  AND pronamespace = 'public'::regnamespace
ORDER BY proname;

-- Expected output should show settings array containing 'search_path=public'
