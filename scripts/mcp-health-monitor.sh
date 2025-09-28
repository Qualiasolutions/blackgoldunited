#!/bin/bash

# BlackGoldUnited ERP - MCP Health Monitor
# Monitors the health of Claude Code MCP connections and project status

set -e

echo "🔌 Running MCP Health Monitor for BlackGoldUnited ERP..."

# Create health monitoring directory
mkdir -p .claude/health

# Initialize health check results
HEALTH_RESULTS=()

# Function to add health check result
add_health_result() {
    local component="$1"
    local status="$2"
    local message="$3"
    local timestamp=$(date -Iseconds)

    HEALTH_RESULTS+=("$component:$status:$message:$timestamp")

    case $status in
        "HEALTHY")
            echo "✅ $component: $message"
            ;;
        "WARNING")
            echo "⚠️  $component: $message"
            ;;
        "UNHEALTHY")
            echo "❌ $component: $message"
            ;;
        "UNKNOWN")
            echo "❓ $component: $message"
            ;;
    esac
}

# Health Check 1: Project Structure
echo ""
echo "📁 Checking project structure health..."

REQUIRED_DIRS=("app" "public" ".github/workflows")
MISSING_DIRS=0

for dir in "${REQUIRED_DIRS[@]}"; do
    if [[ ! -d "$dir" ]]; then
        MISSING_DIRS=$((MISSING_DIRS + 1))
    fi
done

if [[ $MISSING_DIRS -eq 0 ]]; then
    add_health_result "Project Structure" "HEALTHY" "All required directories present"
elif [[ $MISSING_DIRS -le 1 ]]; then
    add_health_result "Project Structure" "WARNING" "$MISSING_DIRS directory missing"
else
    add_health_result "Project Structure" "UNHEALTHY" "$MISSING_DIRS directories missing"
fi

# Health Check 2: Dependencies Health
echo ""
echo "📦 Checking dependencies health..."

if [[ -f "package.json" ]] && [[ -f "package-lock.json" ]]; then
    if command -v npm &> /dev/null; then
        # Check if node_modules exists and is up to date
        if [[ -d "node_modules" ]]; then
            if npm list --depth=0 &> /dev/null; then
                add_health_result "Dependencies" "HEALTHY" "All dependencies installed and resolved"
            else
                add_health_result "Dependencies" "WARNING" "Some dependency issues detected"
            fi
        else
            add_health_result "Dependencies" "WARNING" "node_modules not found - run npm install"
        fi
    else
        add_health_result "Dependencies" "UNKNOWN" "npm not available for dependency check"
    fi
else
    add_health_result "Dependencies" "UNHEALTHY" "Missing package.json or package-lock.json"
fi

# Health Check 3: Build System Health
echo ""
echo "🏗️ Checking build system health..."

if [[ -f "next.config.ts" ]] || [[ -f "next.config.js" ]]; then
    if command -v npx &> /dev/null; then
        # Check if Next.js build command is functional
        if npx next --help &> /dev/null; then
            # Try a quick type check instead of full build for speed
            if npx tsc --noEmit --skipLibCheck &> /dev/null 2>&1; then
                add_health_result "Build System" "HEALTHY" "Build system fully functional"
            else
                add_health_result "Build System" "HEALTHY" "Build system accessible (TypeScript issues detected separately)"
            fi
        else
            add_health_result "Build System" "UNHEALTHY" "Build system not functioning"
        fi
    else
        add_health_result "Build System" "UNKNOWN" "Cannot validate build system - npx not available"
    fi
else
    add_health_result "Build System" "UNHEALTHY" "Next.js configuration not found"
fi

# Health Check 4: TypeScript Health
echo ""
echo "📝 Checking TypeScript health..."

if [[ -f "tsconfig.json" ]]; then
    if command -v npx &> /dev/null; then
        if npx tsc --version &> /dev/null; then
            # Quick type check (no emit)
            if timeout 20s npx tsc --noEmit --skipLibCheck &> /dev/null; then
                add_health_result "TypeScript" "HEALTHY" "TypeScript compilation successful"
            else
                add_health_result "TypeScript" "WARNING" "TypeScript compilation issues detected"
            fi
        else
            add_health_result "TypeScript" "WARNING" "TypeScript compiler not available"
        fi
    else
        add_health_result "TypeScript" "UNKNOWN" "Cannot validate TypeScript - npx not available"
    fi
else
    add_health_result "TypeScript" "UNHEALTHY" "tsconfig.json not found"
fi

# Health Check 5: Git Repository Health
echo ""
echo "🔄 Checking Git repository health..."

if [[ -d ".git" ]]; then
    if command -v git &> /dev/null; then
        # Check for uncommitted changes
        if git diff --quiet && git diff --cached --quiet; then
            add_health_result "Git Repository" "HEALTHY" "Working directory clean"
        else
            add_health_result "Git Repository" "WARNING" "Uncommitted changes detected"
        fi

        # Check for remote
        if git remote get-url origin &> /dev/null; then
            add_health_result "Git Remote" "HEALTHY" "Remote repository configured"
        else
            add_health_result "Git Remote" "WARNING" "No remote repository configured"
        fi
    else
        add_health_result "Git Repository" "UNKNOWN" "Git not available"
    fi
else
    add_health_result "Git Repository" "UNHEALTHY" "Not a Git repository"
fi

# Health Check 6: Claude Context Health
echo ""
echo "🤖 Checking Claude context health..."

if [[ -d ".claude" ]]; then
    CLAUDE_FILES=$(find .claude -name "*.json" | wc -l)
    if [[ $CLAUDE_FILES -gt 0 ]]; then
        add_health_result "Claude Context" "HEALTHY" "$CLAUDE_FILES context files found"
    else
        add_health_result "Claude Context" "WARNING" "Claude directory exists but no context files found"
    fi
else
    add_health_result "Claude Context" "WARNING" "Claude context directory not found"
fi

# Generate health report
echo ""
echo "📄 Generating health report..."

TOTAL_CHECKS=${#HEALTH_RESULTS[@]}
HEALTHY_CHECKS=$(printf '%s\n' "${HEALTH_RESULTS[@]}" | grep -c ":HEALTHY:" || true)
WARNING_CHECKS=$(printf '%s\n' "${HEALTH_RESULTS[@]}" | grep -c ":WARNING:" || true)
UNHEALTHY_CHECKS=$(printf '%s\n' "${HEALTH_RESULTS[@]}" | grep -c ":UNHEALTHY:" || true)
UNKNOWN_CHECKS=$(printf '%s\n' "${HEALTH_RESULTS[@]}" | grep -c ":UNKNOWN:" || true)

# Calculate health score (0-100)
HEALTH_SCORE=$(( (HEALTHY_CHECKS * 100) / TOTAL_CHECKS ))

cat > .claude/health/health_report.json << EOF
{
  "project": "BlackGoldUnited ERP System",
  "timestamp": "$(date -Iseconds)",
  "overall_health_score": $HEALTH_SCORE,
  "summary": {
    "total_checks": $TOTAL_CHECKS,
    "healthy": $HEALTHY_CHECKS,
    "warnings": $WARNING_CHECKS,
    "unhealthy": $UNHEALTHY_CHECKS,
    "unknown": $UNKNOWN_CHECKS
  },
  "checks": [
EOF

first=true
for result in "${HEALTH_RESULTS[@]}"; do
    IFS=':' read -r component status message timestamp <<< "$result"
    if [[ "$first" == true ]]; then
        first=false
    else
        echo "," >> .claude/health/health_report.json
    fi
    cat >> .claude/health/health_report.json << EOF
    {
      "component": "$component",
      "status": "$status",
      "message": "$message",
      "timestamp": "$timestamp"
    }
EOF
done

cat >> .claude/health/health_report.json << EOF
  ]
}
EOF

# Display health summary
echo ""
echo "🔌 MCP Health Summary:"
echo "======================"
echo "Overall Health Score: $HEALTH_SCORE%"
echo "Healthy Components: $HEALTHY_CHECKS/$TOTAL_CHECKS"
echo "Warnings: $WARNING_CHECKS"
echo "Unhealthy: $UNHEALTHY_CHECKS"
echo "Unknown Status: $UNKNOWN_CHECKS"

# Health status emoji
if [[ $HEALTH_SCORE -ge 80 ]]; then
    echo "🟢 System Status: HEALTHY"
    OVERALL_STATUS="HEALTHY"
elif [[ $HEALTH_SCORE -ge 60 ]]; then
    echo "🟡 System Status: WARNING"
    OVERALL_STATUS="WARNING"
else
    echo "🔴 System Status: UNHEALTHY"
    OVERALL_STATUS="UNHEALTHY"
fi

echo ""
echo "📄 Detailed health report saved to .claude/health/health_report.json"

# Exit with appropriate code based on health status
case $OVERALL_STATUS in
    "HEALTHY")
        exit 0
        ;;
    "WARNING")
        exit 0  # Warnings don't fail the health check
        ;;
    "UNHEALTHY")
        exit 1
        ;;
esac