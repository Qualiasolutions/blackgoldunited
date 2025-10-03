# Agent System - Quick Reference

## 🚀 Essential Commands

### Daily Development
```bash
/health-check              # Quick system health status
/production-status         # Production deployment dashboard
```

### Before Committing
```bash
npm run type-check         # TypeScript validation
npm run lint              # Code quality check
/validate-api             # API authentication check
```

### Before Deploying
```bash
/security-audit           # Security vulnerability scan
/validate-api             # API validation
/check-database           # Database integrity check
/run-tests all            # Run all tests
/deploy-production        # Execute deployment
```

### Bug Fixing
```bash
/hunt-bugs                # Analyze and fix production bugs
/fix-module [name]        # Fix specific module issues
/fix-null-safety [module] # Fix null safety in module
```

### Creating Features
```bash
/create-module [name] features:[...]  # Scaffold new module
/create-api module:[name] endpoint:[name] methods:[...]  # Create API
```

## 📋 10 Specialized Agents

1. **erp-api-validator** - API & auth validation
2. **erp-database-guardian** - Database & RLS monitoring
3. **erp-frontend-doctor** - Frontend bug fixes
4. **erp-module-architect** - Module scaffolding
5. **erp-security-auditor** - Security audits
6. **erp-deployment-specialist** - Deployment management
7. **erp-performance-optimizer** - Performance tuning
8. **erp-testing-engineer** - Test creation
9. **erp-bug-hunter** ⚡ - Bug identification (auto-active)
10. **erp-documentation-writer** - Documentation updates

## 🔧 Hooks (Auto-run)

### Pre-Tool-Use
- **Edit**: File validation + backup
- **Write**: Overwrite confirmation
- **Bash**: Blocks `rm -rf`, confirms `git push --force`

### Post-Tool-Use
- **Edit**: TypeScript type-check
- **Write**: Syntax validation
- **Migration**: Database backup

### Pre-Deployment
1. Type-check ✓
2. Build validation ✓
3. Environment validation ✓
4. Security audit ✓

## 🔒 MCP Permissions

### ✅ Auto-Allowed
- Supabase: read operations, logs, stats
- Filesystem: read, list, search
- Git: add, commit, push (non-force)
- NPM: type-check, build, lint

### ❌ Blocked
- Supabase: create/pause/delete project
- Destructive operations

### ⚠️ Requires Confirmation
- Database migrations
- File writes/edits
- Force push
- NPM publish

## 📁 File Locations

```
.claude/
├── agents.json              # Agent definitions
├── commands.json            # Slash commands
├── hooks.json              # Hook configurations
├── settings.local.json     # MCP permissions
└── logs/errors.log         # Error logs

scripts/hooks/
├── validate-api-auth.sh    # API validation
├── post-edit-typecheck.sh  # Type checking
├── update-db-types.sh      # Type generation
└── error-logger.sh         # Error logging
```

## 🎯 Common Issues

| Issue | Solution |
|-------|----------|
| Agent not responding | Use explicit slash command |
| Hooks not running | Check `.claude/settings.local.json` |
| Permission denied | Update permissions in settings |
| Type-check fails | Fix TypeScript errors shown |
| Validation fails | Read output, fix issues reported |

## 💡 Pro Tips

1. Run `/health-check` daily
2. Use `/validate-api` after API changes
3. Run `/security-audit` before every deploy
4. Let hooks run - they prevent mistakes
5. Use `/production-status` to monitor live system
6. Always use `/deploy-production` for consistency

---

**Need Help?** See full documentation: `docs/AGENT_SYSTEM.md`
