# Vercel Environment Variables Configuration

## Required Environment Variables for Production

Copy and paste these environment variables into your Vercel project dashboard:

### Database & Supabase Configuration
```
DATABASE_URL=postgresql://postgres.vphziwoympzbtnndnqph:Zambelis1!@aws-0-us-west-1.pooler.supabase.com:6543/postgres?schema=public&sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://vphziwoympzbtnndnqph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaHppd295bXB6YnRubmRucXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjA2MTcsImV4cCI6MjA3MzkzNjYxN30.-amhXg1seYaz90SOwLqxDv8F-YbHu6Vp1mmME72xRuM
```

### Authentication Configuration
```
NEXTAUTH_SECRET=super-secure-nextauth-secret-for-production-blackgoldunited-2025-change-this
NEXTAUTH_URL=https://nextjs-boilerplate-six-blue-69.vercel.app
```

### Application Configuration
```
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=BlackGoldUnited ERP
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Feature Flags
```
FEATURE_INVENTORY_MODULE=true
FEATURE_ACCOUNTING_MODULE=true
FEATURE_CRM_MODULE=true
FEATURE_SIGNUP_ENABLED=false
NEXT_PUBLIC_DEBUG_MODE=false
DATABASE_PROVIDER=supabase
```

## Test Credentials

After setting these environment variables, you can test login with:
- **Email**: admin@blackgoldunited.com
- **Password**: admin123
- **Role**: MANAGEMENT (full access)

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable above with its value
4. Set Environment: Production
5. Save and redeploy

## Critical Notes

⚠️ **IMPORTANT**: These credentials are for initial testing only. In production:
- Change the `NEXTAUTH_SECRET` to a strong, unique value
- Update the default admin password
- Consider rotating database credentials
- Enable leaked password protection in Supabase dashboard