# Quick Start Guide for Next Agent Session

**Last Updated**: October 5, 2025, 00:30 UTC
**Current Status**: ✅ Production Stable (Phase 8 Complete)
**Production URL**: https://blackgoldunited.vercel.app
**Health Check**: `curl https://blackgoldunited.vercel.app/api/health`

---

## 📊 Current System State

### Production Health
- **Status**: STABLE ✅
- **TypeScript Errors**: 0
- **Build Status**: PASSING (87 pages)
- **Security Critical Issues**: 0
- **Database Query Errors**: 0
- **Null Safety Issues**: 0

### Recent Completion (Phase 8)
- **Date**: October 5, 2025
- **Work**: Systematic Database Query Fixes
- **Bugs Fixed**: 192 instances
- **Files Modified**: 66+
- **Commits**: 8

---

## 🎯 Available Agentic Commands

### Status & Information
```bash
*help               # Show all commands and project status
*status             # Project health dashboard
*history            # View session history
```

### Agent Transformation
```bash
*agent backend-guard        # Transform to Backend API specialist
*agent frontend-doctor      # Transform to Frontend/UI specialist
*agent database-guardian    # Transform to Database specialist
*agent security-auditor     # Transform to Security specialist
*agent devops-engineer      # Transform to DevOps specialist
*agent qa-validator         # Transform to QA/Testing specialist
```

### Workflows
```bash
*workflow feature           # Feature implementation workflow
*workflow bugfix            # Bug fix workflow
*workflow security          # Security improvement workflow
*workflow performance       # Performance optimization workflow
*workflow integration       # Third-party integration workflow
*workflow migration         # Database migration workflow
```

### Deployment & Validation
```bash
*deploy                     # Pre-deployment validation
*security                   # Run security audit
*build                      # Run production build
*test                       # Run test suite
```

---

## 📁 Key Files for Agent Context

### Project Status
- `.erp-agents/data/project-status.json` - Real-time project health metrics
- `.erp-agents/data/session-history.json` - All previous sessions with detailed context

### Documentation
- `CLAUDE.md` - Complete project documentation (THIS IS YOUR BIBLE)
- `docs/SESSION_2025-10-04_SYSTEMATIC_FIXES.md` - Latest session details
- `docs/SESSION_2025-10-04_RLS_SECURITY_FIXES.md` - Phase 7 security work
- `docs/SESSION_2025-10-04_PRODUCTION_FIXES.md` - Phase 6 PostgREST fixes

### Configuration
- `.erp-agents/erp-config.yaml` - Agentic system configuration
- `.erp-agents/agents/*.md` - Individual agent role definitions
- `.erp-agents/workflows/*.md` - Workflow step-by-step guides

---

## 🔍 Critical Patterns to Follow

### Database Queries (MUST FOLLOW)
```typescript
// ✅ ALWAYS use snake_case for column names
await supabase
  .from('clients')
  .select('id, company_name, contact_person')
  .eq('is_active', true)
  .order('created_at', { ascending: false })

// ❌ NEVER use camelCase or deletedAt
await supabase
  .from('clients')
  .select('id, companyName, contactPerson')  // ❌ WRONG
  .eq('deletedAt', null)                     // ❌ Column doesn't exist
  .order('createdAt', { ascending: false })  // ❌ WRONG
```

### Soft Deletes
```typescript
// ✅ CORRECT - Use is_active
.eq('is_active', true)
.update({ is_active: false })

// ❌ WRONG - deletedAt doesn't exist
.is('deleted_at', null)
.update({ deleted_at: new Date() })
```

### PostgREST Foreign Keys
```typescript
// ❌ ANTI-PATTERN - Nested foreign keys cause 400/500 errors
const { data } = await supabase
  .from('invoices')
  .select(`
    *,
    client:clients!inner(
      *,
      contacts:contacts(*)  // ❌ Nested = FAILS
    )
  `)

// ✅ BEST PRACTICE - Separate queries + manual mapping
const { data: invoices } = await supabase.from('invoices').select('*')
const clientIds = [...new Set(invoices.map(i => i.client_id))]
const { data: clients } = await supabase.from('clients').select('*').in('id', clientIds)
const clientMap = clients.reduce((acc, c) => { acc[c.id] = c; return acc }, {})
const result = invoices.map(inv => ({ ...inv, client: clientMap[inv.client_id] }))
```

---

## 🛠️ Common Development Tasks

### Adding a New API Endpoint
1. Create file in `app/api/[module]/[endpoint]/route.ts`
2. Import and use `authenticateAndAuthorize` from `@/lib/auth/api-auth`
3. Always use snake_case for database column names
4. Use separate queries instead of nested foreign keys
5. Test with `npm run type-check` before committing

### Fixing a Bug
1. Check `docs/SESSION_*` files for similar past issues
2. Use `*workflow bugfix` to get systematic approach
3. Update `.erp-agents/data/session-history.json` when done
4. Create session documentation in `docs/`

### Running Security Audit
```bash
./scripts/security-check-detailed.sh
# Or use the agent command:
*security
```

---

## 📋 Known Active Issues

### Low Priority (WARN-level)
1. **Function search_path** - 2 security definer functions need `SET search_path = public`
   - `set_user_role_in_jwt`
   - `get_user_role_from_jwt`
   - **Estimated Time**: 10 minutes
   - **File**: `supabase/schema.sql`

2. **Leaked Password Protection** - Enable in Supabase Auth settings
   - **Estimated Time**: 2 minutes
   - **Location**: Supabase Dashboard → Auth → Settings

---

## 🎓 Lessons from Phase 8

1. **Automation is Key**: For 100+ instances of same bug, create Python/shell script
2. **Database Schema is Truth**: TypeScript doesn't validate string column names
3. **Vercel Cache Issues**: Fresh git push clears stale build cache
4. **Pattern Documentation**: Always document anti-patterns to prevent recurrence
5. **Systematic Approach**: Identify root cause → automate fix → verify → document

---

## 🚀 Recommended Next Steps

### High Priority
1. **ESLint Custom Rule** - Detect camelCase in Supabase query methods
   - Prevents future database query bugs
   - Estimated: 2 hours

2. **Type-Safe Queries** - Generate TypeScript types from Supabase schema
   - Use `supabase gen types typescript`
   - Estimated: 1 hour

3. **Integration Tests** - Add tests for critical API endpoints
   - Focus on invoices, clients, payments
   - Estimated: 4 hours

### Medium Priority
4. **Pre-commit Hooks** - Run type-check + security audit automatically
   - Already have script: `scripts/security-check-detailed.sh`
   - Estimated: 30 minutes

5. **Query Helper Library** - Type-safe wrapper around Supabase client
   - Enforce snake_case at compile time
   - Estimated: 3 hours

### Low Priority
6. **Fix WARN-level Security Issues** - Function search_path fixes
   - See Active Issues section above
   - Estimated: 10 minutes

---

## 📞 Getting Started

### First Steps for New Agent Session
1. Read this file completely
2. Check `project-status.json` for current state
3. Review latest session in `session-history.json`
4. Ask user what they need help with
5. Use appropriate `*agent` or `*workflow` command
6. Update session history when done

### Example Session Start
```bash
# 1. Check project health
*status

# 2. If adding a feature, use feature workflow
*workflow feature

# 3. If fixing bugs, transform to specialist
*agent backend-guard

# 4. Before deployment, always validate
*deploy
```

---

## 🔗 Important Links

- **Production**: https://blackgoldunited.vercel.app
- **Supabase**: Check `.env.local` for project URL
- **Vercel**: Auto-deploys on push to main branch
- **GitHub**: Repository with all commits

---

**Remember**: You are part of an agentic system. Always update session history and project status after completing work!

**Good Luck!** 🚀
