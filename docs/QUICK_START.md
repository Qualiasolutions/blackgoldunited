# Quick Start Guide - BlackGoldUnited ERP

**Last Updated**: October 3, 2025
**Production Readiness**: 83%

## 🚀 Get Started in 5 Minutes

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Supabase Account**: Free tier works
- **Vercel Account**: For deployment (optional)

---

## Step 1: Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd blackgoldunited

# Install dependencies (fast with npm v8+)
npm install

# Verify installation
npm run type-check
```

**Expected time**: ~2 minutes

---

## Step 2: Configure Environment

### Option A: Quick Setup (Development)

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

### Option B: Production Setup (Vercel)

```bash
# Validate environment variables
npm run env:validate

# Interactive Vercel setup
npm run env:setup
```

### Required Environment Variables

```bash
# Supabase (get from https://supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Third-party integrations
SENTRY_DSN=your-sentry-dsn
NOVU_API_KEY=your-novu-key
RESEND_API_KEY=your-resend-key
```

**See [.env.example](./.env.example) for complete list**

---

## Step 3: Setup Database

### Option A: Use Existing Production Database

The project already has a production database with 63 tables and RLS policies.

**No setup needed** - just configure your Supabase credentials above.

### Option B: Create Fresh Database

```bash
# Run schema in Supabase SQL Editor
# Copy contents of supabase/schema.sql
# Execute in: https://supabase.com/dashboard/project/_/sql

# Apply performance indexes (optional but recommended)
# Copy contents of supabase/performance_indexes.sql
# Execute in Supabase SQL Editor
```

---

## Step 4: Run Development Server

```bash
# Start with Turbopack (fast refresh)
npm run dev

# Server starts at http://localhost:3000
# Access dashboard at http://localhost:3000/dashboard
```

### Default Test Accounts

The system uses 5 roles. Create test users via Supabase Auth:

| Role | Email | Permissions |
|------|-------|-------------|
| MANAGEMENT | admin@test.com | Full system access |
| FINANCE_TEAM | finance@test.com | Finance, Accounting, Payroll |
| PROCUREMENT_BD | procurement@test.com | Sales, Purchase, Inventory |
| ADMIN_HR | hr@test.com | Employees, Attendance, Organizational |
| IMS_QHSE | qhse@test.com | QHSE, Compliance, Templates |

**Password**: Use Supabase Auth dashboard to create users

---

## Step 5: Verify Installation

### Run Health Checks

```bash
# Type check (should show 0 errors)
npm run type-check

# Linting
npm run lint

# Tests (77 tests should pass)
npm test

# Build for production
npm run build
```

### Access the Application

1. **Navigate to**: http://localhost:3000
2. **Login** with test credentials
3. **Dashboard** should load with stats cards
4. **Navigate** to any of 14 modules

---

## 🎯 Common Development Tasks

### Adding a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes
# - Edit files in app/, components/, or lib/
# - Follow patterns in CLAUDE.md

# 3. Verify changes
npm run type-check
npm run lint
npm test

# 4. Commit
git add .
git commit -m "feat: your feature description"

# 5. Deploy to preview
npm run deploy:preview
```

### Testing RBAC Permissions

```typescript
// In any page component
import { ProtectedRoute } from '@/components/auth/protected-route';
import { UserRole } from '@/lib/types/auth';

export default function ModulePage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.MANAGEMENT, UserRole.FINANCE_TEAM]}>
      {/* Your content */}
    </ProtectedRoute>
  );
}
```

### Creating a New API Route

```typescript
// app/api/your-module/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';
import { OPTIMIZED_SELECTS } from '@/lib/database/query-helpers';

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const authResult = await authenticateAndAuthorize(request, 'your_module', 'GET');
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // 2. Query database with optimized selects
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('your_table')
    .select(OPTIMIZED_SELECTS.yourTable);

  // 3. Return response
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 200 });
}
```

---

## 📊 Project Structure

```
blackgoldunited/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (100+ endpoints)
│   ├── dashboard/         # Main dashboard
│   ├── sales/             # Sales module (11 pages)
│   ├── clients/           # Client management (4 pages)
│   └── [13 more modules]  # 61 total pages
├── components/            # React components
│   ├── auth/             # Authentication guards
│   ├── ui/               # shadcn/ui components
│   └── modules/          # Module-specific components
├── lib/                   # Utilities & helpers
│   ├── auth/             # Authentication & RBAC
│   ├── database/         # Query optimization helpers
│   ├── supabase/         # Database clients
│   └── types/            # TypeScript definitions
├── supabase/              # Database schemas
│   ├── schema.sql        # Main schema (63 tables)
│   └── performance_indexes.sql  # Performance indexes
├── docs/                  # Documentation
└── __tests__/            # Test suites (77 tests)
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests (77 tests)
npm test

# Watch mode (for development)
npm run test:watch

# CI mode (for deployment)
npm run test:ci
```

### Test Coverage

- **Total Tests**: 77 (100% pass rate)
- **Test Suites**: 4 files
- **Coverage**: Business logic focused
  - Authentication & RBAC: 17 tests
  - Utilities: 40 tests
  - Sales API: 20 tests

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
# First time setup
vercel login
vercel link

# Deploy to production
npm run deploy

# Or use Vercel dashboard
# Push to main branch → auto-deploys
```

### Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Type check passing (`npm run type-check`)
- [ ] Build successful (`npm run build`)
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied (if any)
- [ ] Sentry configured for error tracking

**See [docs/setup/VERCEL_DEPLOYMENT.md](./setup/VERCEL_DEPLOYMENT.md) for detailed guide**

---

## 🔧 Troubleshooting

### TypeScript Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run type-check

# Check specific file
npx tsc --noEmit path/to/file.ts
```

### Database Connection Issues

1. Verify Supabase credentials in `.env.local`
2. Check Supabase project is not paused
3. Test connection: Visit https://your-project.supabase.co

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

### Permission Issues

Check RBAC configuration:
- User role in `auth.users` table
- `ACCESS_CONTROL_MATRIX` in `lib/auth/permissions.ts`
- RLS policies in Supabase

---

## 📚 Next Steps

1. **Read Documentation**:
   - [CLAUDE.md](../CLAUDE.md) - Complete project guide
   - [API Documentation](./development/API_DOCUMENTATION.md)
   - [Database Setup](./setup/DATABASE_SETUP.md)

2. **Explore Features**:
   - Try all 14 modules
   - Test different user roles
   - Review production deployment

3. **Development**:
   - Add your custom features
   - Follow coding patterns in existing code
   - Run tests before committing

4. **Performance**:
   - Apply database indexes (see `supabase/performance_indexes.sql`)
   - Use optimized queries (see `lib/database/query-helpers.ts`)
   - Monitor with Vercel Analytics

---

## 🆘 Getting Help

- **Documentation**: Check `docs/` folder first
- **CLAUDE.md**: Comprehensive project guide
- **Code Examples**: Look at existing modules
- **Issues**: All patterns are documented in code comments

---

## 🎯 Success Criteria

You're ready when:

✅ Development server runs without errors
✅ You can login with test account
✅ Dashboard loads with stats
✅ All tests pass (`npm test`)
✅ Build completes successfully (`npm run build`)
✅ You understand the 14 module structure
✅ You can create a new API endpoint
✅ You can add a new page

**Time to productivity**: ~30 minutes after reading this guide

---

**Ready to build? Start with the [CLAUDE.md](../CLAUDE.md) for in-depth technical documentation!**
