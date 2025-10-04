#!/bin/bash
# Security Check Script - Comprehensive Database & Code Security Audit
# Purpose: Automate security checks to catch issues before deployment
# Usage: ./scripts/security-check-detailed.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  BlackGoldUnited ERP - Security Audit${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to print section header
print_section() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}$(printf '─%.0s' {1..60})${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Track overall status
ISSUES_FOUND=0

# ============================================================================
# 1. Check for hardcoded secrets in code
# ============================================================================
print_section "Checking for hardcoded secrets..."

echo "Scanning for API keys, passwords, tokens..."
SECRET_PATTERNS=(
    "password\s*=\s*['\"]"
    "api_key\s*=\s*['\"]"
    "secret\s*=\s*['\"]"
    "token\s*=\s*['\"]"
    "SUPABASE_SERVICE_ROLE"
    "sk_live_"
    "sk_test_"
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    matches=$(grep -r -n -E "$pattern" app/ lib/ components/ 2>/dev/null | grep -v "node_modules" | grep -v ".next" || true)
    if [ ! -z "$matches" ]; then
        echo -e "${RED}⚠ Found potential hardcoded secret: $pattern${NC}"
        echo "$matches"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No hardcoded secrets found${NC}"
fi

# ============================================================================
# 2. Check environment variable usage
# ============================================================================
print_section "Validating environment variables..."

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
    echo -e "${RED}⚠ .env.example not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ .env.example exists${NC}"
fi

# Check if sensitive files are gitignored
if ! grep -q "^\.env\.local$" .gitignore 2>/dev/null; then
    echo -e "${RED}⚠ .env.local not in .gitignore${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ .env.local is gitignored${NC}"
fi

# ============================================================================
# 3. Check for SQL injection vulnerabilities
# ============================================================================
print_section "Checking for SQL injection vulnerabilities..."

echo "Scanning for raw SQL queries without parameterization..."
SQL_ISSUES=$(grep -r -n "\.raw\|\.query.*\${" app/api/ lib/ 2>/dev/null | grep -v "node_modules" | grep -v ".next" || true)

if [ ! -z "$SQL_ISSUES" ]; then
    echo -e "${YELLOW}⚠ Found potential SQL injection points:${NC}"
    echo "$SQL_ISSUES"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ No obvious SQL injection vulnerabilities${NC}"
fi

# ============================================================================
# 4. Check authentication middleware usage
# ============================================================================
print_section "Validating API authentication..."

echo "Checking API routes for proper authentication..."
API_ROUTES=$(find app/api -name "route.ts" -o -name "*.ts" 2>/dev/null)
UNPROTECTED_ROUTES=0

for route in $API_ROUTES; do
    # Skip auth routes themselves
    if [[ "$route" == *"/auth/"* ]]; then
        continue
    fi

    # Check if route uses authenticateAndAuthorize
    if ! grep -q "authenticateAndAuthorize" "$route" 2>/dev/null; then
        echo -e "${YELLOW}⚠ Potentially unprotected route: $route${NC}"
        UNPROTECTED_ROUTES=$((UNPROTECTED_ROUTES + 1))
    fi
done

if [ $UNPROTECTED_ROUTES -eq 0 ]; then
    echo -e "${GREEN}✓ All API routes appear protected${NC}"
else
    echo -e "${YELLOW}⚠ Found $UNPROTECTED_ROUTES potentially unprotected routes${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# ============================================================================
# 5. Check for XSS vulnerabilities
# ============================================================================
print_section "Checking for XSS vulnerabilities..."

echo "Scanning for dangerouslySetInnerHTML usage..."
XSS_ISSUES=$(grep -r -n "dangerouslySetInnerHTML" app/ components/ 2>/dev/null | grep -v "node_modules" || true)

if [ ! -z "$XSS_ISSUES" ]; then
    echo -e "${YELLOW}⚠ Found dangerouslySetInnerHTML usage:${NC}"
    echo "$XSS_ISSUES"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓ No dangerouslySetInnerHTML usage found${NC}"
fi

# ============================================================================
# 6. Check TypeScript types
# ============================================================================
print_section "Running TypeScript type check..."

if command_exists npm; then
    if npm run type-check >/dev/null 2>&1; then
        echo -e "${GREEN}✓ TypeScript: 0 errors${NC}"
    else
        echo -e "${RED}⚠ TypeScript errors found. Run 'npm run type-check' for details${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${YELLOW}⚠ npm not found, skipping type check${NC}"
fi

# ============================================================================
# 7. Check for missing RLS policies (if connected to Supabase)
# ============================================================================
print_section "Database Security Check..."

echo "To check Row Level Security (RLS) status, run this in Supabase SQL Editor:"
echo ""
echo -e "${YELLOW}SELECT"
echo "  schemaname,"
echo "  tablename,"
echo "  rowsecurity as rls_enabled"
echo "FROM pg_tables"
echo "WHERE schemaname = 'public'"
echo "ORDER BY tablename;${NC}"
echo ""
echo "✓ Ensure all public tables have rowsecurity = true"

# ============================================================================
# 8. Check for console.log in production code
# ============================================================================
print_section "Checking for debug statements..."

CONSOLE_LOGS=$(grep -r -n "console\.log\|console\.debug" app/ components/ lib/ 2>/dev/null | grep -v "node_modules" | wc -l || echo "0")

if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $CONSOLE_LOGS console.log statements (consider using proper logging)${NC}"
else
    echo -e "${GREEN}✓ No console.log statements found${NC}"
fi

# ============================================================================
# 9. Check package vulnerabilities
# ============================================================================
print_section "Checking npm packages for vulnerabilities..."

if command_exists npm; then
    echo "Running npm audit..."
    npm audit --audit-level=high 2>/dev/null || {
        echo -e "${YELLOW}⚠ npm audit found vulnerabilities. Run 'npm audit' for details${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    }
else
    echo -e "${YELLOW}⚠ npm not found, skipping package audit${NC}"
fi

# ============================================================================
# 10. Check next.config security headers
# ============================================================================
print_section "Validating security headers in next.config..."

if [ -f "next.config.ts" ] || [ -f "next.config.js" ]; then
    if grep -q "X-Frame-Options" next.config.* 2>/dev/null; then
        echo -e "${GREEN}✓ Security headers configured${NC}"
    else
        echo -e "${YELLOW}⚠ Security headers not found in next.config${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${RED}⚠ next.config not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Security Audit Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ Security audit passed! No critical issues found.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Found $ISSUES_FOUND potential security issues.${NC}"
    echo -e "${YELLOW}  Please review the findings above.${NC}"
    exit 1
fi
