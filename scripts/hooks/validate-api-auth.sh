#!/bin/bash

# Validate API Auth Hook
# Checks that all API routes use authenticateAndAuthorize() middleware

set -e

echo "🔍 Validating API authentication middleware..."

# Find all route.ts files in app/api/
API_ROUTES=$(find app/api -name "route.ts" -type f)

MISSING_AUTH=0
TOTAL_ROUTES=0

for route in $API_ROUTES; do
  TOTAL_ROUTES=$((TOTAL_ROUTES + 1))

  # Check if file contains authenticateAndAuthorize
  if ! grep -q "authenticateAndAuthorize" "$route"; then
    echo "❌ Missing auth: $route"
    MISSING_AUTH=$((MISSING_AUTH + 1))
  fi
done

echo ""
echo "📊 API Auth Validation Results:"
echo "   Total routes: $TOTAL_ROUTES"
echo "   Missing auth: $MISSING_AUTH"

if [ $MISSING_AUTH -gt 0 ]; then
  echo ""
  echo "⚠️  Warning: $MISSING_AUTH route(s) missing authentication middleware"
  echo "   All API routes must use authenticateAndAuthorize() from @/lib/auth/api-auth"
  exit 1
fi

echo "✅ All API routes have proper authentication"
exit 0
