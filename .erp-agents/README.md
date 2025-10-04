# BlackGoldUnited ERP - Agentic Development System

**Version**: 1.0.0
**Date**: October 4, 2025
**Inspired by**: BMad Method (SophiaAI project)

---

## 🎯 Overview

This is a comprehensive agentic development system for the BlackGoldUnited ERP project. It provides:

- **1 Master Orchestrator**: Coordinates all development activities
- **6 Specialist Agents**: Domain experts for specific tasks
- **6 Workflow Templates**: Systematic approaches for common dev scenarios
- **Project Tracking**: Real-time status monitoring and progress tracking
- **Command System**: Simple `*command` interface for all operations

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ERP Master Orchestrator                  │
│              (Coordinate, Track, Transform)                 │
└─────────────────────────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
┌───────────▼────────┐  ┌───▼──────┐  ┌─────▼──────────┐
│  Backend Guard     │  │ Database │  │  Frontend      │
│  (API & Server)    │  │ Guardian │  │  Doctor        │
└────────────────────┘  └──────────┘  └────────────────┘
            │                │                │
┌───────────▼────────┐  ┌───▼──────┐  ┌─────▼──────────┐
│  Security Auditor  │  │ DevOps   │  │  QA Validator  │
│  (Vulnerabilities) │  │ Engineer │  │  (Testing)     │
└────────────────────┘  └──────────┘  └────────────────┘
```

---

## 🚀 Quick Start

### Activate the Orchestrator

```
User: *help
Orchestrator: [Shows complete command list and project status]

User: I want to add a new feature
Orchestrator: I'll help you plan this feature. What feature do you want to implement?

User: Add employee leave approval workflow
Orchestrator: *plan feature "Employee leave approval workflow"
→ Creates step-by-step execution plan
→ Identifies required agents
→ Shows estimated time and complexity
```

### Transform to Specialist Agent

```
User: *agent database-guardian
Orchestrator: Transforming to Database Guardian...

Database Guardian: 💾 Database Guardian activated.
I specialize in PostgreSQL schema, migrations, and RLS policies.
How can I help with database operations?
```

### Execute Workflow

```
User: *workflow feature
Orchestrator: Starting Feature Implementation Workflow...

Workflow Steps:
1. Planning & Design (15-30 min)
2. Database Schema (database-guardian)
3. Backend APIs (backend-guard)
4. Frontend UI (frontend-doctor)
5. Integration Testing (qa-validator)
6. Deployment (devops-engineer)

Shall we proceed?
```

---

## 📋 Available Commands

All commands start with `*` prefix.

### Core Commands
- `*help` - Show available agents, workflows, and project status
- `*status` - Show project health dashboard
- `*health` - Run comprehensive health check
- `*modules` - Show all 14 modules and their status
- `*exit` - Return to base mode

### Agent Management
- `*agent [name]` - Transform into specialist agent
  - `backend-guard` - API routes, server logic
  - `frontend-doctor` - UI components, pages
  - `database-guardian` - Schema, migrations, RLS
  - `security-auditor` - Security scans
  - `devops-engineer` - Deployments, CI/CD
  - `qa-validator` - Testing, validation

### Workflow Commands
- `*workflow [name]` - Start development workflow
  - `feature` - Implement new feature
  - `bugfix` - Fix production issues
  - `security` - Security improvements
  - `optimization` - Performance tuning
  - `integration` - Third-party integrations
  - `migration` - Database migrations

### System Operations
- `*deploy` - Pre-deployment validation + deploy
- `*rollback` - Emergency rollback procedures
- `*security` - Run security audit
- `*apis` - Show API endpoint health
- `*db` - Show database status

---

## 🤖 Specialist Agents

### 🛡️ Backend Guard
**Expert in**: API routes, authentication, server-side logic

**Use for**:
- Creating/fixing API endpoints
- Authentication issues
- Business logic implementation
- Server-side validation

**Delivers**:
- API routes (`app/api/**/route.ts`)
- Middleware functions
- Server utilities

**Example**:
```
User: *agent backend-guard
User: Create an API endpoint for employee attendance check-in

Backend Guard:
✓ Creating app/api/attendance/check-in/route.ts
✓ Adding authenticateAndAuthorize middleware
✓ Implementing POST handler
✓ Validating employee_id and timestamp
✓ Testing endpoint

API endpoint ready: POST /api/attendance/check-in
```

### 🎨 Frontend Doctor
**Expert in**: Next.js pages, React components, UI/UX

**Use for**:
- Creating new pages
- Fixing UI issues
- Component development
- Form implementation

**Delivers**:
- Pages (`app/**/page.tsx`)
- Components (`components/**/*.tsx`)
- Hooks (`lib/hooks/**/*.ts`)

### 💾 Database Guardian
**Expert in**: PostgreSQL, Supabase, migrations, RLS

**Use for**:
- Schema changes
- Writing migrations
- RLS policy creation
- Query optimization

**Delivers**:
- Migration files (`supabase/*.sql`)
- RLS policies
- Database utilities

**Critical Rule**: ALWAYS enable RLS after creating policies
```sql
-- ❌ INSUFFICIENT
CREATE POLICY "policy_name" ON table_name ...;

-- ✅ REQUIRED
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 🔒 Security Auditor
**Expert in**: Security audits, RLS, authentication, OWASP

**Use for**:
- Security reviews
- Vulnerability scanning
- Compliance checks
- Penetration testing

**Delivers**:
- Security reports
- Vulnerability fixes
- Audit logs

**Tools**:
- `./scripts/security-check-detailed.sh`
- Supabase linter integration
- Manual code review

### 🚀 DevOps Engineer
**Expert in**: Vercel, CI/CD, monitoring, performance

**Use for**:
- Deployment issues
- Build optimization
- Monitoring setup
- Performance tuning

**Delivers**:
- Deploy scripts
- CI/CD configurations
- Monitoring dashboards

### ✅ QA Validator
**Expert in**: Testing, validation, quality gates

**Use for**:
- Test creation
- QA checks
- Regression testing
- Quality validation

**Delivers**:
- Test suites
- Validation reports
- QA gate checklists

---

## 📊 Project Tracking

### Current Status (Auto-updated)
```json
{
  "overall_completion": "100%",
  "pages": "61/61 ✅",
  "modules": "14/14 ✅",
  "phases": "7/7 ✅",
  "typescript_errors": 0,
  "health": "STABLE",
  "last_update": "October 4, 2025"
}
```

### Module Coverage
All 14 modules at 100% completion:
- ✅ Dashboard (1 page)
- ✅ Sales (11 pages)
- ✅ Clients (4 pages)
- ✅ Inventory (12 pages)
- ✅ Purchase (7 pages)
- ✅ Finance (4 pages)
- ✅ Accounting (6 pages)
- ✅ Employees (3 pages)
- ✅ Organizational (5 pages)
- ✅ Attendance (9 pages)
- ✅ Payroll (7 pages)
- ✅ Reports (7 pages)
- ✅ Templates (5 pages)
- ✅ QHSE (4 pages)

### Quality Metrics
- TypeScript errors: **0** ✅
- Build status: **PASSING** ✅
- Security (critical): **0 issues** ✅
- Security (warnings): **3 issues** ⚠️
- Deployment: **STABLE** ✅

---

## 🔄 Workflow Examples

### 1. Feature Implementation
```
*workflow feature
→ Planning (15-30 min)
→ Database (database-guardian)
→ Backend (backend-guard)
→ Frontend (frontend-doctor)
→ Testing (qa-validator)
→ Deploy (devops-engineer)
```

### 2. Bug Fix
```
*workflow bugfix
→ Reproduce issue
→ Diagnose root cause
→ Apply fix
→ Test thoroughly
→ Deploy to production
→ Verify fix
```

### 3. Security Improvement
```
*workflow security
→ Run security audit
→ Identify vulnerabilities
→ Prioritize fixes
→ Implement fixes
→ Verify resolution
→ Document changes
```

---

## 📁 Directory Structure

```
.erp-agents/
├── agents/                      # Agent definitions
│   ├── erp-orchestrator.md     # Master orchestrator
│   ├── backend-guard.md        # Backend specialist
│   ├── frontend-doctor.md      # Frontend specialist
│   ├── database-guardian.md    # Database specialist
│   ├── security-auditor.md     # Security specialist
│   ├── devops-engineer.md      # DevOps specialist
│   └── qa-validator.md         # QA specialist
│
├── workflows/                   # Workflow templates
│   ├── feature-workflow.md     # Feature implementation
│   ├── bugfix-workflow.md      # Bug fixing
│   ├── security-workflow.md    # Security improvements
│   ├── optimization-workflow.md # Performance tuning
│   ├── integration-workflow.md  # Third-party integration
│   └── migration-workflow.md    # Database migrations
│
├── tasks/                       # Specific task templates
│   ├── create-api-endpoint.md
│   ├── create-page.md
│   ├── create-migration.md
│   └── ...
│
├── checklists/                  # Quality checklists
│   ├── pre-deployment.md
│   ├── post-deployment.md
│   ├── security-review.md
│   └── ...
│
├── templates/                   # Code templates
│   ├── api-route-template.ts
│   ├── page-template.tsx
│   ├── migration-template.sql
│   └── ...
│
├── data/                        # Project data
│   ├── project-status.json     # Real-time status
│   ├── module-coverage.json
│   ├── api-inventory.json
│   └── security-baseline.json
│
├── erp-config.yaml             # System configuration
└── README.md                    # This file
```

---

## 🎓 Best Practices

### TypeScript
- ✅ Maintain 0 errors always
- ✅ Run `type-check` before commits
- ✅ Use strict mode
- ✅ Define interfaces for all data

### Security
- ✅ All API routes use `authenticateAndAuthorize()`
- ✅ Enable RLS on all new tables immediately
- ✅ Validate all user inputs
- ✅ Use parameterized queries
- ✅ Never expose service role key

### Database
- ✅ Use separate queries over nested PostgREST joins
- ✅ Manual data mapping for reliability
- ✅ Apply RLS immediately after creating policies
- ✅ Track all migrations in Supabase

### Deployment
- ✅ Type check: `npm run type-check`
- ✅ Build test: `npm run build`
- ✅ Security audit: `./scripts/security-check-detailed.sh`
- ✅ Commit with detailed messages
- ✅ Auto-deploy via Vercel on main push

### Documentation
- ✅ Update CLAUDE.md for major changes
- ✅ Create session notes for complex work
- ✅ Document patterns and anti-patterns
- ✅ Keep API documentation current

---

## ⚠️ Anti-Patterns

- ❌ Nested PostgREST foreign key joins (use separate queries)
- ❌ RLS policies without enabling RLS
- ❌ Missing API authentication
- ❌ Hardcoded credentials
- ❌ Exposing service role key
- ❌ Skipping type checks

---

## 🔗 Integration with Existing Tools

### MCP Servers
- **Supabase MCP**: Database operations, migrations
- **Filesystem MCP**: File operations
- **Context7 MCP**: Documentation lookup
- **Shadcn MCP**: Component installation
- **Playwright MCP**: Browser testing

### Scripts
- `./scripts/security-check-detailed.sh` - Security audit
- `npm run type-check` - TypeScript validation
- `npm run build` - Production build
- `npm run deploy` - Vercel deployment

### Documentation
- `CLAUDE.md` - Project overview and all phases
- `docs/AGENT_SYSTEM.md` - AI agent system (deprecated, see this file)
- `docs/SESSION_*.md` - Session notes for each phase

---

## 📞 Getting Help

### Within Agent System
```
*help          # Show all commands
*status        # Show project health
*agent [name]  # Get specialist help
```

### External Resources
- CLAUDE.md: Complete project history
- docs/: All project documentation
- .erp-agents/data/: Real-time project data

---

## 🎯 Next Steps

1. **Activate Orchestrator**: Type `*help` to get started
2. **Check Status**: Run `*status` to see project health
3. **Choose Task**: Describe what you want to do
4. **Get Routed**: Orchestrator will route you to the right specialist
5. **Execute**: Follow the systematic workflow

---

**Remember**: This system is designed to maintain the high quality and stability of the BlackGoldUnited ERP system. Always follow established patterns, test thoroughly, and document changes.

**Status**: 🟢 Production-Ready | **Health**: STABLE | **Last Update**: October 4, 2025
