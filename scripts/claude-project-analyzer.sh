#!/bin/bash

# BlackGoldUnited ERP - Claude Project Analyzer
# This script analyzes the project structure and generates reports

set -e

echo "🔍 Running Claude Project Analysis for BlackGoldUnited ERP..."

# Create analysis directory
mkdir -p .claude/analysis

# Analyze project structure
echo "📁 Analyzing project structure..."
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -50 > .claude/analysis/file_structure.txt

# Analyze dependencies
echo "📦 Analyzing dependencies..."
if [ -f "package.json" ]; then
    jq '.dependencies' package.json > .claude/analysis/dependencies.json 2>/dev/null || echo "{}" > .claude/analysis/dependencies.json
    jq '.devDependencies' package.json > .claude/analysis/dev_dependencies.json 2>/dev/null || echo "{}" > .claude/analysis/dev_dependencies.json
fi

# Analyze TypeScript configuration
echo "📝 Analyzing TypeScript configuration..."
if [ -f "tsconfig.json" ]; then
    cp tsconfig.json .claude/analysis/tsconfig_backup.json
fi

# Generate project metrics
echo "📊 Generating project metrics..."
{
    echo "Project: BlackGoldUnited ERP System"
    echo "Framework: Next.js with TypeScript"
    echo "Styling: Tailwind CSS"
    echo "Analysis Date: $(date)"
    echo "Total TypeScript/JavaScript files: $(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l)"
    echo "Total CSS/Style files: $(find . -name "*.css" -o -name "*.scss" -o -name "*.sass" | wc -l)"
} > .claude/analysis/project_metrics.txt

echo "✅ Project analysis completed!"
echo "📄 Reports generated in .claude/analysis/"