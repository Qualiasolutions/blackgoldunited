# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
BlackGoldUnited is a comprehensive ERP system built for business management with 14 interconnected modules. The system handles sales, clients, inventory, purchases, finance, accounting, HR, payroll, attendance, QHSE, templates, reports, and organizational structure with strict role-based access control.

## Core Architecture
- **Frontend**: Next.js 15.5.3 with TypeScript and React 19
- **Styling**: Tailwind CSS v3.4.14 with shadcn/ui component system
- **Database**: PostgreSQL deployed on Supabase with direct SQL queries
- **Authentication**: Supabase Auth with SSR support (@supabase/ssr)
- **UI Components**: Radix UI primitives with custom styling
- **Form Handling**: React Hook Form v7.63.0 with Zod validation
- **Data Tables**: TanStack Table v8.21.3 for complex data grids
- **Deployment**: Vercel with automatic deployments

## Essential Development Commands

### Database Management
```bash
# Create database backup
npm run db:backup

# Supabase-specific database operations:
# - Schema changes: Use Supabase Dashboard SQL Editor or migration files
# - Direct queries: Use Supabase MCP tools or SQL Editor
# - Database admin: Access Supabase Dashboard at https://supabase.com/dashboard
# - Local development: Use createClient() from @/lib/supabase/client or server
```

### Authentication Management
```bash
# Test login credentials (production):
# Email: admin@blackgoldunited.com
# Password: admin123
# Role: MANAGEMENT (full access)

# Additional test users:
# finance@blackgoldunited.com / admin123 (FINANCE_TEAM)
# procurement@blackgoldunited.com / admin123 (PROCUREMENT_BD)

# Authentication is handled by Supabase Auth with:
# - Email/password authentication
# - Role-based access control via user metadata
# - Session management with SSR support
# - Automatic session refresh in middleware
```

### Development Workflow
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check
```

### Component Architecture
```bash
# Main layout system:
# - app/layout.tsx - Root layout with providers
# - components/layout/main-layout.tsx - Sidebar + header layout
# - components/layout/sidebar.tsx - 14-module navigation
# - components/layout/header.tsx - Top navigation with user menu

# Authentication components:
# - components/auth/protected-route.tsx - Route-level protection
# - components/auth/role-guard.tsx - Component-level role checks
# - components/providers/AuthProvider.tsx - Auth context provider

# Module-specific components:
# - components/modules/sales/ - Sales module components
# - components/modules/clients/ - Client management components
# - components/modules/inventory/ - Inventory components
# - components/modules/purchase/ - Purchase components

# shadcn/ui components:
# - components/ui/ - Reusable UI primitives (button, input, table, etc.)
# - components/data-table/ - Advanced data table with search/filtering
```

### Supabase Integration
```bash
# Client-side authentication (hooks):
# useAuth() - Custom hook for authentication state management
# - login(credentials) - Sign in with email/password
# - logout() - Sign out user
# - signup(data) - Create new user account
# - user - Current user session data with role and permissions

# Server-side authentication:
# import { createClient } from '@/lib/supabase/server'
# const supabase = await createClient()
# const { data: { user } } = await supabase.auth.getUser()

# Environment variables (already configured on Vercel):
# NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key
```

### Testing Setup
```bash
# Current testing status:
# - No tests configured yet (package.json shows placeholder scripts)
# - Test framework: Not yet implemented
# - Coverage: Not yet implemented

# To add testing:
# npm install --save-dev jest @testing-library/react @testing-library/jest-dom
# npm install --save-dev @types/jest jest-environment-jsdom
```

### Role-Based Access Control Matrix
The system implements strict access control based on 5 user roles:

| Module | MANAGEMENT | FINANCE_TEAM | PROCUREMENT_BD | ADMIN_HR | IMS_QHSE |
|--------|------------|--------------|----------------|----------|----------|
| Administration | Full (F) | Read (R) | None (N) | Full (F) | None (N) |
| Finance | Full (F) | Full (F) | Read (R) | None (N) | None (N) |
| Procurement | Full (F) | Read (R) | Full (F) | None (N) | None (N) |
| Projects & Operations | Full (F) | Read (R) | Full (F) | None (N) | Read (R) |
| IMS/Compliance | Full (F) | None (N) | None (N) | None (N) | Full (F) |
| Correspondence | Full (F) | None (N) | Read (R) | Read (R) | Read (R) |

## Current Implementation Status

### ✅ Completed Features
- **Core Architecture**: Next.js 15.5.3 + TypeScript + React 19 setup
- **Supabase Integration**: Authentication, database client, middleware
- **UI Foundation**: shadcn/ui components, Tailwind CSS styling
- **Layout System**: Main layout with sidebar and header navigation
- **Authentication**: useAuth hook, login/logout/signup functionality
- **Route Protection**: middleware.ts with role-based access control
- **Navigation**: 14-module navigation structure with role permissions
- **Component Library**: Base UI components and module-specific components
- **Type System**: Comprehensive TypeScript definitions

### 🚧 In Development
- **Database Schema**: Prisma schema defined but currently uses Supabase client
- **Module Components**: Sales, clients, inventory, purchase components built
- **Data Tables**: TanStack Table integration for complex data grids
- **Form Handling**: React Hook Form + Zod validation setup

### 📋 TODO Items
- **Testing Framework**: Jest + Testing Library setup needed
- **API Endpoints**: REST/GraphQL API implementation
- **Database Operations**: Full CRUD operations for all modules
- **Real-time Features**: Supabase realtime subscriptions
- **File Upload**: Document and image management
- **Email Integration**: Nodemailer setup for notifications
- **PDF Generation**: Invoice and report PDF export

## Key File Locations and Patterns

### Configuration Files
- **middleware.ts**: Route protection with Supabase Auth integration
- **app/layout.tsx**: Root layout with providers and global styles
- **lib/supabase/client.ts**: Browser Supabase client configuration
- **lib/supabase/server.ts**: Server-side Supabase client (SSR)
- **lib/hooks/useAuth.ts**: Authentication state management hook
- **lib/config/navigation.ts**: Navigation structure and role permissions
- **lib/types/**: TypeScript type definitions (auth.ts, bgu.ts)

### Important Conventions
- **Database**: Use Supabase client, NOT Prisma (schema exists but not actively used)
- **Authentication**: Always use useAuth() hook for client-side auth
- **Route Protection**: middleware.ts handles all route-level protection
- **Components**: Follow shadcn/ui patterns, use className with cn() utility
- **Styling**: Tailwind CSS with consistent design tokens
- **Navigation**: Role-based module access defined in lib/config/navigation.ts

### Module Structure Pattern
```
app/[module]/
├── page.tsx              # Main module page
├── [sub-module]/
│   ├── page.tsx         # Sub-module page
│   └── create/page.tsx  # Create form page

components/modules/[module]/
├── [module]-list.tsx    # List view component
├── [module]-form.tsx    # Create/edit form
└── [module]-card.tsx    # Card display component
```

## Command Templates from ~/Desktop/templates/claude-commands.md

### Quick Development Commands
```bash
# Analyze project structure
Please analyze this project structure and provide a brief overview of the architecture and technology stack.

# Code quality check
Please review the code quality across the project and suggest improvements.

# Add comprehensive error handling
Please add comprehensive error handling to: [PASTE CODE]

# Create tests
Please create unit tests for: [PASTE CODE]
```

### Feature Development Workflow
```bash
/plan

I need to implement [FEATURE_NAME] that will [FEATURE_DESCRIPTION].

Requirements:
- Role-based access control integration
- Responsive design for mobile/desktop
- Real-time updates where applicable
- Comprehensive error handling
- TypeScript type safety

Acceptance Criteria:
- All user roles can access appropriate features
- UI follows BGU design patterns
- Data validation on frontend and backend
- Tests coverage > 90%

Technical Considerations:
- Integration with Supabase authentication and row-level security
- Database schema design with Supabase PostgreSQL
- API endpoint security with Supabase Auth middleware
- Performance optimization with Supabase caching and indexes

Please analyze the current codebase and create a comprehensive implementation plan.
```

### BGU-Specific Commands

#### Sales Module Commands
```bash
# Invoice Management
/plan
Implement invoice management system with:
- Create/edit invoices with line items
- Invoice status tracking (draft, sent, paid, overdue)
- PDF generation and email sending
- Payment recording and reconciliation
- Search and filtering capabilities

# RFQ System
/plan
Create Request for Quotation system with:
- RFQ creation with multiple line items
- Supplier management integration
- Quote comparison functionality
- Approval workflow implementation
- Conversion to purchase orders
```

#### Access Control Commands
```bash
# Implement role-based access matrix
/plan
Implement the access control matrix from BGU Portal Layout.pdf:

Roles: Management, Finance Team, Procurement/BD Team, Admin/HR, IMS/QHSE Officer
Access Levels: Full Access (F), Read-only (R), No Access (N)

Categories:
- Administration: Management(F), Admin/HR(F), Others(N/R)
- Finance: Management(F), Finance(F), Procurement(R), Others(N)
- Procurement: Management(F), Procurement(F), Finance(R), Others(N/R)
- Projects & Operations: Management(F), Procurement(F), Others(R/N)
- IMS/Compliance: Management(F), IMS/QHSE(F), Others(R)
- Correspondence: Management(F), Admin/HR(R), Others(R)

Include Supabase Auth middleware for route protection and component-level permissions with user metadata roles.
```

### Module Implementation Templates

#### Financial Module
```bash
/plan
Implement Financial Management module including:
- Chart of accounts setup
- Journal entries with double-entry bookkeeping
- Financial reporting (P&L, Balance Sheet, Cash Flow)
- Integration with sales and purchase modules
- Multi-currency support preparation
- Audit trail for all financial transactions
```

#### Inventory Module
```bash
/plan
Create Inventory Management system with:
- Product and service catalog
- Stock level tracking with warehouses
- Purchase requisition workflow
- Price list management
- Stock movements and adjustments
- Low stock alerts and reorder points
```

#### Employee Module
```bash
/plan
Develop Employee Management system featuring:
- Employee profiles with role assignments
- Organizational structure management
- Attendance tracking and leave management
- Payroll integration preparation
- Document management for HR files
- Performance tracking framework
```

## Specialized Agent Configurations

### Setup Specialist
- Focus: Project initialization, dependency management, development environment
- Use for: New feature scaffolding, configuration updates, build optimizations

### Security Auditor
- Focus: Access control implementation, vulnerability assessment, compliance
- Use for: Role-based permissions, data security, audit trail implementation

### Frontend Specialist
- Focus: React components, responsive design, user experience
- Use for: UI/UX implementation, component library development, mobile optimization

### Backend Specialist
- Focus: API design, database schema, business logic
- Use for: Database models, API endpoints, integration services

### Testing Expert
- Focus: Test strategy, automation, quality assurance
- Use for: Unit tests, integration tests, E2E automation, test coverage

### Performance Optimizer
- Focus: Application performance, bundle optimization, database queries
- Use for: Performance bottlenecks, bundle analysis, query optimization

## Development Workflow

### 1. Feature Planning
```bash
/plan
[Use feature planning template above with specific BGU requirements]
```

### 2. Implementation Phase
- Use specialized agents for parallel development
- Apply role-based access patterns consistently
- Follow BGU design system and naming conventions
- Implement comprehensive error handling

### 3. Validation Phase
```bash
# Current validation commands available:
npm run lint           # ESLint code quality checks
npm run lint:fix       # Auto-fix linting issues
npm run type-check     # TypeScript type checking
npm run build          # Build validation

# Note: Advanced validation scripts not yet implemented
# TODO: Add testing framework and custom validation scripts
```

## BGU Business Rules

### Access Control Matrix Implementation
- Management: Full access to all modules
- Finance Team: Full finance access, read-only procurement/contracts
- Procurement/BD: Full procurement access, read-only finance (PO values)
- Admin/HR: Full HR access, limited read-only access to others
- IMS/QHSE: Full compliance access, limited operations access

### Document Management Requirements
- Version control for all documents
- Approval workflow (email-based or in-system)
- Retention policies (invoices: 10 years, HR: 5 years after leaving)
- Folder-based organization with access rights
- Remote accessibility requirement

### Data Security Requirements
- Regular backups with password protection
- Audit trails for all financial transactions
- Role-based data access enforcement
- Secure document storage and retrieval
- Compliance with financial regulations

## Development Best Practices

### Code Quality Standards
- **ESLint**: Follow established linting rules (npm run lint)
- **TypeScript**: Maintain strict type checking (npm run type-check)
- **Components**: Use shadcn/ui patterns and conventions
- **Styling**: Consistent Tailwind CSS usage with design tokens
- **Authentication**: Always validate user permissions before data access

### Security Guidelines
- **Route Protection**: All protected routes handled by middleware.ts
- **Authentication**: Use Supabase Auth for all authentication flows
- **Role Validation**: Check user roles before displaying sensitive UI elements
- **Input Validation**: Use Zod schemas for form and API validation
- **Environment Variables**: Keep secrets secure and properly configured

### Performance Considerations
- **Client Components**: Use 'use client' directive only when necessary
- **Image Optimization**: Use Next.js Image component for optimized loading
- **Database Queries**: Optimize Supabase queries with proper indexing
- **Bundle Size**: Monitor and optimize bundle size with Next.js analyzer

Remember to run `npm run lint` and `npm run type-check` before committing changes.

# 🎯 THE MASTER ROADMAP - BlackGoldUnited ERP System

## **The Main BIG BIG BIG Plan**
Create a **comprehensive, production-ready ERP system** for BlackGoldUnited that handles **14 interconnected business modules** with strict role-based access control, modern UI/UX, and enterprise-grade functionality.

## **The 14 Core Modules Vision**
1. **Sales Management** (invoices, RFQ, payments, credit notes)
2. **Client Management** (customer relationships, contracts)
3. **Inventory Management** (stock, warehouses, movements)
4. **Purchase Management** (procurement, suppliers, POs)
5. **Finance Management** (budgets, cash flow, reporting)
6. **Accounting** (chart of accounts, journal entries, P&L)
7. **HR Management** (employee profiles, organizational structure)
8. **Payroll** (salary processing, benefits, deductions)
9. **Attendance** (time tracking, leave management)
10. **QHSE** (quality, health, safety, environment compliance)
11. **Document Management** (file storage, version control, workflows)
12. **Templates** (standardized forms and documents)
13. **Reports** (business intelligence, dashboards, analytics)
14. **Settings** (system configuration, user management)

---

## **🚀 CURRENT STATUS - WHERE WE ARE NOW**

### ✅ **PHASE 1 COMPLETED: Foundation & Core Infrastructure**
- **Architecture**: Next.js 15.5.3 + TypeScript + React 19 ✅
- **Database**: Supabase PostgreSQL with 63 tables ✅
- **Authentication**: Role-based access control with 5 user roles ✅
- **UI Framework**: shadcn/ui + Tailwind CSS + Lucide React icons ✅
- **Layout System**: Professional sidebar navigation + responsive design ✅
- **Development Environment**: Production-ready build pipeline ✅

### ✅ **PHASE 2 COMPLETED: Module Framework**
- **All 14 main module pages** created and functional ✅
- **Sales module fully implemented** with 5 sub-modules:
  - Invoices management ✅
  - RFQ (Request for Quotation) system ✅
  - Payments tracking ✅
  - Credit notes management ✅
  - Sales settings ✅
- **Real Supabase data integration** across all components ✅
- **Mobile-responsive design** with modern BGU branding ✅
- **Production deployment ready** with zero TypeScript errors ✅

**Progress: ~25-30% of total vision completed with rock-solid foundation**

---

## **🎯 DEVELOPMENT ROADMAP - NEXT PHASES**

### **PHASE 3: Deep Module Implementation (CURRENT PRIORITY)**
**Priority Order Based on Business Impact:**

#### **🥇 Client Management Module** (Foundation for all sales)
**Status: NEXT TO IMPLEMENT**
- Complete client CRUD operations with advanced search/filtering
- Client categorization and segmentation system
- Contact person management (multiple contacts per client)
- Client status tracking (active, inactive, suspended)
- Contract management system with lifecycle tracking
- Client communication hub with history tracking
- Email integration and templates
- Meeting and call logging with follow-up reminders
- Deep integration with Sales module
- Connection to Document Management and Templates

#### **🥈 Inventory Management** (Critical for operations)
**Status: PLANNED**
- Product/service catalog with categories
- Stock tracking with multiple warehouses
- Purchase requisitions workflow with approvals
- Price list management with customer-specific pricing
- Stock movements and adjustments tracking
- Low stock alerts and automatic reorder points
- Barcode scanning and inventory audits
- Integration with Purchase and Sales modules

#### **🥉 Purchase Management** (Complete the supply chain)
**Status: PLANNED**
- Comprehensive supplier management system
- Purchase order workflow with multi-level approvals
- Supplier performance tracking and evaluation
- RFQ to suppliers with quote comparison
- Purchase requisition to PO conversion
- Goods receipt and quality inspection
- Three-way matching (PO, GRN, Invoice)
- Integration with Inventory and Accounting

### **PHASE 4: Financial Core (Business Critical)**

#### **Finance Management**
**Status: PLANNED**
- Chart of accounts setup and management
- Budget planning and tracking with variance analysis
- Cash flow management and forecasting
- Financial reporting dashboard with KPIs
- Multi-currency support with exchange rates
- Cost center and project accounting
- Financial audit trail and compliance
- Integration with Accounting and Sales

#### **Accounting Module**
**Status: PLANNED**
- Double-entry bookkeeping system
- Automated journal entries from transactions
- General ledger with trial balance
- P&L and Balance Sheet auto-generation
- Tax calculation and reporting (VAT, Income Tax)
- Period-end closing procedures
- Financial statement preparation
- Audit trail for all transactions

### **PHASE 5: Human Resources (Operational Excellence)**

#### **Employee Management**
**Status: BASIC FRAMEWORK EXISTS**
- Complete employee profiles with photos
- Organizational chart with hierarchy
- Role and permission management integration
- Employee document management
- Performance tracking and reviews
- Training and certification tracking
- Employee self-service portal
- Integration with Payroll and Attendance

#### **Payroll System**
**Status: PLANNED**
- Salary calculations with complex rules
- Benefits management (health, pension, etc.)
- Tax deductions and compliance
- Overtime and bonus calculations
- Payslip generation and distribution
- Payroll reporting and analytics
- Bank file generation for payments
- Integration with Accounting and HR

#### **Attendance Tracking**
**Status: PLANNED**
- Time clock system with biometric support
- Leave management with approval workflow
- Overtime calculations and approvals
- Attendance reports and analytics
- Mobile check-in/check-out capabilities
- Shift scheduling and planning
- Integration with Payroll calculations
- Real-time attendance monitoring

### **PHASE 6: Compliance & Documentation**

#### **QHSE Module**
**Status: PLANNED**
- Safety protocols and procedures
- Environmental compliance tracking
- Quality management system (ISO integration)
- Incident reporting and investigation
- Risk assessment and mitigation
- Audit management and scheduling
- Training compliance tracking
- Regulatory reporting automation

#### **Document Management**
**Status: BASIC FRAMEWORK EXISTS**
- File upload/storage system with versioning
- Document approval workflows
- Document retention policies automation
- Access control per document/folder
- Document search and indexing
- Digital signatures and approvals
- Integration with all modules
- Backup and disaster recovery

### **PHASE 7: Intelligence & Automation**

#### **Templates System**
**Status: PLANNED**
- Dynamic form generation engine
- Template library with categories
- Custom template creation tools
- Template versioning and approval
- Merge fields and conditional logic
- PDF/Word template generation
- Email template management
- Integration with all modules

#### **Reports & Analytics**
**Status: PLANNED**
- Business intelligence dashboard
- Custom report builder with drag-drop
- Data visualization with charts/graphs
- Scheduled report generation
- Export capabilities (PDF, Excel, CSV)
- Real-time analytics and KPIs
- Mobile-friendly report viewing
- Role-based report access

#### **Advanced Settings**
**Status: BASIC FRAMEWORK EXISTS**
- System configuration management
- Integration settings and API management
- Automated backup scheduling
- Audit logs and security monitoring
- User management and permissions
- System performance monitoring
- Update management and deployment
- Multi-tenant architecture preparation

---

## **🔥 IMMEDIATE NEXT STEPS - DEVELOPMENT FOCUS**

### **CURRENT RECOMMENDATION: Start Phase 3 - Client Management**

**Why Client Management is the logical next step:**
1. **Foundation Dependency**: Sales, invoices, and RFQ all depend on robust client data
2. **Business Impact**: Client management affects every other module's effectiveness
3. **Data Integrity**: Establishes the core business relationship model
4. **User Experience**: Sales team needs complete client functionality to be productive
5. **Revenue Impact**: Better client management directly increases sales efficiency

### **Client Management Implementation Priorities:**
1. **Week 1-2**: Enhanced Client CRUD Operations
2. **Week 3-4**: Contract Management System
3. **Week 5-6**: Client Communication Hub
4. **Week 7-8**: Integration with existing Sales module
5. **Week 9-10**: Testing, refinement, and documentation

---

## **🏆 SUCCESS METRICS - THE BIG PICTURE**

### **Technical Excellence Goals**
- **100% TypeScript coverage** with strict mode compliance
- **90%+ test coverage** across all modules
- **Performance**: Sub-3s page loads on all devices
- **Mobile-first responsive design** for all components
- **Production-grade security** with comprehensive audit trails
- **99.9% uptime** with proper monitoring and alerts

### **Business Functionality Goals**
- **Complete ERP workflow** from lead to cash to compliance
- **Role-based access control** perfectly implemented for 5 user types
- **Real-time data synchronization** across all 14 modules
- **Automated workflows** reducing manual processes by 80%
- **Comprehensive reporting** enabling data-driven decisions
- **Integration readiness** for third-party systems

### **User Experience Goals**
- **Intuitive navigation** allowing users to find any function within 3 clicks
- **Consistent BGU branding** creating professional brand experience
- **Offline capabilities** for critical functions
- **Mobile app readiness** for field operations
- **Multi-language support** preparation for international expansion
- **User satisfaction** score of 8.5+ out of 10

### **Business Impact Goals**
- **50% reduction** in administrative processing time
- **30% improvement** in data accuracy and consistency
- **25% increase** in operational efficiency
- **Real-time visibility** into all business operations
- **Compliance automation** reducing audit preparation time by 70%
- **Scalability** to support 5x business growth without system changes

---

## **🎯 DEVELOPMENT PHILOSOPHY**

### **Quality First Approach**
- Build each module to production standards before moving to next
- Comprehensive testing at every level (unit, integration, E2E)
- Security-first mindset with proper authentication and authorization
- Performance optimization as core requirement, not afterthought
- User experience validation with actual business users

### **Incremental Value Delivery**
- Each phase delivers immediate business value
- Modules integrate seamlessly with existing functionality
- Backward compatibility maintained throughout development
- User training and documentation delivered with each module
- Feedback loops built into every development cycle

### **Scalability and Future-Proofing**
- Architecture designed for 10x scale from day one
- API-first approach enabling future integrations
- Microservices-ready architecture with proper separation
- Cloud-native design for global deployment
- AI/ML readiness for future intelligent features

---

**REMEMBER: We've built an incredibly solid foundation (25-30% complete). The next logical step is Client Management implementation to unlock the full potential of our Sales module and establish the data foundation that will power all subsequent modules. Every decision should align with this 14-module vision while delivering immediate business value.**