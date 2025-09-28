# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**BlackGoldUnited ERP System** - A comprehensive Enterprise Resource Planning system with 14 business modules, role-based access control, and production integrations.

## 🏢 Project Overview

**BlackGoldUnited ERP** is a comprehensive Enterprise Resource Planning system designed specifically for BlackGoldUnited's business operations. This is a production-ready Next.js 15 application with full authentication, role-based access control, and 14 integrated business modules.

### Business Purpose
- Complete business management solution for BlackGoldUnited
- Multi-role access control for different business functions
- Real-time dashboard with analytics and insights
- Document management and reporting capabilities
- Integration with professional services for email, notifications, and monitoring

## 🚀 Current Production Status

**Production URL**: https://blackgoldunited-10cnui8d7-qualiasolutionscy.vercel.app
**Health Status**: ✅ All systems operational
**Deployment Platform**: Vercel with automatic CI/CD
**Database**: Supabase (PostgreSQL) with Row Level Security

### Latest Deployment
- **Commit**: `65aa6f09` - Production-ready with full Vercel Marketplace integrations
- **Date**: September 28, 2025
- **Status**: ✅ Successfully deployed with all integrations

## ⚙️ Commands & Scripts

### Development Commands
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Code quality
npm run lint              # Run ESLint
npm run lint:fix          # Auto-fix ESLint issues
npm run type-check        # Run TypeScript type checking
```

### Testing Commands
```bash
npm test                  # No tests configured yet
npm run test:watch        # No tests configured yet
npm run test:e2e          # No E2E tests configured yet
```

### Validation Commands
```bash
# Post-development validation (run after changes)
npm run type-check        # TypeScript type validation
npm run lint             # ESLint code quality
npm run build            # Production build verification
```

### Database Commands
```bash
npm run db:backup         # Use Supabase Dashboard for backup
```

### Deployment Commands
```bash
# Production deployment
npm run deploy            # Deploy to Vercel production
npm run deploy:preview    # Deploy preview/staging

# Environment management
npm run env:setup         # Interactive environment setup
npm run env:batch         # Batch environment setup
npm run env:validate      # Validate current environment
npm run env:list          # List all environment variables

# Health monitoring
npm run health:check      # Check deployment health
```

## 🏗️ Architecture & Tech Stack

### Core Framework
- **Framework**: Next.js 15.5.3 with App Router
- **React**: 19.1.0 with latest features
- **TypeScript**: Strict mode enabled
- **Build Tool**: Turbopack for development
- **Deployment**: Vercel with standalone output

### Backend & Database
- **Database**: Supabase (PostgreSQL) with 63 tables
- **Authentication**: Supabase Auth with JWT tokens and role-based middleware
- **Real-time**: Supabase real-time subscriptions for live updates
- **Security**: Row Level Security (RLS) on all tables + comprehensive CSP headers
- **API**: Next.js API routes with authentication and role validation

### Frontend & UI
- **UI Framework**: Radix UI components
- **Styling**: Tailwind CSS with custom design system
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks and Supabase subscriptions
- **Charts**: Recharts for analytics
- **Tables**: TanStack React Table

### Production Integrations
- **Error Monitoring**: Sentry.io
- **Email Service**: Resend (info@blackgoldunited.com)
- **Notifications**: Novu
- **Background Jobs**: Inngest
- **API Monitoring**: Manual monitoring via health endpoint

## 📁 Directory Structure

```
blackgoldunited/
├── app/                          # Next.js App Router
│   ├── accounting/               # Accounting module
│   ├── api/                      # API routes
│   ├── attendance/               # Attendance module
│   ├── auth/                     # Authentication pages
│   ├── clients/                  # Client management
│   ├── dashboard/                # Main dashboard
│   ├── documents/                # Document management
│   ├── employees/                # Employee management
│   ├── finance/                  # Finance module
│   ├── inventory/                # Inventory management
│   ├── payroll/                  # Payroll system
│   ├── purchase/                 # Purchase module
│   ├── qhse/                     # Quality, Health, Safety, Environment
│   ├── reports/                  # Reporting system
│   ├── sales/                    # Sales management
│   └── settings/                 # System settings
├── components/                   # Reusable UI components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   ├── data-table/               # Table components
│   ├── layout/                   # Layout components
│   ├── modules/                  # Module-specific components
│   ├── notifications/            # Notification system
│   └── ui/                       # Base UI components
├── lib/                          # Utilities and configuration
│   ├── auth/                     # Authentication utilities
│   ├── config/                   # Configuration files
│   ├── hooks/                    # Custom React hooks
│   ├── inngest/                  # Background job functions
│   ├── novu/                     # Notification services
│   ├── resend/                   # Email services
│   ├── supabase/                 # Database client and utilities
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # General utilities
├── docs/                         # Documentation
│   ├── setup/                    # Setup and deployment guides
│   ├── development/              # Development documentation
│   └── progress/                 # Historical progress tracking
├── scripts/                      # Automation scripts
├── supabase/                     # Database schema and migrations
└── middleware.ts                 # Route protection middleware
```

## 🔐 Authentication & Authorization Architecture

### Role-Based Access Control (RBAC)
The system implements a comprehensive 5-role authentication system with fine-grained permissions:

#### User Roles
1. **MANAGEMENT** - Full access to all modules and system administration
2. **FINANCE_TEAM** - Full access to finance/accounting, read-only elsewhere
3. **PROCUREMENT_BD** - Full access to procurement/sales, limited finance access
4. **ADMIN_HR** - Full access to HR/admin functions, limited elsewhere
5. **IMS_QHSE** - Full access to QHSE/compliance, limited elsewhere

#### Access Control Implementation
- **Access Control Matrix**: Defined in `lib/types/auth.ts` with module-specific permissions
- **Route Protection**: 139 route mappings in `middleware.ts` with exact permission requirements
- **Database Security**: Row Level Security (RLS) policies on all 63 tables
- **Action-Level Control**: Create/Read/Update/Delete permissions per role per module

#### Key Security Files
- `middleware.ts` - Route protection with permission validation
- `lib/auth/` - Authentication utilities and session management
- `lib/types/auth.ts` - Role definitions and access control matrix
- Security headers configured in `next.config.ts` with CSP, HSTS, and XSS protection

## 📊 Business Modules (14 Core Modules)

### 1. Sales Management
- **Features**: Invoice creation, RFQ management, payment tracking
- **Status**: ✅ Complete with API integration
- **Access**: MANAGEMENT (FULL), PROCUREMENT_BD (FULL), others (READ)

### 2. Client Management
- **Features**: Contact management, client settings, relationship tracking
- **Status**: ✅ Complete with CRUD operations
- **Access**: MANAGEMENT (FULL), PROCUREMENT_BD (FULL), others (READ)

### 3. Inventory Management
- **Features**: Product catalog, stock tracking, warehouse management
- **Status**: ✅ Complete infrastructure
- **Access**: MANAGEMENT (FULL), PROCUREMENT_BD (FULL), others (READ)

### 4. Purchase Management
- **Features**: Purchase orders, supplier management, payment processing
- **Status**: ✅ Complete infrastructure
- **Access**: MANAGEMENT (FULL), PROCUREMENT_BD (FULL), FINANCE_TEAM (READ)

### 5. Finance Management
- **Features**: Expense tracking, income management, financial accounts
- **Status**: ✅ Complete infrastructure
- **Access**: MANAGEMENT (FULL), FINANCE_TEAM (FULL), others (READ)

### 6. Accounting System
- **Features**: Journal entries, chart of accounts, financial reporting
- **Status**: ✅ Complete infrastructure
- **Access**: MANAGEMENT (FULL), FINANCE_TEAM (FULL), others (NONE)

### 7. Employee Management
- **Features**: HR records, employee profiles, organizational structure
- **Status**: ✅ Complete infrastructure
- **Access**: MANAGEMENT (FULL), ADMIN_HR (FULL), others (READ)

### 8. Organizational Management
- **Features**: Company structure, departments, hierarchies
- **Status**: ✅ Complete infrastructure
- **Access**: MANAGEMENT (FULL), ADMIN_HR (FULL), others (READ)

### 9. Attendance System
- **Features**: Time tracking, shift management, leave requests
- **Status**: ✅ Complete infrastructure
- **Access**: MANAGEMENT (FULL), ADMIN_HR (FULL), others (READ)

### 10. Payroll System
- **Features**: Salary calculations, pay runs, contract management
- **Status**: ✅ Complete with full implementation
- **Access**: MANAGEMENT (FULL), ADMIN_HR (FULL), FINANCE_TEAM (READ)

### 11. Reports System
- **Features**: Cross-module reporting, analytics, data visualization
- **Status**: ✅ Complete with employee and finance reports
- **Access**: Role-based reporting permissions

### 12. Templates System
- **Features**: Printable documents, pre-filled forms
- **Status**: ✅ Complete infrastructure
- **Access**: All roles based on module permissions

### 13. QHSE Module
- **Features**: Quality management, health & safety, environmental compliance
- **Status**: ✅ Complete infrastructure
- **Access**: MANAGEMENT (FULL), IMS_QHSE (FULL), others (READ)

### 14. Settings Module
- **Features**: System configuration, user preferences, module settings
- **Status**: ✅ Complete infrastructure
- **Access**: MANAGEMENT (FULL), limited access for others

## 🗄️ Database Schema

### Database Overview
- **Total Tables**: 63 tables
- **Security**: Row Level Security (RLS) enabled on all tables
- **Relationships**: Comprehensive foreign key relationships
- **Performance**: Optimized indexes and queries

### Key Table Categories
1. **Authentication Tables**: User profiles, roles, sessions
2. **Client Management**: Clients, contacts, settings
3. **Sales Tables**: Invoices, invoice_line_items, payments
4. **Inventory Tables**: Products, stock, warehouses
5. **Purchase Tables**: Purchase orders, suppliers
6. **Finance Tables**: Accounts, transactions, expenses
7. **HR Tables**: Employees, contracts, attendance
8. **Payroll Tables**: Pay runs, salary calculations
9. **System Tables**: Settings, templates, notifications

### Database Files
- `supabase/schema.sql` - Complete database schema
- `supabase/complete_schema_update.sql` - Latest schema updates

## 🔧 Production Services Integration

### Sentry Error Monitoring
- **Purpose**: Error tracking and performance monitoring
- **Config**: `sentry.client.config.ts`, `sentry.server.config.ts`
- **Features**: Custom error filtering, performance tracking, release tracking
- **Environment**: Production-optimized sampling rates

### Resend Email Service
- **Purpose**: Professional transactional emails
- **Config**: `lib/resend/email-service.ts`
- **Email**: All emails from info@blackgoldunited.com
- **Features**: Welcome emails, invoices, system notifications

### Novu Notification System
- **Purpose**: Real-time in-app and email notifications
- **Config**: `lib/novu/server.ts`, `components/notifications/novu-provider.tsx`
- **Features**: ERP workflow notifications, user alerts

### Inngest Background Jobs
- **Purpose**: Automated workflows and scheduled tasks
- **Config**: `lib/inngest/client.ts`, `app/api/inngest/route.ts`
- **Functions**: Client management, system maintenance, scheduled tasks

### Manual API Monitoring
- **Purpose**: Health checks via `/api/health` endpoint
- **Features**: Application status monitoring, deployment verification

## 🌍 Environment Configuration

### Required Environment Variables
```bash
# Core Application
NODE_ENV=production
NEXT_PUBLIC_APP_NAME="BlackGoldUnited ERP"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration
FROM_EMAIL=info@blackgoldunited.com
RESEND_API_KEY=your_resend_api_key

# Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NOVU_API_KEY=your_novu_api_key
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Feature Flags
FEATURE_INVENTORY_MODULE=true
FEATURE_ACCOUNTING_MODULE=true
FEATURE_CRM_MODULE=true
FEATURE_SIGNUP_ENABLED=false

# Security Settings
SESSION_TIMEOUT=86400
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=900
```

### Environment Setup Scripts
- `scripts/vercel-env-setup.sh` - Interactive environment setup
- `scripts/vercel-env-batch.sh` - Batch environment setup
- `scripts/validate-env.js` - Environment validation

## 📈 Development Journey & Milestones

### Phase 1: Foundation (Weeks 1-3)
- ✅ Next.js 15 + TypeScript setup
- ✅ Supabase integration and database design
- ✅ Authentication system with 5 roles
- ✅ UI component system with Radix UI + Tailwind
- ✅ Route protection middleware

### Phase 2: Core Modules (Weeks 4-8)
- ✅ Client management with full CRUD
- ✅ Sales module with invoice system
- ✅ Dashboard with real-time analytics
- ✅ Employee and payroll systems
- ✅ Reports and template systems
- ✅ All 14 business modules infrastructure

### Phase 3: Production Deployment (Current)
- ✅ Vercel Marketplace integrations
- ✅ Error monitoring with Sentry
- ✅ Email services with Resend
- ✅ Notification system with Novu
- ✅ Background jobs with Inngest
- ✅ API monitoring with Checkly
- ✅ Production deployment and CI/CD

### Recent Major Changes
1. **Production Integrations** (September 28, 2025)
   - Implemented comprehensive Vercel Marketplace integrations
   - All services with conditional initialization for build compatibility
   - Updated email addresses to info@blackgoldunited.com

2. **Security Hardening** (September 27, 2025)
   - Row Level Security on all 63 database tables
   - Enhanced authentication with profile auto-creation
   - Security audit and compliance improvements

3. **System Fixes** (September 27, 2025)
   - Fixed user profile creation errors
   - Resolved missing API routes
   - GitHub Actions CI/CD pipeline optimization

## 🔍 Health Monitoring

### Health Check Endpoint
**URL**: `/api/health`
**Response**:
```json
{
  "status": "ok",
  "message": "All systems operational",
  "timestamp": "2025-09-28T20:30:51.921Z",
  "checks": {
    "database": "ok",
    "api": "ok"
  },
  "version": "1.0.0",
  "environment": "production"
}
```

### Monitoring Commands
```bash
# Check deployment health
npm run health:check

# Validate environment
npm run env:validate

# List deployments
vercel ls

# View logs
vercel logs
```

## 🚧 Known Issues & Limitations

### Current Limitations
1. **Testing**: No automated test suite implemented yet
2. **Email Templates**: Basic templates, could be enhanced
3. **Mobile Optimization**: Responsive but could be improved
4. **Documentation**: Some API endpoints need more detailed docs

### Planned Improvements
1. Comprehensive test suite (Jest + Playwright)
2. Enhanced mobile responsiveness
3. Advanced reporting features
4. API documentation completion
5. Performance optimizations

## 🎯 Future Roadmap

### Immediate Next Steps (Weeks 9-10)
- [ ] Implement comprehensive testing suite
- [ ] Mobile responsiveness improvements
- [ ] Advanced reporting features
- [ ] Performance optimization

### Medium Term (Weeks 11-12)
- [ ] Advanced analytics and insights
- [ ] Document workflow automation
- [ ] Enhanced notification system
- [ ] API rate limiting and caching

### Long Term (Weeks 13-14)
- [ ] Multi-tenant architecture preparation
- [ ] Advanced security features
- [ ] Integration marketplace
- [ ] Mobile app foundation

## 📚 Documentation Structure

The project documentation is organized in the `docs/` directory:

- **docs/setup/** - Environment and deployment guides
- **docs/development/** - Development guides and API documentation
- **docs/progress/** - Historical progress tracking

### Key Documentation Files
- `docs/setup/DEPLOYMENT.md` - Complete deployment guide
- `docs/setup/QUICK-DEPLOY.md` - Quick deployment reference
- `docs/development/API_DOCUMENTATION.md` - API endpoint documentation
- `docs/development/DEVELOPMENT_PLAN.md` - Complete development timeline

## 🔧 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Check build locally
npm run build

# Check TypeScript
npm run type-check

# Fix linting issues
npm run lint:fix
```

#### Environment Issues
```bash
# Validate environment
npm run env:validate

# Setup environment interactively
npm run env:setup
```

#### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check Supabase project is not paused
- Verify RLS policies allow access

### Getting Help
1. Check application logs: `vercel logs`
2. Review build logs in Vercel dashboard
3. Check database logs in Supabase dashboard
4. Monitor errors in Sentry dashboard

## ⚠️ Development Guidelines for Claude Code

### Code Architecture Patterns
1. **Authentication Flow**: All protected routes use `middleware.ts` → role validation → page components
2. **Data Access**: Supabase client (`lib/supabase/`) → RLS policies → role-based filtering
3. **Component Structure**: Page components in `app/` → shared components in `components/` → base UI in `components/ui/`
4. **API Routes**: Authentication check → role permission validation → business logic
5. **Form Handling**: React Hook Form + Zod validation + TypeScript types

### Mandatory Development Workflow
1. **Before Coding**: Check existing patterns in similar files
2. **During Development**: Use TypeScript strict mode, follow existing auth patterns
3. **After Changes**: Run `npm run type-check` and `npm run lint`
4. **Before Deployment**: Verify build with `npm run build`

### Critical Security Requirements
- **Route Protection**: New routes must be added to `middleware.ts` with proper role permissions
- **Database Access**: All queries must respect RLS policies and role-based filtering
- **API Authentication**: All API routes must validate user session and role permissions
- **Input Validation**: Use Zod schemas for all form inputs and API endpoints

### Integration Service Dependencies
- **Sentry**: Error monitoring (conditionally initialized for build compatibility)
- **Resend**: Email service for notifications and invoices
- **Novu**: In-app notifications and workflow automation
- **Inngest**: Background job processing and scheduled tasks
- **Health Monitoring**: Built-in `/api/health` endpoint for deployment verification

### Build Configuration Notes
- **ESLint**: Disabled during builds (`ignoreDuringBuilds: true`) to prevent deployment failures
- **Output**: Standalone mode for Vercel deployment optimization
- **Security Headers**: Comprehensive CSP, HSTS, and XSS protection configured
- **External Packages**: Supabase marked as server external package for proper SSR

This comprehensive guide should provide all necessary context for working with the BlackGoldUnited ERP system. The project is production-ready with full integrations and continues to evolve based on business requirements.

---

**Last Updated**: September 28, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅