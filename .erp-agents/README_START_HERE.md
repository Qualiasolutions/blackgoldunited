# 🚀 Start Here - Next Agent Session

**Last Updated**: October 5, 2025
**Current Status**: Phase 8 Complete ✅

---

## ⚡ QUICKEST START (30 seconds)

Run this ONE command:
```bash
source .erp-agents/START_HERE.sh
```

This will show you:
- ✅ Current project status (100% complete, 0 errors)
- ✅ Latest session summary (Phase 8: 192 bugs fixed)
- ✅ Active issues (currently none critical)
- ✅ Critical patterns to remember
- ✅ Production health check
- ✅ Available commands

---

## 📖 FULL CONTEXT (5 minutes)

Read this file:
```bash
cat docs/QUICK_START_NEXT_AGENT.md
```

**Contains**:
- Complete system state
- All available commands
- Database query patterns (snake_case, no deletedAt)
- PostgREST anti-patterns
- Common tasks with examples
- Recommended next steps

---

## 📊 DETAILED CONTEXT (25 minutes)

Follow this sequence:

### 1. Quick Start Guide (5 min)
```bash
cat docs/QUICK_START_NEXT_AGENT.md
```

### 2. Current Metrics (2 min)
```bash
cat .erp-agents/data/project-status.json | jq '.'
```

### 3. Latest Session (3 min)
```bash
cat .erp-agents/data/session-history.json | jq '.sessions[0]'
```

### 4. Phase 8 Details (5 min)
```bash
cat docs/SESSION_2025-10-04_SYSTEMATIC_FIXES.md
```

### 5. Full Project Docs (10 min)
```bash
cat CLAUDE.md | less
```

---

## 🎯 TL;DR - ABSOLUTE MINIMUM

**3 Commands Only**:
```bash
# 1. Quick overview
cat docs/QUICK_START_NEXT_AGENT.md

# 2. Current status
cat .erp-agents/data/project-status.json | jq '.completion, .quality_metrics'

# 3. Latest work
cat .erp-agents/data/session-history.json | jq '.sessions[0].summary'
```

---

## ✨ What You Need to Know

### Current State
- **Phase**: 8/8 Complete
- **Pages**: 61/61 Done
- **Build**: PASSING ✅
- **Production**: STABLE ✅
- **TypeScript Errors**: 0
- **Critical Issues**: 0

### Last Session (Phase 8)
- Fixed 192 production bugs
- Automated fixes with Python scripts
- Established critical patterns:
  - ✅ Use snake_case (company_name)
  - ❌ Never use camelCase (companyName)
  - ✅ Use is_active for soft deletes
  - ❌ Never use deletedAt

### Available Commands
```bash
*status                    # Project health
*agent backend-guard       # Transform to backend specialist
*workflow feature          # Start feature workflow
*deploy                    # Pre-deployment checks
```

---

## 🔗 File Reference

| File | Purpose | Read Time |
|------|---------|-----------|
| `START_HERE.sh` | Quick status display | Run script |
| `NEXT_SESSION_START.md` | Step-by-step startup guide | 5 min |
| `docs/QUICK_START_NEXT_AGENT.md` | Complete reference | 5 min |
| `data/project-status.json` | Live metrics | 2 min |
| `data/session-history.json` | Past sessions | 3 min |

---

## 🎓 Remember

1. **Always** read `docs/QUICK_START_NEXT_AGENT.md` first
2. **Check** `project-status.json` for current state
3. **Follow** established patterns (snake_case, is_active)
4. **Update** `session-history.json` when you complete work
5. **Document** new patterns and lessons learned

---

## 🚨 Critical Patterns (DON'T FORGET!)

### Database Queries
```typescript
// ✅ CORRECT
.eq('company_name', value)
.eq('is_active', true)
.order('created_at', { ascending: false })

// ❌ WRONG
.eq('companyName', value)     // camelCase doesn't exist
.eq('deletedAt', null)        // Column doesn't exist
.order('createdAt', ...)      // Wrong case
```

### PostgREST Joins
```typescript
// ❌ WRONG - Nested foreign keys fail
.select(`*, client:clients!inner(contacts:contacts(*))`)

// ✅ CORRECT - Separate queries + manual mapping
const items = await supabase.from('table').select('*')
const related = await supabase.from('related').select('*').in('id', ids)
// Then map manually
```

---

**Ready to start? Run**: `source .erp-agents/START_HERE.sh`

Good luck! 🚀
