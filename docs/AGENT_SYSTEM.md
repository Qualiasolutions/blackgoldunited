# BlackGoldUnited ERP - Agent System Documentation

**Version**: 1.0
**Created**: October 3, 2025
**Author**: Claude Code SDK Agent System

## Overview

The BlackGoldUnited ERP project now includes a comprehensive AI agent system designed to automate development tasks, maintain code quality, and accelerate production readiness. This system consists of 10 specialized agents, 15 custom slash commands, automated hooks, and enhanced MCP server integrations.

## Table of Contents

1. [Specialized Agents](#specialized-agents)
2. [Custom Slash Commands](#custom-slash-commands)
3. [Automation Hooks](#automation-hooks)
4. [MCP Server Configuration](#mcp-server-configuration)
5. [Quick Start Guide](#quick-start-guide)
6. [Common Workflows](#common-workflows)
7. [Troubleshooting](#troubleshooting)

---

## Specialized Agents

The agent system includes 10 specialized agents, each designed for specific ERP maintenance tasks:

### 1. **erp-api-validator**
**Purpose**: Validates API endpoints, authentication, and RBAC permissions
**Auto-activate**: No
**Triggers**: `api`, `auth`, `permissions`, `rbac`

**Capabilities**:
- API route testing across all 14 modules
- Authentication flow validation
- RBAC permission matrix verification
- Supabase RLS policy checking
- Request/response validation

**When to use**:
- After creating new API routes
- When modifying authentication logic
- During security audits
- Before production deployment

**Example**:
```bash
# Invoke agent via command
/validate-api
```

---

### 2. **erp-database-guardian**
**Purpose**: Monitors database schema integrity and RLS policies
**Auto-activate**: No
**Triggers**: `database`, `schema`, `rls`, `migration`, `supabase`

**Capabilities**:
- Schema validation (63 Supabase tables)
- RLS policy auditing
- Migration safety checks
- Data consistency verification
- Foreign key relationship validation

**When to use**:
- Before applying database migrations
- After schema changes
- When troubleshooting data integrity issues
- During database audits

**Example**:
```bash
# Check database health
/check-database
```

---

### 3. **erp-frontend-doctor**
**Purpose**: Diagnoses and fixes frontend issues
**Auto-activate**: No
**Triggers**: `frontend`, `ui`, `page`, `component`, `null`, `typescript`

**Capabilities**:
- TypeScript error resolution
- Null safety fixes (toLocaleString, map, etc.)
- Component debugging
- RBAC UI implementation
- Responsive design validation

**When to use**:
- After TypeScript errors appear
- When fixing null pointer exceptions
- During UI bug fixes
- Before frontend deployments

**Example**:
```bash
# Fix null safety issues in sales module
/fix-null-safety sales

# Fix entire module
/fix-module sales
```

---

### 4. **erp-module-architect**
**Purpose**: Designs and implements new ERP modules or features
**Auto-activate**: No
**Triggers**: `module`, `feature`, `new`, `implement`, `create`

**Capabilities**:
- Module scaffolding
- API route generation
- Database schema design
- Frontend page creation
- RBAC integration

**When to use**:
- Creating new business modules
- Adding major features
- Scaffolding CRUD operations
- Extending ERP functionality

**Example**:
```bash
# Create new module
/create-module moduleName features:['create','list','edit','delete']

# Create API endpoint
/create-api module:sales endpoint:discounts methods:['GET','POST']
```

---

### 5. **erp-security-auditor**
**Purpose**: Performs comprehensive security audits
**Auto-activate**: No
**Triggers**: `security`, `audit`, `vulnerability`, `auth`, `exploit`

**Capabilities**:
- Security vulnerability scanning
- Authentication flow testing
- RLS policy verification
- Environment variable validation
- Dependency audit

**When to use**:
- Before production deployments
- After security-related changes
- During compliance reviews
- Monthly security audits

**Example**:
```bash
# Run full security audit
/security-audit
```

---

### 6. **erp-deployment-specialist**
**Purpose**: Manages deployment processes and production readiness
**Auto-activate**: No
**Triggers**: `deploy`, `production`, `vercel`, `environment`, `build`

**Capabilities**:
- Build validation
- Environment setup
- Vercel deployment
- Health checks
- Rollback procedures

**When to use**:
- Before deploying to production
- Setting up new environments
- Troubleshooting deployment failures
- Monitoring production health

**Example**:
```bash
# Deploy to production
/deploy-production

# Check production status
/production-status
```

---

### 7. **erp-performance-optimizer**
**Purpose**: Optimizes application performance
**Auto-activate**: No
**Triggers**: `performance`, `optimize`, `slow`, `bundle`, `query`

**Capabilities**:
- Bundle size analysis
- Database query optimization
- React component optimization
- Caching strategy
- Load time improvement

**When to use**:
- Application feels slow
- Bundle sizes are too large
- Database queries are inefficient
- Optimizing Core Web Vitals

**Example**:
```bash
# Optimize all aspects
/optimize-performance all

# Optimize bundle size only
/optimize-performance bundle
```

---

### 8. **erp-testing-engineer**
**Purpose**: Creates and maintains test suites
**Auto-activate**: No
**Triggers**: `test`, `testing`, `e2e`, `unit`, `integration`

**Capabilities**:
- Unit test creation
- Integration testing
- E2E test scenarios
- API endpoint testing
- Component testing

**When to use**:
- Adding test coverage
- Before major releases
- After bug fixes
- CI/CD pipeline setup

**Example**:
```bash
# Run all tests
/run-tests all

# Run specific suite
/run-tests e2e
```

---

### 9. **erp-bug-hunter** ⚡
**Purpose**: Identifies, tracks, and fixes bugs
**Auto-activate**: **YES** (automatically active)
**Triggers**: `bug`, `error`, `fix`, `issue`, `console`

**Capabilities**:
- Console error analysis
- Sentry error tracking
- Production log analysis
- Root cause investigation
- Regression prevention

**When to use**:
- Browser console shows errors
- Sentry reports errors
- Users report bugs
- Production monitoring alerts

**Example**:
```bash
# Hunt and fix bugs
/hunt-bugs
```

---

### 10. **erp-documentation-writer**
**Purpose**: Creates and maintains technical documentation
**Auto-activate**: No
**Triggers**: `docs`, `documentation`, `guide`, `readme`

**Capabilities**:
- API documentation
- User guide creation
- Code documentation
- Architecture diagrams
- Deployment guides

**When to use**:
- After adding new features
- When APIs change
- Creating user manuals
- Onboarding new developers

**Example**:
```bash
# Update all documentation
/update-docs all

# Update API docs only
/update-docs api
```

---

## Custom Slash Commands

15 custom slash commands are available for common ERP tasks:

### Quick Commands

| Command | Description | Agent |
|---------|-------------|-------|
| `/health-check` | Quick system health check | None (direct) |
| `/production-status` | Production deployment dashboard | erp-deployment-specialist |

### Validation & Auditing

| Command | Description | Agent |
|---------|-------------|-------|
| `/validate-api` | Validate all API endpoints | erp-api-validator |
| `/check-database` | Audit database schema & RLS | erp-database-guardian |
| `/verify-rbac` | Verify RBAC implementation | erp-api-validator |
| `/security-audit` | Comprehensive security audit | erp-security-auditor |

### Development

| Command | Description | Agent |
|---------|-------------|-------|
| `/create-module` | Scaffold new ERP module | erp-module-architect |
| `/create-api` | Generate new API route | erp-module-architect |
| `/fix-module` | Fix issues in specific module | erp-frontend-doctor |
| `/fix-null-safety` | Fix null safety issues | erp-frontend-doctor |

### Deployment & Optimization

| Command | Description | Agent |
|---------|-------------|-------|
| `/deploy-production` | Execute production deployment | erp-deployment-specialist |
| `/optimize-performance` | Analyze and optimize performance | erp-performance-optimizer |
| `/run-tests` | Execute test suite | erp-testing-engineer |

### Bug Fixing & Documentation

| Command | Description | Agent |
|---------|-------------|-------|
| `/hunt-bugs` | Analyze and fix production bugs | erp-bug-hunter |
| `/update-docs` | Update project documentation | erp-documentation-writer |

---

## Automation Hooks

Hooks automatically run scripts before/after specific events:

### Pre-Tool-Use Hooks

**Edit Tool**:
- Validates file exists before editing
- Creates automatic backup

**Write Tool**:
- Confirms overwrite if file exists
- Prevents accidental data loss

**Bash Tool**:
- **Blocks**: `rm -rf` commands (destructive)
- **Confirms**: `git push --force`, `npm publish`

### Post-Tool-Use Hooks

**Edit Tool**:
- Runs TypeScript type-check after edits
- Validates syntax

**Write Tool**:
- Validates file syntax and format
- Auto-formats if configured

**Migration (Supabase)**:
- Creates database backup after migration
- Logs migration details

### Event-Driven Hooks

**On API Change** (`app/api/**/*.ts`):
- Validates auth middleware exists
- Updates API documentation

**On Schema Change** (`supabase/**/*.sql`):
- Validates RLS policies
- Updates TypeScript types
- Backs up schema

**On Type Change** (`lib/types/**/*.ts`):
- Runs full type-check

**On Permission Change** (`lib/auth/permissions.ts`):
- Verifies RBAC consistency
- Updates documentation

### Deployment Hooks

**Pre-Deployment**:
1. Type-check (required)
2. Build validation (required)
3. Environment validation (required)
4. Security audit (required)

**Post-Deployment**:
1. Health check (required)
2. Sentry error check (optional)

---

## MCP Server Configuration

Enhanced MCP server permissions for automation:

### Allowed Operations (Auto-approved)

**Supabase**:
- `list_projects`, `list_tables`, `get_project`
- `list_extensions`, `list_migrations`
- `execute_sql`, `get_logs`, `get_advisors`

**Filesystem**:
- `read_text_file`, `read_multiple_files`
- `list_directory`, `search_files`

**Bash**:
- `git add/commit/push` (non-force)
- `npm run type-check/build/lint`

### Denied Operations (Always blocked)

- `create_project` (Supabase)
- `pause_project` (Supabase)
- `delete_branch` (Supabase)

### Ask Before Execute (Requires confirmation)

- `apply_migration`, `create_branch`, `merge_branch`
- `write_file`, `edit_file`
- `git push --force`, `rm`, `npm publish`

---

## Quick Start Guide

### 1. Running Your First Agent

```bash
# Check system health
/health-check

# Validate all APIs
/validate-api

# Check database
/check-database
```

### 2. Fixing Common Issues

**Null Safety Errors**:
```bash
/fix-null-safety all
```

**TypeScript Errors**:
```bash
/fix-module sales
```

**Production Bugs**:
```bash
/hunt-bugs
```

### 3. Before Deploying

```bash
# Full pre-deployment check
/security-audit
/validate-api
/check-database
/run-tests all
/deploy-production
```

### 4. Creating New Features

```bash
# Create new module
/create-module contracts features:['create','list','edit','delete']

# Create API endpoint
/create-api module:sales endpoint:promotions methods:['GET','POST','PUT','DELETE']
```

---

## Common Workflows

### Workflow 1: Daily Development

```bash
# Start of day
/health-check
/production-status

# During development
# (hooks auto-run on file changes)

# Before committing
# (pre-commit hooks run automatically)
npm run type-check
npm run lint
./scripts/security-audit-gate.sh
```

### Workflow 2: Bug Fixing

```bash
# Identify bugs
/hunt-bugs

# Fix specific module
/fix-module sales

# Validate fixes
/run-tests integration
/health-check
```

### Workflow 3: New Module Development

```bash
# Create module structure
/create-module loyalty-program features:['create','list','edit','delete']

# Verify RBAC
/verify-rbac

# Test APIs
/validate-api

# Update documentation
/update-docs all
```

### Workflow 4: Production Deployment

```bash
# Pre-deployment validation
/security-audit
/optimize-performance all
/run-tests all

# Deploy
/deploy-production

# Post-deployment monitoring
/production-status
/health-check
```

### Workflow 5: Performance Optimization

```bash
# Analyze performance
/optimize-performance all

# Check specific areas
/optimize-performance bundle
/optimize-performance database

# Validate improvements
/run-tests performance
```

---

## Troubleshooting

### Issue: Agent not responding

**Solution**:
1. Check agent configuration in `.claude/agents.json`
2. Verify triggers match your query
3. Try explicitly calling the agent via slash command

### Issue: Hooks not running

**Solution**:
1. Check hooks are enabled in `.claude/settings.local.json`
2. Verify hook scripts are executable: `chmod +x scripts/hooks/*.sh`
3. Check hook logs in `.claude/logs/`

### Issue: Permission denied errors

**Solution**:
1. Check `.claude/settings.local.json` permissions
2. Add operation to `allow` array if safe
3. Remove from `deny` array if needed

### Issue: Type-check fails after hook

**Solution**:
1. Fix TypeScript errors shown
2. Run `npm run type-check` manually
3. Check `lib/types/` for missing types

### Issue: Validation scripts fail

**Solution**:
1. Read error output carefully
2. Fix issues reported (e.g., missing auth middleware)
3. Re-run validation: `./scripts/hooks/validate-api-auth.sh`

---

## Configuration Files

All agent system files are located in `.claude/`:

```
.claude/
├── agents.json           # Agent definitions and capabilities
├── commands.json         # Slash command configurations
├── hooks.json           # Automation hook definitions
├── settings.local.json  # MCP permissions and settings
└── logs/
    └── errors.log       # Error logs from hooks
```

Script files are in `scripts/hooks/`:

```
scripts/hooks/
├── validate-api-auth.sh      # API auth validation
├── post-edit-typecheck.sh    # Post-edit type checking
├── update-db-types.sh        # Database type generation
└── error-logger.sh           # Error logging
```

---

## Best Practices

1. **Use agents proactively**: Don't wait for errors, run validation agents regularly
2. **Let hooks work**: Hooks prevent common mistakes - don't disable them
3. **Review agent suggestions**: Agents are assistants, always review changes
4. **Run pre-deployment checks**: Always use `/deploy-production` for consistency
5. **Keep documentation updated**: Use `/update-docs` after major changes
6. **Monitor production**: Use `/production-status` daily
7. **Security first**: Run `/security-audit` before every deployment
8. **Test thoroughly**: Use `/run-tests all` before merging to main

---

## Support & Feedback

For issues, improvements, or questions about the agent system:

1. Check this documentation first
2. Review agent configurations in `.claude/agents.json`
3. Check logs in `.claude/logs/errors.log`
4. Report issues to project maintainers

---

**Last Updated**: October 3, 2025
**Version**: 1.0
**Maintained By**: BlackGoldUnited ERP Development Team
