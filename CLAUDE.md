# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm test` - No tests configured yet
- `npm run test:watch` - No tests configured yet
- `npm run test:e2e` - No E2E tests configured yet

### Database
- `npm run db:backup` - Use Supabase Dashboard for backup

## Architecture

### Project Type
Next.js 15 application using the App Router with Turbopack for development. Built with TypeScript, Tailwind CSS, and Supabase for backend services.

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Auth**: Supabase Auth with JWT tokens
- **Database**: Supabase (PostgreSQL)
- **UI**: Radix UI components + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **State**: React hooks and Supabase real-time subscriptions
- **Charts**: Recharts
- **Type Safety**: TypeScript with strict mode

### Directory Structure
- `app/` - Next.js App Router pages and API routes
  - Each module has its own directory (sales, purchase, inventory, etc.)
  - API routes in `app/api/`
- `components/` - Reusable UI components
  - `ui/` - Base UI components (buttons, forms, etc.)
  - `layout/` - Layout components (sidebar, header)
  - Module-specific components in subdirectories
- `lib/` - Utilities and configuration
  - `supabase/` - Database client and utilities
  - `auth/` - Authentication utilities
  - `types/` - TypeScript type definitions
  - `hooks/` - Custom React hooks
- `middleware.ts` - Route protection and authentication

### Authentication & Authorization
Role-based access control (RBAC) system with 5 user roles:
- `MANAGEMENT` - Full access to all modules
- `FINANCE_TEAM` - Full access to finance/accounting, read-only elsewhere
- `PROCUREMENT_BD` - Full access to procurement/sales, limited finance access
- `ADMIN_HR` - Full access to HR/admin, limited elsewhere
- `IMS_QHSE` - Full access to QHSE/compliance, limited elsewhere

Access levels: `NONE`, `READ`, `FULL` with granular CRUD permissions.

### Business Modules
14 core business modules based on ERP requirements:
1. Sales (invoices, RFQ, payments)
2. Clients (contacts, settings)
3. Inventory (products, stock, warehouses)
4. Purchase (invoices, suppliers, payments)
5. Finance (expenses, incomes, accounts)
6. Accounting (journal entries, chart of accounts)
7. Employees (HR management)
8. Organizational (structure, departments)
9. Attendance (logs, shifts, leaves)
10. Payroll (contracts, pay runs)
11. Reports (across all modules)
12. Templates (printable, prefilled)
13. QHSE (quality, health, safety, environment)
14. Settings (system configuration)

### Route Protection
Comprehensive middleware-based route protection in `middleware.ts`:
- Public routes (auth pages)
- Protected routes with role-based access
- Module-specific permissions checking
- Automatic redirects for unauthorized access

### Environment Variables
Uses multiple environment files:
- `.env` - Base configuration
- `.env.local` - Local development overrides
- `.env.production` - Production settings
- `.env.supabase` - Supabase-specific configuration

Required Supabase environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Development Notes
- Uses `output: 'standalone'` for Vercel deployment
- ESLint errors ignored during builds (set in next.config.ts)
- TypeScript strict mode enabled
- All components should follow existing patterns in `components/ui/`
- Use Supabase client from `lib/supabase/client.ts` for browser operations
- Authentication state managed through Supabase Auth helpers