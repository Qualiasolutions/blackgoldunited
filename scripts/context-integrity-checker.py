#!/usr/bin/env python3

"""
BlackGoldUnited ERP - Context Integrity Checker
This script validates the integrity of Claude context and project structure.
"""

import json
import os
import sys
import argparse
from pathlib import Path

def check_project_structure():
    """Check if essential project files exist."""
    essential_files = [
        'package.json',
        'tsconfig.json',
        'next.config.ts',
        '.gitignore'
    ]

    missing_files = []
    for file in essential_files:
        if not os.path.exists(file):
            missing_files.append(file)

    return {
        'status': 'passed' if not missing_files else 'warning',
        'missing_files': missing_files,
        'message': f'Essential files check: {len(essential_files) - len(missing_files)}/{len(essential_files)} found'
    }

def check_dependencies():
    """Check package.json dependencies for common issues."""
    if not os.path.exists('package.json'):
        return {'status': 'failed', 'message': 'package.json not found'}

    try:
        with open('package.json', 'r') as f:
            package_data = json.load(f)

        deps = package_data.get('dependencies', {})
        dev_deps = package_data.get('devDependencies', {})

        # Check for Next.js
        has_nextjs = 'next' in deps
        has_react = 'react' in deps and 'react-dom' in deps
        has_typescript = 'typescript' in dev_deps or '@types/node' in dev_deps

        checks = {
            'has_nextjs': has_nextjs,
            'has_react': has_react,
            'has_typescript': has_typescript,
            'total_deps': len(deps),
            'total_dev_deps': len(dev_deps)
        }

        status = 'passed' if all([has_nextjs, has_react, has_typescript]) else 'warning'

        return {
            'status': status,
            'checks': checks,
            'message': 'Dependency validation completed'
        }

    except Exception as e:
        return {'status': 'failed', 'message': f'Error reading package.json: {str(e)}'}

def check_claude_context():
    """Check Claude-specific context files."""
    claude_dir = Path('.claude')

    if not claude_dir.exists():
        return {
            'status': 'warning',
            'message': 'Claude directory not found',
            'context_files': []
        }

    context_files = list(claude_dir.rglob('*.json'))

    return {
        'status': 'passed',
        'message': f'Found {len(context_files)} Claude context files',
        'context_files': [str(f) for f in context_files]
    }

def main():
    parser = argparse.ArgumentParser(description='BlackGoldUnited Context Integrity Checker')
    parser.add_argument('--report', choices=['json', 'text'], default='text',
                       help='Output format for the report')

    args = parser.parse_args()

    print("🔍 Running Context Integrity Check for BlackGoldUnited ERP...")

    # Run all checks
    results = {
        'project_structure': check_project_structure(),
        'dependencies': check_dependencies(),
        'claude_context': check_claude_context(),
        'timestamp': str(Path.cwd()),
        'project_name': 'BlackGoldUnited ERP System'
    }

    # Create reports directory
    os.makedirs('.claude/validation', exist_ok=True)

    if args.report == 'json':
        report_file = '.claude/validation/context_integrity.json'
        with open(report_file, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"📄 JSON report saved to {report_file}")
    else:
        # Text output
        print("\n📊 Context Integrity Check Results:")
        print("=" * 50)

        for check_name, result in results.items():
            if check_name in ['timestamp', 'project_name']:
                continue

            status_emoji = {'passed': '✅', 'warning': '⚠️', 'failed': '❌'}.get(result['status'], '❓')
            print(f"{status_emoji} {check_name.replace('_', ' ').title()}: {result['status']}")
            print(f"   {result['message']}")
            print()

    # Exit with appropriate code
    failed_checks = [r for r in results.values() if isinstance(r, dict) and r.get('status') == 'failed']
    sys.exit(1 if failed_checks else 0)

if __name__ == '__main__':
    main()