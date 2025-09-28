#!/bin/bash

# BlackGoldUnited ERP - Batch Environment Variables Setup for Vercel
# Run this after you have all your API keys ready

set -e

echo "🚀 BlackGoldUnited ERP - Batch Environment Setup"
echo "================================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found! Install it with: npm install -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel first"
    vercel login
fi

echo "⚠️  Make sure you have all your API keys ready before running this script!"
echo "Press Enter to continue or Ctrl+C to exit..."
read

# Core Application Variables (set these automatically)
echo "Setting core application variables..."
echo "production" | vercel env add NODE_ENV production
echo "BlackGoldUnited ERP" | vercel env add NEXT_PUBLIC_APP_NAME production
echo "1.0.0" | vercel env add NEXT_PUBLIC_APP_VERSION production

# Required Supabase Variables
echo ""
echo "🔐 SUPABASE CONFIGURATION"
echo "========================="
echo "Enter your Supabase Project URL (e.g., https://your-project.supabase.co):"
read -p "NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo "Enter your Supabase Anonymous Key:"
read -p "NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Optional Sentry Variables
echo ""
echo "📊 SENTRY CONFIGURATION (Optional - press Enter to skip)"
echo "========================================"
read -p "NEXT_PUBLIC_SENTRY_DSN: " SENTRY_DSN
if [ -n "$SENTRY_DSN" ]; then
    echo "$SENTRY_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN production
    read -p "SENTRY_ORG: " SENTRY_ORG
    echo "$SENTRY_ORG" | vercel env add SENTRY_ORG production
    read -p "SENTRY_PROJECT: " SENTRY_PROJECT
    echo "$SENTRY_PROJECT" | vercel env add SENTRY_PROJECT production
    read -p "SENTRY_AUTH_TOKEN: " SENTRY_AUTH_TOKEN
    echo "$SENTRY_AUTH_TOKEN" | vercel env add SENTRY_AUTH_TOKEN production
fi

# Optional Novu Variables
echo ""
echo "🔔 NOVU CONFIGURATION (Optional - press Enter to skip)"
echo "======================================="
read -p "NOVU_API_KEY: " NOVU_API_KEY
if [ -n "$NOVU_API_KEY" ]; then
    echo "$NOVU_API_KEY" | vercel env add NOVU_API_KEY production
    read -p "NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER: " NOVU_APP_ID
    echo "$NOVU_APP_ID" | vercel env add NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER production
fi

# Optional Resend Variables
echo ""
echo "📧 RESEND CONFIGURATION (Optional - press Enter to skip)"
echo "======================================="
read -p "RESEND_API_KEY: " RESEND_API_KEY
if [ -n "$RESEND_API_KEY" ]; then
    echo "$RESEND_API_KEY" | vercel env add RESEND_API_KEY production
fi

# Optional Inngest Variables
echo ""
echo "⚙️ INNGEST CONFIGURATION (Optional - press Enter to skip)"
echo "========================================"
read -p "INNGEST_EVENT_KEY: " INNGEST_EVENT_KEY
if [ -n "$INNGEST_EVENT_KEY" ]; then
    echo "$INNGEST_EVENT_KEY" | vercel env add INNGEST_EVENT_KEY production
    read -p "INNGEST_SIGNING_KEY: " INNGEST_SIGNING_KEY
    echo "$INNGEST_SIGNING_KEY" | vercel env add INNGEST_SIGNING_KEY production
    echo "production" | vercel env add NEXT_PUBLIC_INNGEST_ENV production
fi

# Optional Checkly Variables
echo ""
echo "📈 CHECKLY CONFIGURATION (Optional - press Enter to skip)"
echo "========================================="
read -p "CHECKLY_API_KEY: " CHECKLY_API_KEY
if [ -n "$CHECKLY_API_KEY" ]; then
    echo "$CHECKLY_API_KEY" | vercel env add CHECKLY_API_KEY production
    read -p "CHECKLY_ACCOUNT_ID: " CHECKLY_ACCOUNT_ID
    echo "$CHECKLY_ACCOUNT_ID" | vercel env add CHECKLY_ACCOUNT_ID production
fi

# Set feature flags
echo ""
echo "Setting feature flags..."
echo "true" | vercel env add FEATURE_INVENTORY_MODULE production
echo "true" | vercel env add FEATURE_ACCOUNTING_MODULE production
echo "true" | vercel env add FEATURE_CRM_MODULE production
echo "false" | vercel env add FEATURE_SIGNUP_ENABLED production

# Set security defaults
echo "Setting security defaults..."
echo "86400" | vercel env add SESSION_TIMEOUT production
echo "5" | vercel env add MAX_LOGIN_ATTEMPTS production
echo "900" | vercel env add ACCOUNT_LOCKOUT_DURATION production

# Set Sentry suppression flags
echo "Setting Sentry suppression flags..."
echo "1" | vercel env add SENTRY_SUPPRESS_INSTRUMENTATION_FILE_WARNING production
echo "1" | vercel env add SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING production

# Set default email
echo "info@blackgoldunited.com" | vercel env add FROM_EMAIL production

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "Run 'vercel env ls' to verify all variables are set"
echo "Run 'vercel --prod' to deploy to production"