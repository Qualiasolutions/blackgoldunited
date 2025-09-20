#!/bin/bash

# BlackGoldUnited ERP - Claude Validation Suite
# Comprehensive validation for the ERP system

set -e

REPORT_FORMAT="text"
ENVIRONMENT="development"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --report-format=*)
            REPORT_FORMAT="${1#*=}"
            shift
            ;;
        --environment=*)
            ENVIRONMENT="${1#*=}"
            shift
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

echo "🧪 Running Claude Validation Suite for BlackGoldUnited ERP..."
echo "📊 Report Format: $REPORT_FORMAT"
echo "🌍 Environment: $ENVIRONMENT"

# Create validation directory
mkdir -p .claude/validation

# Initialize validation results
VALIDATION_RESULTS=()

# Function to add validation result
add_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"

    VALIDATION_RESULTS+=("$test_name:$status:$message")

    case $status in
        "PASS")
            echo "✅ $test_name: $message"
            ;;
        "WARN")
            echo "⚠️  $test_name: $message"
            ;;
        "FAIL")
            echo "❌ $test_name: $message"
            ;;
    esac
}

# Validation 1: Project Structure
echo ""
echo "📁 Validating project structure..."

if [[ -f "package.json" && -f "tsconfig.json" && -f "next.config.ts" ]]; then
    add_result "Project Structure" "PASS" "All essential files present"
else
    add_result "Project Structure" "FAIL" "Missing essential configuration files"
fi

# Validation 2: Dependencies
echo ""
echo "📦 Validating dependencies..."

if command -v npm &> /dev/null; then
    if npm list next react react-dom --depth=0 &> /dev/null; then
        add_result "Core Dependencies" "PASS" "Next.js and React dependencies verified"
    else
        add_result "Core Dependencies" "WARN" "Some core dependencies may be missing"
    fi
else
    add_result "Core Dependencies" "WARN" "npm not available for dependency check"
fi

# Validation 3: TypeScript Configuration
echo ""
echo "📝 Validating TypeScript configuration..."

if [[ -f "tsconfig.json" ]]; then
    if command -v npx &> /dev/null; then
        if npx tsc --noEmit --skipLibCheck; then
            add_result "TypeScript" "PASS" "TypeScript compilation successful"
        else
            add_result "TypeScript" "WARN" "TypeScript compilation issues detected"
        fi
    else
        add_result "TypeScript" "WARN" "TypeScript compiler not available"
    fi
else
    add_result "TypeScript" "FAIL" "tsconfig.json not found"
fi

# Validation 4: Build Process
echo ""
echo "🏗️ Validating build process..."

if [[ "$ENVIRONMENT" != "production" ]]; then
    if npm run build &> /dev/null; then
        add_result "Build Process" "PASS" "Next.js build completed successfully"
    else
        add_result "Build Process" "FAIL" "Build process failed"
    fi
else
    add_result "Build Process" "SKIP" "Skipped in production environment"
fi

# Validation 5: ESLint (if available)
echo ""
echo "🔍 Validating code quality..."

if [[ -f ".eslintrc.json" ]] && command -v npx &> /dev/null; then
    if npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0 &> /dev/null; then
        add_result "Code Quality" "PASS" "ESLint validation passed"
    else
        add_result "Code Quality" "WARN" "ESLint warnings or errors detected"
    fi
else
    add_result "Code Quality" "WARN" "ESLint not configured or not available"
fi

# Generate validation report
echo ""
echo "📄 Generating validation report..."

TOTAL_TESTS=${#VALIDATION_RESULTS[@]}
PASSED_TESTS=$(printf '%s\n' "${VALIDATION_RESULTS[@]}" | grep -c ":PASS:" || true)
FAILED_TESTS=$(printf '%s\n' "${VALIDATION_RESULTS[@]}" | grep -c ":FAIL:" || true)
WARNED_TESTS=$(printf '%s\n' "${VALIDATION_RESULTS[@]}" | grep -c ":WARN:" || true)

if [[ "$REPORT_FORMAT" == "json" ]]; then
    cat > .claude/validation/validation_report.json << EOF
{
  "project": "BlackGoldUnited ERP System",
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -Iseconds)",
  "summary": {
    "total_tests": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS,
    "warnings": $WARNED_TESTS
  },
  "results": [
EOF

    first=true
    for result in "${VALIDATION_RESULTS[@]}"; do
        IFS=':' read -r test_name status message <<< "$result"
        if [[ "$first" == true ]]; then
            first=false
        else
            echo "," >> .claude/validation/validation_report.json
        fi
        cat >> .claude/validation/validation_report.json << EOF
    {
      "test": "$test_name",
      "status": "$status",
      "message": "$message"
    }
EOF
    done

    cat >> .claude/validation/validation_report.json << EOF
  ]
}
EOF

    echo "📄 JSON report saved to .claude/validation/validation_report.json"
fi

# Summary
echo ""
echo "📊 Validation Summary:"
echo "=========================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Warnings: $WARNED_TESTS"

# Exit with appropriate code
if [[ $FAILED_TESTS -gt 0 ]]; then
    echo ""
    echo "❌ Validation suite failed with $FAILED_TESTS failures"
    exit 1
elif [[ $WARNED_TESTS -gt 0 ]]; then
    echo ""
    echo "⚠️  Validation suite completed with $WARNED_TESTS warnings"
    exit 0
else
    echo ""
    echo "✅ All validations passed!"
    exit 0
fi