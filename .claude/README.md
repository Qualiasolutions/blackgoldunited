# BlackGoldUnited ERP - Claude Agent System

**Version**: 1.0
**Deployed**: October 3, 2025

## Overview

This directory contains the AI agent system configuration for automated development, maintenance, and deployment of the BlackGoldUnited ERP application.

## Directory Structure

```
.claude/
├── README.md                  # This file
├── agents.json               # 10 specialized agent definitions
├── commands.json             # 15 custom slash command configurations
├── hooks.json               # Automation hook definitions
├── settings.local.json      # MCP permissions and project settings
├── health/                  # Health monitoring files
├── security/                # Security audit files
└── logs/                    # Execution and error logs
    └── errors.log          # Automated error logging
```

## Quick Start

### Essential Commands

```bash
# System Health
/health-check              # Quick system status
/production-status         # Production dashboard

# Validation
/validate-api             # API authentication check
/check-database           # Database integrity
/verify-rbac              # RBAC permissions

# Bug Fixing
/hunt-bugs                # Analyze production bugs
/fix-module sales         # Fix specific module
/fix-null-safety all      # Fix null safety issues

# Deployment
/security-audit           # Security scan
/deploy-production        # Execute deployment
```

### Before Every Commit

Automated pre-commit hooks run:
1. TypeScript type-check
2. ESLint validation
3. Security audit

### Before Every Deployment

Automated pre-deployment hooks run:
1. Type-check
2. Build validation
3. Environment validation
4. Security audit

## 10 Specialized Agents

1. **erp-api-validator** - API & authentication validation
2. **erp-database-guardian** - Database schema & RLS monitoring
3. **erp-frontend-doctor** - Frontend bug diagnosis & fixes
4. **erp-module-architect** - New module scaffolding
5. **erp-security-auditor** - Comprehensive security audits
6. **erp-deployment-specialist** - Deployment management
7. **erp-performance-optimizer** - Performance optimization
8. **erp-testing-engineer** - Test suite creation
9. **erp-bug-hunter** ⚡ - Bug identification (auto-active)
10. **erp-documentation-writer** - Documentation updates

## Automation Hooks

### Auto-triggered Events

- **On Edit**: Type-check, backup creation
- **On Write**: Syntax validation, format check
- **On API Change**: Auth validation, doc update
- **On Schema Change**: RLS validation, type generation
- **On Permission Change**: RBAC verification
- **Pre-Deployment**: Full validation pipeline
- **Post-Deployment**: Health checks

## MCP Integrations

**Enabled Servers**:
- **Supabase** - Database operations
- **Filesystem** - File operations
- **Context7** - Documentation search
- **Shadcn** - UI component management

**Security Settings**:
- ✅ Read operations auto-approved
- ❌ Destructive operations blocked
- ⚠️ Migrations require confirmation

## Configuration Files

### `agents.json`
Defines 10 specialized agents with:
- Capabilities and triggers
- System prompts
- Tool access permissions
- Auto-activation settings

### `commands.json`
Defines 15 slash commands with:
- Command arguments
- Execution steps
- Associated agents
- Output formats

### `hooks.json`
Defines automation hooks for:
- Pre/post tool execution
- File change events
- Deployment phases
- Error handling

### `settings.local.json`
Configures:
- MCP server permissions
- Allowed/denied/ask operations
- Enabled MCP servers

## Documentation

- **Full Guide**: `docs/AGENT_SYSTEM.md`
- **Quick Reference**: `docs/AGENT_QUICK_REFERENCE.md`
- **Project Guide**: `CLAUDE.md` (see AI Agent System section)

## Scripts

Hook scripts in `scripts/hooks/`:
- `validate-api-auth.sh` - API authentication validation
- `post-edit-typecheck.sh` - Post-edit type checking
- `update-db-types.sh` - Database type regeneration
- `error-logger.sh` - Error logging utility

## Support

For issues or questions:
1. Check `docs/AGENT_SYSTEM.md`
2. Review configuration files in this directory
3. Check error logs in `.claude/logs/`
4. Contact project maintainers

---

**Maintained By**: BlackGoldUnited ERP Development Team
**Last Updated**: October 3, 2025
