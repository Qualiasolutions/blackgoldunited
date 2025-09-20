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
# Run validation suite
./scripts/claude-validation-suite.sh

# Check security compliance
./scripts/security-audit-gate.sh

# Monitor health
./scripts/mcp-health-monitor.sh
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

## Automation Integration

### Validation Scripts
- `claude-project-analyzer.sh`: Project structure analysis
- `claude-validation-suite.sh`: Comprehensive validation
- `security-audit-gate.sh`: Security compliance checking
- `mcp-health-monitor.sh`: System health monitoring

### CI/CD Pipeline
- Automated testing on all commits
- Security scanning with CodeQL
- Performance monitoring
- Deployment automation with rollback capability

## Success Metrics
- Development velocity: 60% improvement through parallel agents
- Code quality: 95%+ test coverage maintenance
- Security: Zero critical vulnerabilities
- Performance: <2s page loads, <100ms API responses
- User satisfaction: Role-appropriate access and functionality

Remember to run validation scripts after major changes and use specialized agents for domain-specific implementations.