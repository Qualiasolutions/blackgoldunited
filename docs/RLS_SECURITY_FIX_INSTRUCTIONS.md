# RLS Security Fix Instructions

**Date**: October 4, 2025
**Priority**: 🔴 CRITICAL
**Status**: Ready to apply

## ⚠️ Critical Security Issues Found

Supabase database linter found **6 ERROR-level** security issues:

1. ❌ `public.clients` - RLS policies exist but RLS is **DISABLED**
2. ❌ `public.invoices` - RLS policies exist but RLS is **DISABLED**
3. ❌ `public.invoice_items` - RLS policies exist but RLS is **DISABLED**

**Impact**: These tables are publicly accessible without Row Level Security enforcement, despite having policies defined.

## 🚀 How to Fix (5 minutes)

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/ieixledbjzqvldrusunz
2. Click **SQL Editor** in the left sidebar
3. Click **+ New Query**

### Step 2: Run the Migration SQL

1. Open the file: `supabase/migration_enable_rls_security_fixes.sql`
2. Copy the SQL from **PART 1** (lines 12-29)
3. Paste into Supabase SQL Editor
4. Click **Run** (bottom right)

**The SQL to run**:
```sql
-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invoices table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invoice_items table
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
```

### Step 3: Verify RLS is Enabled

Run this verification query:

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('clients', 'invoices', 'invoice_items')
ORDER BY tablename;
```

**Expected Output**:
```
schemaname | tablename     | rls_enabled
-----------+---------------+------------
public     | clients       | t
public     | invoice_items | t
public     | invoices      | t
```

All should show `t` (true) for `rls_enabled`.

## ✅ What This Fixes

**Before**:
- ❌ Tables were publicly accessible to anyone with the API URL
- ❌ RLS policies existed but were not enforced
- ❌ Potential data breach vulnerability

**After**:
- ✅ RLS enforced on all 3 critical tables
- ✅ Only users with proper permissions can access data
- ✅ Existing policies now actively protect data

## 📋 Additional Security Warnings (Lower Priority)

### Function Search Path Issues (WARN level)

Two functions have mutable search_path (potential security risk):
- `public.set_user_role_in_jwt`
- `public.get_user_role_from_jwt`

**To fix** (optional but recommended):
1. In Supabase Dashboard → Database → Functions
2. Find each function and click Edit
3. Add `SET search_path = public` after `SECURITY DEFINER`

See `supabase/migration_enable_rls_security_fixes.sql` PART 2 for detailed instructions.

### Leaked Password Protection (WARN level)

HaveIBeenPwned password checking is disabled.

**To fix**:
1. Go to Authentication → Settings in Supabase Dashboard
2. Enable "Leaked Password Protection"
3. Docs: https://supabase.com/docs/guides/auth/password-security

## 🔄 After Applying Fixes

Run the security audit script to verify all fixes:

```bash
./scripts/security-check-detailed.sh
```

## 📚 Documentation

- Full migration SQL: `supabase/migration_enable_rls_security_fixes.sql`
- Security audit script: `scripts/security-check-detailed.sh`
- Session notes: `docs/SESSION_2025-10-04_RLS_SECURITY_FIXES.md`

---

**⏰ Estimated Time**: 5 minutes
**✅ Can be done without code deployment** - This is a database-only change
