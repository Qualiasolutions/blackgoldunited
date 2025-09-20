#!/bin/bash

# BlackGoldUnited ERP - Security Audit Gate
# Security validation and audit checks

set -e

echo "🔒 Running Security Audit for BlackGoldUnited ERP..."

# Create security reports directory
mkdir -p .claude/security

# Function to log security findings
log_security_finding() {
    local severity="$1"
    local category="$2"
    local message="$3"

    echo "[$severity] $category: $message" | tee -a .claude/security/audit.log

    case $severity in
        "HIGH")
            echo "🚨 HIGH: $category - $message"
            ;;
        "MEDIUM")
            echo "⚠️  MEDIUM: $category - $message"
            ;;
        "LOW")
            echo "ℹ️  LOW: $category - $message"
            ;;
        "INFO")
            echo "📋 INFO: $category - $message"
            ;;
    esac
}

# Initialize audit log
echo "Security Audit Log - $(date)" > .claude/security/audit.log
echo "Project: BlackGoldUnited ERP System" >> .claude/security/audit.log
echo "========================================" >> .claude/security/audit.log

# Security Check 1: npm audit
echo ""
echo "📦 Running npm audit..."

if command -v npm &> /dev/null; then
    npm audit --json > .claude/security/npm_audit_raw.json 2>/dev/null || true

    # Parse npm audit results
    if [[ -f ".claude/security/npm_audit_raw.json" ]]; then
        HIGH_VULNS=$(jq -r '.metadata.vulnerabilities.high // 0' .claude/security/npm_audit_raw.json 2>/dev/null || echo "0")
        CRITICAL_VULNS=$(jq -r '.metadata.vulnerabilities.critical // 0' .claude/security/npm_audit_raw.json 2>/dev/null || echo "0")
        TOTAL_VULNS=$(jq -r '.metadata.vulnerabilities.total // 0' .claude/security/npm_audit_raw.json 2>/dev/null || echo "0")

        if [[ "$CRITICAL_VULNS" -gt 0 ]]; then
            log_security_finding "HIGH" "Dependencies" "$CRITICAL_VULNS critical vulnerabilities found"
        elif [[ "$HIGH_VULNS" -gt 0 ]]; then
            log_security_finding "MEDIUM" "Dependencies" "$HIGH_VULNS high severity vulnerabilities found"
        elif [[ "$TOTAL_VULNS" -gt 0 ]]; then
            log_security_finding "LOW" "Dependencies" "$TOTAL_VULNS total vulnerabilities found"
        else
            log_security_finding "INFO" "Dependencies" "No vulnerabilities found in dependencies"
        fi
    fi
else
    log_security_finding "MEDIUM" "Dependencies" "npm not available for dependency audit"
fi

# Security Check 2: Sensitive file patterns
echo ""
echo "🔍 Checking for sensitive files..."

SENSITIVE_PATTERNS=(
    "*.env"
    "*.key"
    "*.pem"
    "*.p12"
    "*.pfx"
    "*id_rsa*"
    "*id_dsa*"
    "*.aws/credentials"
    "config/database.yml"
    "config/secrets.yml"
)

SENSITIVE_FILES_FOUND=0

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if find . -name "$pattern" -not -path "./.git/*" -not -path "./node_modules/*" | grep -q .; then
        SENSITIVE_FILES_FOUND=$((SENSITIVE_FILES_FOUND + 1))
        log_security_finding "HIGH" "Sensitive Files" "Found files matching pattern: $pattern"
    fi
done

if [[ $SENSITIVE_FILES_FOUND -eq 0 ]]; then
    log_security_finding "INFO" "Sensitive Files" "No sensitive files detected in repository"
fi

# Security Check 3: .gitignore validation
echo ""
echo "📝 Validating .gitignore configuration..."

if [[ -f ".gitignore" ]]; then
    REQUIRED_PATTERNS=(
        "node_modules"
        ".env"
        ".env.local"
        ".next"
        "dist"
        "build"
    )

    MISSING_PATTERNS=()
    for pattern in "${REQUIRED_PATTERNS[@]}"; do
        if ! grep -q "$pattern" .gitignore; then
            MISSING_PATTERNS+=("$pattern")
        fi
    done

    if [[ ${#MISSING_PATTERNS[@]} -gt 0 ]]; then
        log_security_finding "MEDIUM" "Git Security" "Missing .gitignore patterns: ${MISSING_PATTERNS[*]}"
    else
        log_security_finding "INFO" "Git Security" ".gitignore contains recommended security patterns"
    fi
else
    log_security_finding "HIGH" "Git Security" ".gitignore file not found"
fi

# Security Check 4: Package.json security configuration
echo ""
echo "📋 Checking package.json security configuration..."

if [[ -f "package.json" ]]; then
    # Check for private field
    if jq -e '.private == true' package.json > /dev/null 2>&1; then
        log_security_finding "INFO" "Package Security" "Package marked as private"
    else
        log_security_finding "LOW" "Package Security" "Package not marked as private"
    fi

    # Check for engines specification
    if jq -e '.engines' package.json > /dev/null 2>&1; then
        log_security_finding "INFO" "Package Security" "Node.js engine version specified"
    else
        log_security_finding "LOW" "Package Security" "No engine version constraints specified"
    fi
fi

# Security Check 5: Next.js security headers
echo ""
echo "🛡️ Checking Next.js security configuration..."

if [[ -f "next.config.ts" ]] || [[ -f "next.config.js" ]]; then
    CONFIG_FILE="next.config.ts"
    [[ -f "next.config.js" ]] && CONFIG_FILE="next.config.js"

    if grep -q "headers" "$CONFIG_FILE"; then
        log_security_finding "INFO" "Next.js Security" "Custom headers configuration found"
    else
        log_security_finding "MEDIUM" "Next.js Security" "No security headers configured"
    fi

    if grep -q "contentSecurityPolicy" "$CONFIG_FILE"; then
        log_security_finding "INFO" "Next.js Security" "Content Security Policy configured"
    else
        log_security_finding "MEDIUM" "Next.js Security" "Content Security Policy not configured"
    fi
else
    log_security_finding "LOW" "Next.js Security" "Next.js configuration file not found"
fi

# Generate security summary
echo ""
echo "📊 Generating security summary..."

HIGH_ISSUES=$(grep -c "\[HIGH\]" .claude/security/audit.log || echo "0")
MEDIUM_ISSUES=$(grep -c "\[MEDIUM\]" .claude/security/audit.log || echo "0")
LOW_ISSUES=$(grep -c "\[LOW\]" .claude/security/audit.log || echo "0")

cat > .claude/security/summary.json << EOF
{
  "project": "BlackGoldUnited ERP System",
  "audit_timestamp": "$(date -Iseconds)",
  "summary": {
    "high_severity": $HIGH_ISSUES,
    "medium_severity": $MEDIUM_ISSUES,
    "low_severity": $LOW_ISSUES,
    "total_issues": $((HIGH_ISSUES + MEDIUM_ISSUES + LOW_ISSUES))
  },
  "recommendations": [
    "Regularly update dependencies to patch vulnerabilities",
    "Implement Content Security Policy headers",
    "Configure security headers in Next.js",
    "Use environment variables for sensitive configuration",
    "Enable dependabot for automated dependency updates"
  ]
}
EOF

echo ""
echo "🔒 Security Audit Summary:"
echo "=========================="
echo "High Severity Issues: $HIGH_ISSUES"
echo "Medium Severity Issues: $MEDIUM_ISSUES"
echo "Low Severity Issues: $LOW_ISSUES"
echo ""
echo "📄 Detailed report saved to .claude/security/"

# Exit with appropriate code
if [[ $HIGH_ISSUES -gt 0 ]]; then
    echo "❌ Security audit failed due to high severity issues"
    exit 1
elif [[ $MEDIUM_ISSUES -gt 5 ]]; then
    echo "⚠️  Security audit completed with warnings (too many medium severity issues)"
    exit 1
else
    echo "✅ Security audit passed"
    exit 0
fi