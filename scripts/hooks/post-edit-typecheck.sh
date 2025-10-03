#!/bin/bash

# Post-Edit Type Check Hook
# Runs TypeScript type-check after file edits

set -e

EDITED_FILE=$1

echo "🔍 Running type-check after editing: $EDITED_FILE"

# Only run type-check for TypeScript/TSX files
if [[ $EDITED_FILE == *.ts ]] || [[ $EDITED_FILE == *.tsx ]]; then
  if npm run type-check 2>&1 | tee /tmp/typecheck.log; then
    echo "✅ Type-check passed"
    exit 0
  else
    echo "❌ Type-check failed after editing $EDITED_FILE"
    echo "Please fix TypeScript errors before proceeding"
    exit 1
  fi
else
  echo "ℹ️  Skipping type-check (not a TypeScript file)"
  exit 0
fi
