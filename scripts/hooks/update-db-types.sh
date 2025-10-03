#!/bin/bash

# Update Database Types Hook
# Regenerates TypeScript types after schema changes

set -e

echo "🔄 Updating database types from Supabase schema..."

# Check if Supabase project is configured
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "⚠️  Warning: NEXT_PUBLIC_SUPABASE_URL not set"
  echo "   Skipping type generation"
  exit 0
fi

# Generate types using Supabase CLI (if available)
if command -v supabase &> /dev/null; then
  echo "📝 Generating types with Supabase CLI..."
  supabase gen types typescript --local > lib/types/supabase-generated.ts 2>/dev/null || \
  echo "ℹ️  Could not generate types from local Supabase (not running or not configured)"
else
  echo "ℹ️  Supabase CLI not installed, skipping type generation"
  echo "   Install with: npm install supabase --save-dev"
fi

echo "✅ Database types update complete"
exit 0
