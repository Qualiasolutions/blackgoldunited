#!/bin/bash

# BlackGoldUnited ERP - Database Switcher
# This script helps you switch between SQLite (local) and Supabase (cloud) databases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_colored() {
    echo -e "${1}${2}${NC}"
}

print_colored $BLUE "🔄 BlackGoldUnited ERP - Database Switcher"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_colored $RED "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check current database configuration
CURRENT_PROVIDER=$(grep 'provider = ' prisma/schema.prisma | head -1 | sed 's/.*provider = "\([^"]*\)".*/\1/')
CURRENT_URL=$(grep 'url.*= ' prisma/schema.prisma | head -1)

echo "Current configuration:"
if [[ $CURRENT_PROVIDER == "sqlite" ]]; then
    print_colored $GREEN "✓ Currently using SQLite (Local Development)"
elif [[ $CURRENT_PROVIDER == "postgresql" ]]; then
    if [[ $CURRENT_URL == *"supabase"* ]]; then
        print_colored $GREEN "✓ Currently using Supabase (Cloud Database)"
    else
        print_colored $GREEN "✓ Currently using PostgreSQL"
    fi
fi

echo ""
echo "Available database options:"
echo "1. SQLite (Local Development)"
echo "2. Supabase (Cloud Database)"
echo "3. Show current status"
echo ""

read -p "Which database would you like to use? (1, 2, or 3): " choice

case $choice in
    1)
        print_colored $YELLOW "🔄 Switching to SQLite (Local Development)..."

        # Update schema for SQLite
        sed -i 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma
        sed -i 's|url.*= env("DATABASE_URL")|url = "file:./dev.db"|' prisma/schema.prisma

        # Copy SQLite environment
        cp .env.local .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
        cat > .env.local << EOF
# BlackGoldUnited ERP - SQLite Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_NAME="BlackGoldUnited ERP"
NEXT_PUBLIC_APP_VERSION=0.1.0

# Database Configuration (SQLite for local development)
DATABASE_URL="file:./dev.db"

# Authentication Configuration
NEXTAUTH_SECRET="dev-super-secret-key-change-in-production-blackgoldunited-2025"
NEXTAUTH_URL=http://localhost:3001

# Feature Flags
FEATURE_INVENTORY_MODULE=true
FEATURE_ACCOUNTING_MODULE=true
FEATURE_CRM_MODULE=true
FEATURE_SIGNUP_ENABLED=true

# Development Settings
NEXT_PUBLIC_DEBUG_MODE=true

# Database Provider Selection
DATABASE_PROVIDER=sqlite
EOF

        print_colored $GREEN "✅ Switched to SQLite database"
        print_colored $BLUE "🔧 Running database setup..."

        npm run db:generate
        npm run db:push
        npm run db:seed

        print_colored $GREEN "🎉 SQLite database is ready!"
        print_colored $YELLOW "💡 Your data is stored locally in: prisma/dev.db"
        ;;

    2)
        print_colored $YELLOW "🔄 Switching to Supabase (Cloud Database)..."

        # Check if Supabase config exists
        if [ ! -f ".env.supabase" ]; then
            print_colored $RED "❌ Error: .env.supabase file not found"
            print_colored $YELLOW "💡 Please set up your Supabase configuration first"
            exit 1
        fi

        print_colored $YELLOW "⚠️  Important: You need to provide your Supabase database password"
        print_colored $BLUE "🔍 You can find this in your Supabase dashboard under Settings > Database"
        echo ""
        read -s -p "Enter your Supabase database password: " db_password
        echo ""

        # Update schema for PostgreSQL
        sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
        sed -i 's|url.*= "file:./dev.db"|url = env("DATABASE_URL")|' prisma/schema.prisma

        # Copy Supabase environment and update password
        cp .env.local .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
        cp .env.supabase .env.local

        # Update database URL with provided password
        sed -i "s/\[YOUR_DB_PASSWORD\]/$db_password/" .env.local

        print_colored $BLUE "🔧 Setting up PostgreSQL schema for Supabase..."

        # Add PostgreSQL specific types back to schema
        sed -i 's/@db\.Decimal([^)]*)/@db.Decimal(15, 2)/g' prisma/schema.prisma
        sed -i 's/@db\.Date/@db.Date/g' prisma/schema.prisma

        print_colored $GREEN "✅ Switched to Supabase database"
        print_colored $BLUE "🔧 Running database setup..."

        npm run db:generate

        print_colored $YELLOW "⚠️  Note: You'll need to run migrations manually on Supabase"
        print_colored $BLUE "💡 Use: npm run db:migrate to deploy your schema to Supabase"

        print_colored $GREEN "🎉 Supabase configuration is ready!"
        print_colored $YELLOW "💡 Your data will be stored in the cloud and accessible from anywhere"
        ;;

    3)
        print_colored $BLUE "📊 Current Database Status"
        echo ""
        print_colored $YELLOW "Schema Configuration:"
        echo "  Provider: $CURRENT_PROVIDER"
        echo "  URL: $(echo $CURRENT_URL | sed 's/password[^@]*@/***@/g')"
        echo ""

        if [[ -f ".env.local" ]]; then
            print_colored $YELLOW "Environment Configuration:"
            DATABASE_PROVIDER=$(grep 'DATABASE_PROVIDER=' .env.local | cut -d'=' -f2)
            echo "  Database Provider: ${DATABASE_PROVIDER:-'not set'}"

            if [[ $DATABASE_PROVIDER == "supabase" ]]; then
                SUPABASE_URL=$(grep 'NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d'=' -f2)
                echo "  Supabase URL: $SUPABASE_URL"
                print_colored $GREEN "  ✓ Configured for Supabase"
            elif [[ $DATABASE_PROVIDER == "sqlite" ]]; then
                print_colored $GREEN "  ✓ Configured for SQLite"
            fi
        fi

        echo ""
        print_colored $YELLOW "Tables Status:"
        if [[ $CURRENT_PROVIDER == "sqlite" ]]; then
            if [[ -f "prisma/dev.db" ]]; then
                print_colored $GREEN "  ✓ SQLite database file exists"
            else
                print_colored $RED "  ❌ SQLite database file not found"
            fi
        fi

        echo ""
        exit 0
        ;;

    *)
        print_colored $RED "❌ Invalid choice. Please select 1, 2, or 3."
        exit 1
        ;;
esac

echo ""
print_colored $BLUE "🚀 Database switch complete!"
print_colored $YELLOW "💡 Restart your development server to apply changes:"
print_colored $GREEN "   npm run dev"
echo ""