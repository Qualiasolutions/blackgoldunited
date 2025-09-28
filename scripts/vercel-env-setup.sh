#!/bin/bash

# BlackGoldUnited ERP - Vercel Environment Variables Setup Script
# This script configures all necessary environment variables for production deployment

set -e

echo "🚀 BlackGoldUnited ERP - Vercel Environment Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to add environment variable to Vercel
add_env_var() {
    local key=$1
    local value=$2
    local environment=${3:-"production,preview,development"}

    echo -e "${BLUE}Setting $key for environments: $environment${NC}"

    if [ -z "$value" ] || [ "$value" = "your-placeholder-value" ]; then
        echo -e "${YELLOW}⚠️  Skipping $key - no value provided${NC}"
        return
    fi

    vercel env add "$key" "$environment" <<< "$value"
    echo -e "${GREEN}✅ $key configured${NC}"
}

# Function to prompt for environment variable
prompt_env_var() {
    local key=$1
    local description=$2
    local example=$3
    local required=${4:-false}

    echo ""
    echo -e "${BLUE}$description${NC}"
    if [ -n "$example" ]; then
        echo -e "Example: ${YELLOW}$example${NC}"
    fi

    if [ "$required" = true ]; then
        echo -e "${RED}* Required${NC}"
    else
        echo -e "${YELLOW}Optional (press Enter to skip)${NC}"
    fi

    read -p "Enter $key: " value

    if [ "$required" = true ] && [ -z "$value" ]; then
        echo -e "${RED}❌ $key is required!${NC}"
        return 1
    fi

    if [ -n "$value" ]; then
        add_env_var "$key" "$value"
    fi
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found!${NC}"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Please log in to Vercel first${NC}"
    vercel login
fi

echo ""
echo -e "${GREEN}Setting up core application environment variables...${NC}"

# Core Application Variables
add_env_var "NODE_ENV" "production"
add_env_var "NEXT_PUBLIC_APP_NAME" "BlackGoldUnited ERP"
add_env_var "NEXT_PUBLIC_APP_VERSION" "1.0.0"

echo ""
echo -e "${GREEN}🔐 Setting up Supabase configuration...${NC}"
echo "Get these from your Supabase project settings:"

prompt_env_var "NEXT_PUBLIC_SUPABASE_URL" "Supabase Project URL" "https://your-project.supabase.co" true
prompt_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase Anonymous Key" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." true

echo ""
echo -e "${GREEN}📊 Setting up Sentry for error monitoring...${NC}"
echo "Sign up at https://sentry.io and create a Next.js project:"

prompt_env_var "NEXT_PUBLIC_SENTRY_DSN" "Sentry DSN" "https://abc123@o123456.ingest.sentry.io/123456"
prompt_env_var "SENTRY_ORG" "Sentry Organization Slug" "blackgoldunited"
prompt_env_var "SENTRY_PROJECT" "Sentry Project Name" "blackgoldunited-erp"
prompt_env_var "SENTRY_AUTH_TOKEN" "Sentry Auth Token" "sntrys_abc123..."

echo ""
echo -e "${GREEN}🔔 Setting up Novu for notifications...${NC}"
echo "Sign up at https://novu.co and get your API credentials:"

prompt_env_var "NOVU_API_KEY" "Novu API Key" "nv_abc123..."
prompt_env_var "NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER" "Novu Application Identifier" "app_abc123"

echo ""
echo -e "${GREEN}📧 Setting up Resend for email delivery...${NC}"
echo "Sign up at https://resend.com and create an API key:"

prompt_env_var "RESEND_API_KEY" "Resend API Key" "re_abc123..."

echo ""
echo -e "${GREEN}⚙️ Setting up Inngest for background functions...${NC}"
echo "Sign up at https://inngest.com and get your keys:"

prompt_env_var "INNGEST_EVENT_KEY" "Inngest Event Key" "evt_abc123..."
prompt_env_var "INNGEST_SIGNING_KEY" "Inngest Signing Key" "signkey_abc123..."
add_env_var "NEXT_PUBLIC_INNGEST_ENV" "production"

echo ""
echo -e "${GREEN}📈 Setting up Checkly for API monitoring...${NC}"
echo "Sign up at https://checkly.com and get your API credentials:"

prompt_env_var "CHECKLY_API_KEY" "Checkly API Key" "cu_abc123..."
prompt_env_var "CHECKLY_ACCOUNT_ID" "Checkly Account ID" "12345"

echo ""
echo -e "${GREEN}✉️ Setting up email configuration...${NC}"
echo "SMTP settings for backup email functionality:"

prompt_env_var "SMTP_HOST" "SMTP Host" "smtp.gmail.com"
prompt_env_var "SMTP_PORT" "SMTP Port" "587"
prompt_env_var "SMTP_SECURE" "SMTP Secure (true/false)" "false"
prompt_env_var "SMTP_USER" "SMTP Username" "info@blackgoldunited.com"
prompt_env_var "SMTP_PASSWORD" "SMTP Password" "your-app-password"
add_env_var "FROM_EMAIL" "info@blackgoldunited.com"

echo ""
echo -e "${GREEN}🎛️ Setting up feature flags...${NC}"

add_env_var "FEATURE_INVENTORY_MODULE" "true"
add_env_var "FEATURE_ACCOUNTING_MODULE" "true"
add_env_var "FEATURE_CRM_MODULE" "true"
add_env_var "FEATURE_SIGNUP_ENABLED" "false"

echo ""
echo -e "${GREEN}🔒 Setting up security settings...${NC}"

add_env_var "SESSION_TIMEOUT" "86400"
add_env_var "MAX_LOGIN_ATTEMPTS" "5"
add_env_var "ACCOUNT_LOCKOUT_DURATION" "900"

echo ""
echo -e "${GREEN}🎯 Setting up Sentry environment suppression flags...${NC}"

add_env_var "SENTRY_SUPPRESS_INSTRUMENTATION_FILE_WARNING" "1"
add_env_var "SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING" "1"

echo ""
echo -e "${GREEN}✅ Environment variables setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run 'vercel env ls' to verify all variables are set"
echo "2. Run 'vercel --prod' to deploy to production"
echo "3. Test your deployment with the health check: https://your-domain.vercel.app/api/health"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- Supabase: https://supabase.com/docs"
echo "- Sentry: https://docs.sentry.io/platforms/javascript/guides/nextjs/"
echo "- Novu: https://docs.novu.co/"
echo "- Resend: https://resend.com/docs"
echo "- Inngest: https://www.inngest.com/docs"
echo "- Checkly: https://www.checklyhq.com/docs/"