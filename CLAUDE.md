# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 **CRITICAL - READ FIRST**

### **📋 DEVELOPMENT PLAN - SOURCE OF TRUTH**
**BEFORE DOING ANYTHING**: Read `/DEVELOPMENT_PLAN.md` - This is the master development plan and progress tracker.

- **Current Status**: Check the "Quick Status Overview" section
- **Active Tasks**: Work ONLY on tasks for the current week/phase
- **Progress Tracking**: Mark completed tasks with [x] and update status
- **Agent Handoff**: Follow the "Agent Handoff Instructions" section

**⚠️ DO NOT**:
- Skip security tasks (Phase 1 is CRITICAL)
- Work on future phases without completing current ones
- Make changes without updating the progress tracker
- Assume what needs to be done - check the plan first

**✅ ALWAYS**:
- Update DEVELOPMENT_PLAN.md when completing tasks
- Test with all 5 user roles for any functionality
- Follow the weekly milestone goals
- Document blockers in the progress tracking section

---

## Project Overview
BlackGoldUnited ERP - A comprehensive business management system with 14 modules (sales, clients, inventory, purchases, finance, accounting, HR, payroll, attendance, QHSE, templates, reports, admin) and role-based access control.

## Essential Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build           # Production build
npm run start           # Run production server

# Code Quality (run before committing)
npm run lint            # Check for linting errors
npm run lint:fix        # Auto-fix linting issues
npm run type-check      # TypeScript type checking

# Database
npm run db:backup       # Backup PostgreSQL database

# Testing (not yet implemented)
npm run test            # Placeholder - no tests configured
```

## High-Level Architecture

### Tech Stack
- **Framework**: Next.js 15.5.3 with App Router, TypeScript 5, React 19
- **Database**: PostgreSQL on Supabase (use Supabase client, NOT Prisma)
- **Auth**: Supabase Auth with SSR (@supabase/ssr)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table for data grids

### Critical Authentication Flow
```typescript
// Client-side: Use the useAuth hook
import { useAuth } from '@/lib/hooks/useAuth'

// Server-side: Use async createClient
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Middleware: Handles all route protection automatically
// See middleware.ts for implementation
```

### Directory Structure & Patterns
```
app/
├── [module]/                    # Route pages
│   ├── page.tsx                # Module dashboard
│   ├── [sub-module]/page.tsx   # Sub-module list
│   └── [sub-module]/create/    # Create forms
└── api/                        # API Layer (NEW!)
    ├── clients/                # Clients API endpoints
    │   ├── route.ts           # GET (list), POST (create)
    │   └── [id]/route.ts      # GET, PUT, DELETE single client
    ├── sales/                  # Sales API endpoints
    │   └── invoices/           # Invoice CRUD operations
    │       ├── route.ts       # GET (list), POST (create)
    │       └── [id]/route.ts  # GET, PUT, DELETE single invoice
    └── [future-modules]/      # Additional API modules

components/
├── layout/                      # Main layout components
├── modules/[module]/           # Module-specific components
└── ui/                         # shadcn/ui primitives

lib/
├── auth/                       # Authentication & Authorization (NEW!)
│   ├── api-auth.ts            # API authentication middleware
│   └── permissions.ts         # Role-based access control
├── supabase/                   # Database clients
│   ├── client.ts              # Browser client
│   └── server.ts              # SSR client (async)
├── hooks/useAuth.ts           # Authentication hook
├── config/navigation.ts       # Role-based nav config
└── types/                     # TypeScript definitions
```

### Role-Based Access Control
5 roles control access to 14 modules via middleware.ts:
- **MANAGEMENT**: Full system access
- **FINANCE_TEAM**: Finance modules + read access
- **PROCUREMENT_BD**: Procurement + projects
- **ADMIN_HR**: Admin + HR modules
- **IMS_QHSE**: Compliance modules only

Access matrix defined in `lib/types/auth.ts` and enforced in `middleware.ts`.

### API Infrastructure & Authentication Flow
**NEW IN WEEK 2**: Complete API layer with enterprise-grade security

#### API Authentication Pattern
```typescript
// All API routes use this pattern:
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  // 1. Authenticate user and check permissions
  const authResult = await authenticateAndAuthorize(request, 'clients', 'GET');
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // 2. Use Supabase with authenticated context
  const supabase = await createClient();
  // Database operations here...
}
```

#### Role-Based API Access
- **MANAGEMENT**: Full CRUD access to all modules
- **FINANCE_TEAM**: Read-only access to clients, full access to finance
- **PROCUREMENT_BD**: Full access to clients + procurement modules
- **ADMIN_HR**: Read-only access to clients, full HR access
- **IMS_QHSE**: No client access (returns 403 Forbidden)

#### API Response Standards
```typescript
// Success Response
{ success: true, data: [...], pagination?: {...} }

// Error Response
{ error: "Descriptive error message" }
// With appropriate HTTP status codes (400, 401, 403, 404, 500)
```

#### Invoice API Patterns (NEW!)
```typescript
// Invoice with line items structure
export const invoiceSchema = z.object({
  clientId: z.string().uuid(),
  dueDate: z.string().datetime(),
  items: z.array(invoiceItemSchema).min(1),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']),
  taxRate: z.number().min(0).max(100)
});

// Auto-generated invoice numbers: INV-YYYYMMDD-NNNN
// Real-time calculations for subtotal, tax, total
```

### Module Development Pattern
When creating new modules:
1. **API First**: Create `/app/api/[module-name]/` endpoints
2. **Frontend**: Add route in `app/[module-name]/`
3. **Components**: Create in `components/modules/[module-name]/`
4. **Navigation**: Update `lib/config/navigation.ts`
5. **Permissions**: Add role permissions in `lib/types/auth.ts`
6. **Test**: Verify with all 5 user roles

### Current Development Status
**📊 REFER TO DEVELOPMENT_PLAN.md FOR EXACT STATUS**

**Current Phase**: Phase 2 - Core Modules Implementation (Week 6 Ready)
**Current Progress**: 55% Complete (5 weeks done, 9 weeks remaining)
- **✅ SECURITY COMPLETE**: All 63 database tables secured with RLS
- **✅ API INFRASTRUCTURE**: Complete API layer for Clients, Sales, and Inventory modules
- **✅ AUTHENTICATION**: Working role-based middleware and permissions
- **✅ FOUNDATION**: Architecture, auth, UI components, API layer complete
- **✅ WEEK 3 COMPLETE**: Frontend-Backend Connection - Full Client Management System
- **✅ WEEK 4 COMPLETE**: Sales Module Foundation - Complete Invoice Management System
- **✅ WEEK 5 COMPLETE**: Inventory Management System - Product, Stock, and Warehouse Management
- **✅ INVENTORY MODULE**: Full product CRUD, stock tracking, warehouse management, movement logging
- **✅ REFERENCE PATTERNS**: Complete CRUD patterns established for all future modules

**Next Steps**: Follow DEVELOPMENT_PLAN.md starting with Week 6 - Purchase Management (Task 6.1: Create supplier API)

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Public anonymous key
```

### Development Workflow
**🚨 MANDATORY**: Check DEVELOPMENT_PLAN.md before starting any work

1. **Read Development Plan**: Check current week, phase, and active tasks
2. **Work on Assigned Tasks**: Follow the specific task list for current week
3. **Update Progress**: Mark completed tasks in DEVELOPMENT_PLAN.md
4. **Test Thoroughly**: Test with all 5 user roles for any functionality
5. **Code Quality**: Run `npm run type-check` and `npm run lint` before committing
6. **Follow Patterns**: Use shadcn/ui components and absolute imports with @/

**🔄 Task Completion Cycle**:
1. Read task description in DEVELOPMENT_PLAN.md
2. Implement the functionality
3. Test with appropriate user roles
4. Mark task complete [x] in DEVELOPMENT_PLAN.md
5. Add completion notes and any issues found
6. Update weekly progress tracking section