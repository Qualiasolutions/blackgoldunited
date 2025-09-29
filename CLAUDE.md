# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BlackGoldUnited ERP is a production-ready Enterprise Resource Planning system built with Next.js 15, featuring 14 business modules, role-based access control, and comprehensive third-party integrations (Sentry, Novu, Resend, Inngest, Checkly).

**Tech Stack**: Next.js 15.5.3 + React 19 + TypeScript + Supabase (PostgreSQL) + Vercel
**Live**: https://blackgoldunited-10cnui8d7-qualiasolutionscy.vercel.app

## Essential Commands

### Development
```bash
npm run dev              # Start development server with Turbopack
npm run build           # Production build (runs type-check first)
npm run type-check      # TypeScript validation without emit
npm run lint            # ESLint code quality check
npm run lint:fix        # Auto-fix linting issues
```

### Deployment & Environment
```bash
npm run deploy          # Deploy to Vercel production
npm run deploy:preview  # Create preview deployment
npm run env:validate    # Validate environment variables
npm run env:setup       # Interactive Vercel env setup script
npm run env:batch       # Batch upload env vars to Vercel
npm run health:check    # Check production deployment health
```

### Testing & Monitoring
```bash
npm test                # Run tests (placeholder - no tests yet)
./scripts/security-audit-gate.sh    # Run security audit
./scripts/mcp-health-monitor.sh     # Monitor MCP server health
```

## Architecture Overview

### Authentication & Authorization System

**5-Role RBAC System** (`lib/types/auth.ts`):
- `MANAGEMENT` - Full system access
- `FINANCE_TEAM` - Finance, accounting, payroll modules
- `PROCUREMENT_BD` - Purchase, inventory, sales modules
- `ADMIN_HR` - Employees, attendance, organizational modules
- `IMS_QHSE` - QHSE, compliance, templates modules

**Access Levels**: `NONE`, `READ`, `FULL`
**Granular Permissions**: Each role has specific CRUD permissions per module

**Key Files**:
- `middleware.ts` - Route-level protection and role enforcement (lines 1-50 show route permission mapping)
- `lib/auth/api-auth.ts` - API authentication middleware with `authenticateAndAuthorize()` function
- `lib/auth/permissions.ts` - Permission checking utilities and ACCESS_CONTROL_MATRIX
- `lib/types/auth.ts` - Type definitions for roles, permissions, and auth data structures
- `lib/hooks/useAuth.ts` - Client-side authentication hook with login/logout/session management

### Database Architecture

**Supabase PostgreSQL** with Row Level Security (RLS) on all 63 tables

**Schema Files**:
- `supabase/schema.sql` - Main database schema
- `supabase/complete_schema_update.sql` - Schema updates and migrations

**Client Initialization**:
- `lib/supabase/client.ts` - Browser client (`createClient()`)
- `lib/supabase/server.ts` - Server-side client with cookie handling

### API Structure

**Location**: `app/api/`
**Pattern**: Next.js App Router API routes (route handlers)

**All API routes use**:
```typescript
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';

// In route handler:
const authResult = await authenticateAndAuthorize(request, 'module_name', 'GET');
if (!authResult.success) {
  return NextResponse.json({ error: authResult.error }, { status: authResult.status });
}
const user = authResult.user;
```

**Key API Modules**:
- `app/api/dashboard/` - Dashboard stats and activity feeds
- `app/api/sales/` - Sales invoices, RFQs, payments
- `app/api/clients/` - Client management
- `app/api/inventory/` - Product and warehouse management
- `app/api/finance/` - Financial transactions
- `app/api/hr/` - Employee management
- `app/api/notifications/` - Novu notification integration
- `app/api/reports/` - Report generation
- `app/api/search/` - Global search across modules

### Frontend Architecture

**Framework**: Next.js 15 App Router with React Server Components
**UI Library**: Radix UI + Tailwind CSS + shadcn/ui components
**Path Alias**: `@/*` maps to project root (see `tsconfig.json`)

**Key Directories**:
- `app/` - Pages and layouts (App Router structure)
- `components/` - Reusable UI components
  - `components/auth/` - Protected routes, role guards
  - `components/dashboard/` - Dashboard-specific components
  - `components/ui/` - shadcn/ui base components
- `lib/hooks/` - Custom React hooks
  - `useAuth.ts` - Authentication state and methods
  - `useDashboardStats.ts` - Real-time dashboard metrics
  - `useNotifications.ts` - Novu notification center integration
  - `useGlobalSearch.ts` - Multi-module search
  - `useRealtimeStats.ts` - WebSocket-based real-time updates
- `lib/utils/` - Utility functions
- `lib/config/` - Configuration constants

### Module Structure

**14 Business Modules** (matching `app/` directory structure):
1. **Sales** - Invoices, RFQs, credit notes, payments
2. **Clients** - Client management and contacts
3. **Inventory** - Products, warehouses, stock, requisitions
4. **Purchase** - Purchase orders, supplier management
5. **Finance** - Financial transactions and reporting
6. **Accounting** - General ledger, accounts
7. **Employees** - Employee records and management
8. **Organizational** - Company structure, departments
9. **Attendance** - Time tracking and attendance logs
10. **Payroll** - Salary processing and payslips
11. **Reports** - Cross-module reporting
12. **Templates** - Document templates
13. **QHSE** - Quality, Health, Safety, Environment
14. **Settings** - System configuration

Each module follows consistent structure:
- Page components in `app/[module]/`
- API routes in `app/api/[module]/`
- Shared types in `lib/types/`
- Module-specific hooks in `lib/hooks/`

### Third-Party Integrations

**Sentry** (`sentry.client.config.ts`, `sentry.server.config.ts`):
- Error tracking and performance monitoring
- Automatic Vercel Cron Monitors integration

**Novu** (`lib/novu/`):
- Real-time notification system
- Multi-channel notifications (in-app, email)
- Integration via `useNotifications` hook

**Resend** (`lib/resend/`):
- Transactional email delivery
- Used for auth emails and notifications

**Inngest** (`lib/inngest/`, `app/api/inngest/`):
- Background job processing
- Scheduled tasks and workflows

**Checkly**:
- API monitoring and uptime checks
- Configured via env vars

### Environment Configuration

**Files**:
- `.env.local` - Local development (gitignored)
- `.env.production` - Production environment
- `.env.example` - Template with all required variables

**Critical Variables**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SENTRY_DSN` - Sentry error tracking
- `NOVU_API_KEY` - Novu notifications
- `RESEND_API_KEY` - Email delivery
- `INNGEST_*` - Background job configuration

**Validation**: Run `npm run env:validate` before deployment

### Security Configuration

**Next.js Security Headers** (`next.config.ts` lines 16-60):
- CSP, X-Frame-Options, HSTS, etc.
- Supabase domains whitelisted for connections

**Middleware Protection** (`middleware.ts`):
- All routes under `/dashboard`, `/sales`, `/clients`, etc. are protected
- Authentication checked on every request
- Role-based route access enforcement

**RLS Policies**: All database tables have Row Level Security policies matching the 5-role RBAC system

## Development Workflow

### Making Changes to a Module

1. **Understand permissions**: Check `lib/types/auth.ts` for role access to the module
2. **Update database**: Modify `supabase/schema.sql` and run migrations via Supabase dashboard
3. **Add/update API route**: Create route in `app/api/[module]/route.ts` with proper auth
4. **Update types**: Add TypeScript types to `lib/types/` or `types/`
5. **Create UI components**: Add to `components/[module]/` or reuse from `components/ui/`
6. **Add page**: Create in `app/[module]/page.tsx`
7. **Test locally**: `npm run dev` and verify functionality
8. **Type check**: `npm run type-check` before committing
9. **Deploy**: `npm run deploy` or push to trigger Vercel CI/CD

### Adding a New API Endpoint

```typescript
// app/api/[module]/[endpoint]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // 1. Authenticate and authorize
  const authResult = await authenticateAndAuthorize(request, 'module_name', 'GET');
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // 2. Get Supabase client and perform DB operations
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', authResult.user.id);

  // 3. Return response
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 200 });
}
```

### Working with Supabase

**Server-side** (API routes, Server Components):
```typescript
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient(); // Note: async
```

**Client-side** (Client Components, hooks):
```typescript
import { createClient } from '@/lib/supabase/client';
const supabase = createClient(); // Note: not async
```

**Row Level Security**: All queries automatically filtered by RLS policies based on user role

### Adding a Protected Page

```typescript
// app/[module]/page.tsx
import { ProtectedRoute } from '@/components/auth/protected-route';
import { UserRole } from '@/lib/types/auth';

export default function ModulePage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.MANAGEMENT, UserRole.FINANCE_TEAM]}>
      {/* Page content */}
    </ProtectedRoute>
  );
}
```

## Common Patterns

### Client-side Data Fetching with SWR Pattern
```typescript
import { useState, useEffect } from 'react';

export function useModuleData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/module/endpoint')
      .then(res => res.json())
      .then(data => setData(data))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

### Error Handling in API Routes
- `401` - Unauthenticated
- `403` - Forbidden (insufficient permissions)
- `400` - Bad request (validation errors)
- `500` - Internal server error
- `200` - Success

### Real-time Data with Supabase Subscriptions
See `lib/hooks/useRealtimeStats.ts` for implementation pattern

## Troubleshooting

### Build Failures
- Run `npm run type-check` to identify TypeScript errors
- Check `next.config.ts` - eslint is ignored during builds to prevent linting failures from blocking deployment
- Verify all environment variables are set: `npm run env:validate`

### Authentication Issues
- Verify Supabase credentials in environment variables
- Check `middleware.ts` for route protection rules
- Inspect `lib/auth/api-auth.ts:54` for authentication logic
- Use browser DevTools to inspect cookies and session state

### Database Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project is not paused
- Inspect RLS policies if queries return empty results

### Permission Issues
- Check `lib/auth/permissions.ts` for ACCESS_CONTROL_MATRIX
- Verify user role in database matches expected role
- Review `middleware.ts` route permission requirements

### Development Server Issues
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node version: requires Node >= 18.0.0

## Important Notes

- **Do not commit** `.env.local`, `.env.production`, or any files with secrets
- **Always use** `authenticateAndAuthorize()` in API routes - no exceptions
- **Test permissions** with different user roles before deploying
- **Run type-check** before committing to catch TypeScript errors early
- **Security first**: All database queries are protected by RLS, all routes by middleware
- **Deployment**: Vercel auto-deploys on push to main branch
- **Database migrations**: Use Supabase Dashboard SQL Editor - no local migration files

## Documentation References

- `docs/setup/` - Deployment and environment setup guides
- `docs/development/API_DOCUMENTATION.md` - Complete API reference
- `README.md` - Quick start and project overview
- `.env.example` - All required environment variables with descriptions