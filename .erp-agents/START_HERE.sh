#!/bin/bash
# Quick Start for Next Agent Session
# Run this: source .erp-agents/START_HERE.sh

echo "🤖 ERP Master Orchestrator - Session Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  Warning: 'jq' not installed. Install for better output: sudo apt install jq"
    echo ""
fi

echo "📊 CURRENT PROJECT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v jq &> /dev/null; then
    cat .erp-agents/data/project-status.json | jq -r '
    "Project: \(.project.name) v\(.project.version)",
    "Status: \(.project.status) | Health: \(.project.health)",
    "Last Updated: \(.project.last_updated)",
    "",
    "COMPLETION:",
    "  • Overall: \(.completion.overall_percentage)%",
    "  • Pages: \(.completion.pages_completed)/\(.completion.pages_total)",
    "  • Modules: \(.completion.modules_completed)/\(.completion.modules_total)",
    "  • Phases: \(.completion.phases_completed)/\(.completion.phases_total)",
    "",
    "QUALITY METRICS:",
    "  • TypeScript Errors: \(.quality_metrics.typescript_errors)",
    "  • Build Status: \(.quality_metrics.build_status)",
    "  • Security Critical Issues: \(.quality_metrics.security_critical_issues)",
    "  • Database Query Errors: \(.quality_metrics.database_query_errors)",
    "  • Deployment: \(.quality_metrics.deployment_status)"
    '
else
    echo "Project: BlackGoldUnited ERP v1.0.0"
    echo "Status: PRODUCTION | Health: STABLE"
    echo "Completion: 100% (61/61 pages, 14/14 modules, 8/8 phases)"
    echo "Quality: 0 TS errors, BUILD PASSING, 0 critical issues"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 LATEST SESSION (Phase 8)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v jq &> /dev/null; then
    cat .erp-agents/data/session-history.json | jq -r '.sessions[0] |
    "Title: \(.title)",
    "Date: \(.date)",
    "Status: \(.status)",
    "Bugs Fixed: \(.summary.bugs_fixed)",
    "Files Modified: \(.summary.files_modified)",
    "Commits: \(.summary.commits)",
    "",
    "PATTERNS ESTABLISHED:",
    (.patterns_established[] | "  • \(.)")
    '
else
    echo "Title: Systematic Database Query Fixes"
    echo "Date: 2025-10-05"
    echo "Bugs Fixed: 192 (115 deletedAt + 77 camelCase)"
    echo "Files Modified: 66+"
    echo "Status: COMPLETED ✅"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 ACTIVE ISSUES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v jq &> /dev/null; then
    ACTIVE_COUNT=$(cat .erp-agents/data/project-status.json | jq '.active_issues | length')
    if [ "$ACTIVE_COUNT" -eq 0 ]; then
        echo "✅ No active critical issues!"
        echo ""
        echo "PLANNED WORK (Low Priority):"
        cat .erp-agents/data/project-status.json | jq -r '.planned_work[] |
        "  • [\(.priority)] \(.description) (~\(.estimated_time))"
        '
    else
        cat .erp-agents/data/project-status.json | jq -r '.active_issues[] |
        "  • [\(.priority)] \(.type): \(.description)"
        '
    fi
else
    echo "✅ No active critical issues!"
    echo ""
    echo "PLANNED WORK (Low Priority):"
    echo "  • [LOW] Fix function search_path for 2 functions (~10 min)"
    echo "  • [LOW] Enable leaked password protection (~2 min)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📖 RECOMMENDED READING (in order)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. docs/QUICK_START_NEXT_AGENT.md          (5 min - START HERE!)"
echo "2. .erp-agents/data/project-status.json    (2 min - current metrics)"
echo "3. .erp-agents/data/session-history.json   (3 min - latest work)"
echo "4. docs/SESSION_2025-10-04_SYSTEMATIC_FIXES.md (5 min - Phase 8 details)"
echo "5. CLAUDE.md                               (10 min - full project docs)"
echo ""
echo "Total: ~25 minutes to get fully up to speed"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 AVAILABLE COMMANDS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Agent Transformation:"
echo "  *agent backend-guard      - Backend API specialist"
echo "  *agent frontend-doctor    - Frontend/UI specialist"
echo "  *agent database-guardian  - Database specialist"
echo "  *agent security-auditor   - Security specialist"
echo ""
echo "Workflows:"
echo "  *workflow feature         - Feature implementation"
echo "  *workflow bugfix          - Bug fixing"
echo "  *workflow security        - Security improvements"
echo ""
echo "Validation:"
echo "  *status                   - Project health dashboard"
echo "  *deploy                   - Pre-deployment checks"
echo "  *security                 - Security audit"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎓 CRITICAL PATTERNS (from Phase 8)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALWAYS use snake_case:    .eq('company_name', value)"
echo "❌ NEVER use camelCase:      .eq('companyName', value)"
echo ""
echo "✅ ALWAYS use is_active:     .eq('is_active', true)"
echo "❌ NEVER use deletedAt:      .eq('deletedAt', null)"
echo ""
echo "✅ Separate queries:         Fetch → Map → Join manually"
echo "❌ Nested foreign keys:      .select('*, client:clients(nested)')"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Production Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH=$(curl -s https://blackgoldunited.vercel.app/api/health 2>/dev/null | grep -o '"status":"ok"' || echo "")
if [ -n "$HEALTH" ]; then
    echo "🟢 Production: HEALTHY (https://blackgoldunited.vercel.app)"
else
    echo "⚠️  Could not reach production (check network or deployment status)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Read the Quick Start guide:"
echo "   cat docs/QUICK_START_NEXT_AGENT.md"
echo ""
echo "2. Ask the user what they need help with"
echo ""
echo "3. Use appropriate *agent or *workflow command"
echo ""
echo "4. Update session-history.json when done"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ready to start! 🚀"
echo ""
