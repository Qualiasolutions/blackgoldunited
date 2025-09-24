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
app/[module]/                    # Route pages
├── page.tsx                     # Module dashboard
├── [sub-module]/page.tsx        # Sub-module list
└── [sub-module]/create/page.tsx # Create forms

components/
├── layout/                      # Main layout components
│   ├── main-layout.tsx         # Sidebar + header wrapper
│   ├── sidebar.tsx             # 14-module navigation
│   └── header.tsx              # Top bar with user menu
├── modules/[module]/           # Module-specific components
└── ui/                         # shadcn/ui primitives

lib/
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

### Module Development Pattern
When creating new modules:
1. Add route in `app/[module-name]/`
2. Create components in `components/modules/[module-name]/`
3. Update navigation in `lib/config/navigation.ts`
4. Add role permissions in `lib/types/auth.ts`
5. Test with different user roles

### Current Development Status
**📊 REFER TO DEVELOPMENT_PLAN.md FOR EXACT STATUS**

**Current Phase**: Phase 1 - Security & Data Foundation (Week 1)
**Critical Priority**: Database security vulnerabilities MUST be fixed first
- **❌ SECURITY ISSUE**: All 63 database tables have RLS disabled
- **❌ FUNCTIONAL GAP**: No CRUD operations implemented yet
- **✅ FOUNDATION**: Architecture, auth, UI components complete

**Next Steps**: Follow DEVELOPMENT_PLAN.md starting with Task 1.1

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