# 🚀 Next Session Start Commands

**Purpose**: Run these commands at the start of your next session to get full project context.

---

## 📋 Step-by-Step Startup Sequence

### 1. Read Quick Start Guide (FIRST!)
```bash
# Read this file first - it has everything you need
cat docs/QUICK_START_NEXT_AGENT.md
```
**Why**: 258-line comprehensive guide with current status, patterns, and workflows

---

### 2. Check Current Project Status
```bash
# View real-time project health metrics
cat .erp-agents/data/project-status.json | jq '.'
```
**What you'll see**:
- Overall completion: 100% (8 phases done)
- Quality metrics: 0 TypeScript errors, 0 security critical issues
- Recent changes: Phase 8 (192 bugs fixed)
- Active issues: 2 low-priority WARN-level items
- Planned work with time estimates

---

### 3. Review Latest Session History
```bash
# See what was done in Phase 8
cat .erp-agents/data/session-history.json | jq '.sessions[0]'
```
**What you'll learn**:
- 192 bugs fixed (115 deletedAt + 77 camelCase)
- 2 automation scripts created (Python)
- Patterns established (snake_case, is_active for soft deletes)
- 8 commits with detailed breakdown

---

### 4. Read Main Project Documentation
```bash
# Complete project overview (THIS IS YOUR BIBLE)
cat CLAUDE.md | head -100  # First 100 lines for overview
```
**Contains**:
- All 8 phases documented
- Module structure (14 modules, 61 pages)
- Authentication & RBAC system
- Database patterns and anti-patterns
- API structure and conventions

---

### 5. Check Latest Phase Documentation
```bash
# Phase 8 detailed session notes
cat docs/SESSION_2025-10-04_SYSTEMATIC_FIXES.md
```
**What you'll find**:
- Root cause analysis (deletedAt, camelCase)
- Automated fix scripts used
- Module-by-module statistics
- Code examples (wrong vs correct)
- Future recommendations

---

### 6. Verify Production Health
```bash
# Check if production is running correctly
curl -s https://blackgoldunited.vercel.app/api/health | jq '.'
```
**Expected output**: `{"status":"ok"}`

---

### 7. Check Build Status
```bash
# Verify local build works
npm run type-check
```
**Expected**: `Found 0 errors`

---

### 8. Review Git Status
```bash
# See if there are any uncommitted changes
git status
```
**Expected**: Clean working directory (pending push may exist if network was down)

---

## 🎯 Quick Context Summary Commands

### One-Line Project Status
```bash
echo "Phase: 8/8 Complete | Pages: 61/61 | Bugs: 0 | Build: PASSING | Production: STABLE"
```

### View All Phases
```bash
cat .erp-agents/data/project-status.json | jq '.phases[] | {phase: .phase, name: .name, status: .status, date: .completion_date}'
```

### Check Security Status
```bash
cat .erp-agents/data/project-status.json | jq '.security, .quality_metrics | {rls_tables: .rls_enabled_tables, critical_issues: .security_critical_issues, ts_errors: .typescript_errors, build: .build_status}'
```

### See Recent Changes
```bash
cat .erp-agents/data/project-status.json | jq '.recent_changes[0:3]'
```

---

## 🔍 Critical Patterns to Remember

### Database Queries (Read from session-history.json)
```bash
cat .erp-agents/data/session-history.json | jq '.sessions[0].patterns_established'
```
**Output**:
- Always use snake_case for PostgreSQL columns
- Use is_active=false for soft deletes (not deletedAt)
- Create automated scripts for bulk fixes

### Anti-Patterns (From Phase 6 & 8)
```bash
# Phase 6: PostgREST anti-pattern
grep -A 10 "Anti-Pattern" docs/SESSION_2025-10-04_PRODUCTION_FIXES.md

# Phase 8: Database query anti-patterns
grep -A 5 "WRONG" docs/SESSION_2025-10-04_SYSTEMATIC_FIXES.md
```

---

## 🛠️ Available Agent Commands

### Transform to Specialist
```bash
# Backend API work
*agent backend-guard

# Frontend/UI work
*agent frontend-doctor

# Database work
*agent database-guardian

# Security work
*agent security-auditor

# DevOps/deployment work
*agent devops-engineer

# Testing/QA work
*agent qa-validator
```

### Start a Workflow
```bash
*workflow feature       # For new features
*workflow bugfix        # For bug fixes
*workflow security      # For security improvements
*workflow performance   # For optimization
*workflow migration     # For database changes
```

### Check & Validate
```bash
*status    # Project health dashboard
*deploy    # Pre-deployment validation
*security  # Run security audit
*build     # Run production build
```

---

## 📊 Files You Should Know About

### Project Configuration
- `CLAUDE.md` - **MAIN DOCUMENTATION** (read first!)
- `.erp-agents/erp-config.yaml` - Agentic system config
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration

### Agent System Files
- `.erp-agents/data/project-status.json` - Live project metrics
- `.erp-agents/data/session-history.json` - All past sessions
- `.erp-agents/agents/*.md` - Agent role definitions
- `.erp-agents/workflows/*.md` - Workflow guides

### Session Documentation (Read in order)
1. `docs/SESSION_2025-10-04_SYSTEMATIC_FIXES.md` - Phase 8 (latest)
2. `docs/SESSION_2025-10-04_RLS_SECURITY_FIXES.md` - Phase 7
3. `docs/SESSION_2025-10-04_PRODUCTION_FIXES.md` - Phase 6

### Scripts Available
- `scripts/security-check-detailed.sh` - Comprehensive security audit
- `scripts/mcp-health-monitor.sh` - MCP server health check
- Python scripts from Phase 8 (available in session history context)

---

## 🎓 What Each File Will Tell You

| File | What You Learn | Time to Read |
|------|----------------|--------------|
| `docs/QUICK_START_NEXT_AGENT.md` | Current state, patterns, next steps | 5 min |
| `.erp-agents/data/project-status.json` | Metrics, phases, active issues | 2 min |
| `.erp-agents/data/session-history.json` | Phase 8 detailed breakdown | 3 min |
| `CLAUDE.md` (overview) | Project structure, modules | 10 min |
| `docs/SESSION_2025-10-04_SYSTEMATIC_FIXES.md` | Latest fixes, automation | 5 min |

**Total**: ~25 minutes to get fully up to speed

---

## 🚨 IMPORTANT: Things to Avoid

### ❌ DO NOT
```typescript
// Database queries
.eq('deletedAt', null)              // Column doesn't exist
.eq('companyName', value)           // Use company_name
.order('createdAt', ...)            // Use created_at

// Nested foreign keys
.select(`*, client:clients!inner(
  contacts:contacts(*)              // Causes 400/500 errors
)`)
```

### ✅ ALWAYS DO
```typescript
// Database queries
.eq('is_active', true)              // Soft delete pattern
.eq('company_name', value)          // snake_case
.order('created_at', ...)           // snake_case

// Separate queries + manual mapping
const { data: items } = await supabase.from('table').select('*')
const ids = [...new Set(items.map(i => i.foreign_id))]
const { data: related } = await supabase.from('related').select('*').in('id', ids)
// Then map manually
```

---

## 🎯 Typical First Task

### If User Asks for Help
1. Read `QUICK_START_NEXT_AGENT.md`
2. Check `project-status.json` for active issues
3. Ask clarifying questions
4. Use appropriate `*agent` or `*workflow` command
5. Update `session-history.json` when done

### If Starting New Feature
```bash
# 1. Get context
cat docs/QUICK_START_NEXT_AGENT.md

# 2. Check current status
cat .erp-agents/data/project-status.json | jq '.quality_metrics, .active_issues'

# 3. Start feature workflow
*workflow feature

# 4. Follow the workflow steps
```

### If Fixing a Bug
```bash
# 1. Check if similar bug was fixed before
grep -r "similar_pattern" docs/SESSION_*.md

# 2. Transform to specialist
*agent backend-guard  # or frontend-doctor, database-guardian

# 3. Use bugfix workflow
*workflow bugfix

# 4. Document the fix
```

---

## 📞 TL;DR - Absolute Minimum

**Run these 3 commands minimum**:
```bash
# 1. Quick start guide (MUST READ)
cat docs/QUICK_START_NEXT_AGENT.md

# 2. Current status
cat .erp-agents/data/project-status.json | jq '.completion, .quality_metrics, .active_issues'

# 3. Latest session
cat .erp-agents/data/session-history.json | jq '.sessions[0] | {title, bugs_fixed, patterns_established, next_agent_context}'
```

Then ask the user what they need help with!

---

**Generated**: October 5, 2025, 00:35 UTC
**For**: Next ERP Master Orchestrator session
**Current Status**: Production Stable, Phase 8 Complete, 0 Critical Issues
