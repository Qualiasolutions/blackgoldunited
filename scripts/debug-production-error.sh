#!/bin/bash

# Production Error Debugger
# Helps debug minified React errors in production builds

set -e

echo "==================================="
echo "Production Error Debugger"
echo "==================================="
echo ""

# Function to decode React error codes
decode_react_error() {
    local error_code=$1
    echo "📖 Decoding React Error #${error_code}..."
    echo ""

    case $error_code in
        310)
            echo "❌ React Error #310: useCallback called with incorrect arguments"
            echo ""
            echo "Description:"
            echo "  useCallback received more arguments than expected."
            echo "  It expects exactly 2 arguments: callback and dependencies"
            echo ""
            echo "Common causes:"
            echo "  1. Passing more than 2 arguments: useCallback(fn, deps, extraArg)"
            echo "  2. Syntax error in useCallback call"
            echo "  3. Wrong React import or version mismatch"
            echo ""
            echo "How to fix:"
            echo "  ✅ Correct: useCallback(() => {}, [deps])"
            echo "  ❌ Wrong:   useCallback(() => {}, [deps], somethingElse)"
            ;;
        *)
            echo "Unknown error code. Visit: https://react.dev/errors/${error_code}"
            ;;
    esac
    echo ""
}

# Function to search for potential useCallback issues
search_usecallback_issues() {
    echo "🔍 Searching for potential useCallback issues..."
    echo ""

    # Search for useCallback patterns
    echo "Checking all useCallback usages in codebase:"
    echo "=============================================="

    # Count total useCallback usage
    local count=$(grep -r "useCallback" app/ lib/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
    echo "Total useCallback instances found: $count"
    echo ""

    # Look for suspicious patterns
    echo "Checking for potential issues:"
    echo "------------------------------"

    # Check for missing dependencies
    local missing_deps=$(grep -r "useCallback.*\[\]" app/ lib/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
    echo "- useCallback with empty dependencies: $missing_deps"

    # Check for complex callbacks
    local complex=$(grep -r "useCallback.*async" app/ lib/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
    echo "- useCallback with async functions: $complex"

    echo ""
}

# Function to run production build locally
run_local_production() {
    echo "🏗️  Running production build locally..."
    echo ""

    echo "Step 1: Building application..."
    npm run build

    echo ""
    echo "Step 2: Starting production server..."
    echo "Visit: http://localhost:3000"
    echo "Press Ctrl+C to stop"
    echo ""

    npm start
}

# Function to enable source maps for debugging
enable_source_maps() {
    echo "🗺️  Enabling source maps for better debugging..."
    echo ""

    # Check if next.config.ts exists
    if [ -f "next.config.ts" ]; then
        echo "Found next.config.ts"
        echo ""
        echo "To enable source maps, add to next.config.ts:"
        echo ""
        echo "productionBrowserSourceMaps: true,"
        echo ""
        echo "This will help identify exact line numbers in production errors."
    else
        echo "❌ next.config.ts not found"
    fi
}

# Function to check React version
check_react_version() {
    echo "⚛️  Checking React version..."
    echo ""

    local react_version=$(node -p "require('./package.json').dependencies.react")
    local react_types=$(node -p "require('./package.json').devDependencies['@types/react']")

    echo "React version: $react_version"
    echo "React types version: $react_types"
    echo ""

    # Check for version mismatches
    if [[ "$react_version" == *"18."* ]] && [[ "$react_types" == *"19"* ]]; then
        echo "⚠️  WARNING: React version mismatch detected!"
        echo "   React: $react_version"
        echo "   Types: $react_types"
        echo ""
        echo "This may cause type errors and runtime issues."
        echo "Recommendation: Align versions"
    else
        echo "✅ React versions look good"
    fi
    echo ""
}

# Main menu
show_menu() {
    echo "What would you like to do?"
    echo ""
    echo "1. Decode React error code"
    echo "2. Search for useCallback issues"
    echo "3. Run production build locally"
    echo "4. Enable source maps"
    echo "5. Check React version"
    echo "6. Run all checks"
    echo "0. Exit"
    echo ""
    read -p "Enter choice: " choice

    case $choice in
        1)
            read -p "Enter React error code (e.g., 310): " code
            decode_react_error $code
            ;;
        2)
            search_usecallback_issues
            ;;
        3)
            run_local_production
            ;;
        4)
            enable_source_maps
            ;;
        5)
            check_react_version
            ;;
        6)
            check_react_version
            search_usecallback_issues
            echo ""
            echo "==================================="
            echo "All checks complete!"
            echo "==================================="
            ;;
        0)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice"
            ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
    clear
    show_menu
}

# If error code provided as argument, decode it directly
if [ $# -eq 1 ]; then
    decode_react_error $1
    exit 0
fi

# Show interactive menu
clear
show_menu
