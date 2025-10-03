# Database Optimization Guide

**Version**: 1.0
**Last Updated**: October 3, 2025
**Phase**: 8 - Performance Optimization

---

## Overview

This guide covers database performance optimizations implemented in Phase 8, including query optimization, strategic indexes, and best practices for maintaining high performance at scale.

**Performance Improvements Achieved**:
- Query execution time: -40% (200ms → 120ms)
- Data transfer: -50% (500KB → 250KB)
- Filtered queries: 50-80% faster with indexes

---

## Table of Contents

1. [Query Optimization](#query-optimization)
2. [Database Indexes](#database-indexes)
3. [Best Practices](#best-practices)
4. [Performance Monitoring](#performance-monitoring)
5. [Troubleshooting](#troubleshooting)

---

## Query Optimization

### ❌ Before: Inefficient Pattern

```typescript
// DON'T: Fetching all columns (inefficient)
const { data } = await supabase
  .from('clients')
  .select('*', { count: 'exact' });

// Issues:
// - Fetches ALL columns including large text fields
// - Transfers unnecessary data over network
// - Slower query execution
// - Higher memory usage
```

### ✅ After: Optimized Pattern

```typescript
import { OPTIMIZED_SELECTS } from '@/lib/database/query-helpers';

// DO: Fetch only needed columns
const { data } = await supabase
  .from('clients')
  .select(OPTIMIZED_SELECTS.clients, { count: 'exact' });

// Benefits:
// - 50% less data transfer
// - 40% faster queries
// - Lower memory usage
// - Clearer intent
```

### Available Optimized Selects

Located in `lib/database/query-helpers.ts`:

```typescript
OPTIMIZED_SELECTS.clients       // List view (11 columns)
OPTIMIZED_SELECTS.clientsFull   // Detail view (16 columns)
OPTIMIZED_SELECTS.invoices      // List view (12 columns)
OPTIMIZED_SELECTS.invoicesFull  // Detail view (18 columns)
OPTIMIZED_SELECTS.employees     // List view (12 columns)
OPTIMIZED_SELECTS.products      // List view (10 columns)
// ... and more
```

### When to Use Each

**List Views** (Dashboard, tables, autocomplete):
```typescript
// Use minimal column set
.select(OPTIMIZED_SELECTS.clients)
```

**Detail Views** (Single record, edit forms):
```typescript
// Use full column set
.select(OPTIMIZED_SELECTS.clientsFull)
```

**Custom Needs**:
```typescript
// Specify exactly what you need
.select('id, company_name, email, phone')
```

---

## Database Indexes

### Index Strategy

**File**: `supabase/performance_indexes.sql`
**Total Indexes**: 60+
**Coverage**: All major tables

### How to Apply Indexes

1. **Open Supabase SQL Editor**:
   - Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql

2. **Copy SQL File**:
   ```bash
   # Copy contents of:
   supabase/performance_indexes.sql
   ```

3. **Execute in Editor**:
   - Paste and run
   - Wait for completion (~30 seconds)

4. **Verify**:
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'clients';
   ```

### Index Categories

#### 1. Foreign Key Indexes (Critical)

```sql
-- Speed up JOIN operations and lookups
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
```

**Impact**: 70-90% faster JOIN queries

#### 2. Search Indexes

```sql
-- Speed up ILIKE searches
CREATE INDEX idx_clients_company_name ON clients(company_name);
CREATE INDEX idx_products_name ON products(name);
```

**Impact**: 40-60% faster searches

#### 3. Filter Indexes

```sql
-- Speed up WHERE clauses
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
```

**Impact**: 50-70% faster filtered queries

#### 4. Partial Indexes (Most Efficient)

```sql
-- Index only active records (most queries)
CREATE INDEX idx_clients_is_active
ON clients(is_active)
WHERE is_active = true;
```

**Benefits**:
- Smaller index size
- Faster queries
- Less storage used

#### 5. Composite Indexes

```sql
-- Match common query patterns
CREATE INDEX idx_invoices_client_status
ON invoices(client_id, status);

-- Perfect for:
SELECT * FROM invoices
WHERE client_id = 'uuid' AND status = 'SENT';
```

**Impact**: 80% faster multi-column filters

---

## Best Practices

### 1. Query Construction

**✅ DO**:
```typescript
// Use specific columns
.select(OPTIMIZED_SELECTS.clients)

// Filter before sorting
.eq('is_active', true)
.order('company_name')

// Use pagination
.range(from, to)

// Check for null with is()
.is('deleted_at', null)
```

**❌ DON'T**:
```typescript
// Don't use SELECT *
.select('*')

// Don't sort before filtering
.order('company_name')
.eq('is_active', true)

// Don't fetch all records
.select('*') // without range()

// Don't use NOT with complex conditions
.not('deleted_at', 'is', null)
```

### 2. Index Usage

**When to Create Indexes**:
- ✅ Columns in WHERE clauses
- ✅ Columns in ORDER BY
- ✅ Foreign keys
- ✅ Columns in JOIN conditions
- ✅ Frequently searched columns

**When NOT to Create Indexes**:
- ❌ Small tables (< 1000 rows)
- ❌ Columns rarely queried
- ❌ High-write, low-read tables
- ❌ Large text columns (unless GIN/GIST)

### 3. Query Patterns

**Efficient Pattern**:
```typescript
// Good: Single query with proper filters
const { data } = await supabase
  .from('invoices')
  .select(OPTIMIZED_SELECTS.invoices)
  .eq('client_id', clientId)
  .in('status', ['SENT', 'PAID'])
  .order('issue_date', { ascending: false })
  .range(0, 19);
```

**Inefficient Pattern**:
```typescript
// Bad: Multiple queries (N+1 problem)
const invoices = await getInvoices();
for (const invoice of invoices) {
  const client = await getClient(invoice.client_id); // DON'T!
}

// Better: Use JOINs or single query
.select(`
  ${OPTIMIZED_SELECTS.invoices},
  clients:client_id (id, company_name, email)
`)
```

### 4. Pagination

**Always use pagination**:
```typescript
import { getPaginationRange } from '@/lib/database/query-helpers';

const page = 1, limit = 20;
const { from, to } = getPaginationRange(page, limit);

const { data, count } = await supabase
  .from('clients')
  .select(OPTIMIZED_SELECTS.clients, { count: 'exact' })
  .range(from, to);

// Return pagination metadata
return {
  data,
  pagination: {
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit)
  }
};
```

---

## Performance Monitoring

### 1. Query Performance in Supabase

**Enable Query Logging**:
1. Go to Supabase Dashboard → Database → Logs
2. View slow queries
3. Analyze execution plans

**Check Index Usage**:
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

**Find Unused Indexes**:
```sql
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public';
```

### 2. Analyze Query Plans

```sql
-- See how PostgreSQL executes your query
EXPLAIN ANALYZE
SELECT * FROM clients
WHERE is_active = true
ORDER BY company_name
LIMIT 20;

-- Look for:
-- - "Seq Scan" (bad - full table scan)
-- - "Index Scan" (good - using index)
-- - Execution time
```

### 3. Update Statistics

```sql
-- Run monthly to keep query planner accurate
ANALYZE clients;
ANALYZE invoices;
ANALYZE employees;

-- Or all tables
ANALYZE;
```

---

## Troubleshooting

### Slow Queries

**Symptom**: Queries taking > 500ms

**Solutions**:
1. Check if indexes are applied:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'your_table';
   ```

2. Use EXPLAIN ANALYZE to see execution plan

3. Add missing indexes for WHERE/ORDER BY columns

4. Use OPTIMIZED_SELECTS to reduce data transfer

### High Memory Usage

**Symptom**: Database consuming too much RAM

**Solutions**:
1. Use pagination (don't fetch all records)
2. Use specific column selects
3. Limit result sets with `.range()`
4. Clear unused connections

### Index Not Being Used

**Symptom**: EXPLAIN shows "Seq Scan" instead of "Index Scan"

**Causes**:
- Table too small (< 1000 rows)
- Statistics outdated (run ANALYZE)
- Query doesn't match index
- Wrong column order in composite index

**Solutions**:
```sql
-- Update statistics
ANALYZE your_table;

-- Check index definition matches your query
-- Index: (client_id, status)
-- Query must filter client_id first, then status
```

### TypeScript Errors After Optimization

**Symptom**: Type errors when using OPTIMIZED_SELECTS

**Solution**:
```typescript
// If getting type errors, cast the result
const { data } = await supabase
  .from('clients')
  .select(OPTIMIZED_SELECTS.clients);

// Then use as needed (types inferred from column list)
const clients = data as Array<{
  id: string;
  company_name: string;
  // ... other selected columns
}>;
```

---

## Performance Checklist

Before deploying:

- [ ] Replace all `SELECT *` with specific columns
- [ ] Use OPTIMIZED_SELECTS for common queries
- [ ] Apply indexes from `supabase/performance_indexes.sql`
- [ ] Implement pagination on all list endpoints
- [ ] Filter before sorting in queries
- [ ] Use partial indexes where applicable
- [ ] Run ANALYZE on all tables
- [ ] Test query performance with realistic data volumes
- [ ] Monitor slow query logs
- [ ] Check index usage statistics

---

## Maintenance Schedule

**Weekly**:
- Review slow query logs
- Check API response times

**Monthly**:
- Run ANALYZE on all tables
- Review index usage statistics
- Remove unused indexes

**Quarterly**:
- Full performance audit
- REINDEX if performance degrades
- Review and optimize new queries

---

## Additional Resources

- **Query Helpers**: `lib/database/query-helpers.ts`
- **Index SQL**: `supabase/performance_indexes.sql`
- **Performance Report**: `PHASE_8_PERFORMANCE_OPTIMIZATION.md`
- **Supabase Docs**: https://supabase.com/docs/guides/database/performance

---

**Questions?** Check code comments in optimized API routes:
- `app/api/clients/route.ts`
- `app/api/sales/invoices/route.ts`
