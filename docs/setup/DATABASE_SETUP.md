# BlackGoldUnited ERP - Database Setup Guide

## 🎯 Supabase Database Setup

Your BlackGoldUnited ERP system uses **Supabase** as the database platform with PostgreSQL as the underlying database.

## Overview

The database schema supports a complete ERP system with 14 integrated modules, role-based access control, and comprehensive audit capabilities. The system uses Supabase's PostgreSQL database with direct SQL queries.

## Database Architecture

### Core Features

- **Role-Based Access Control (RBAC)**: 5 user roles with granular permissions
- **Audit Trail**: Complete tracking of changes to critical data
- **Data Retention**: Automated cleanup based on configurable retention policies
- **Multi-tenant Ready**: Foundation for future multi-company support
- **Performance Optimized**: Strategic indexes and query optimization
- **Real-time Capabilities**: Supabase real-time subscriptions for live updates

### 14 Integrated Modules

1. **Sales Module**: Invoices, RFQs, payments, credit notes, recurring invoices
2. **Clients Module**: Customer management, contacts, client settings
3. **Inventory Module**: Products, services, warehouses, stock management, requisitions
4. **Purchase Module**: Suppliers, purchase orders, invoices, payments
5. **Finance Module**: Expenses, income, treasuries, bank accounts
6. **Accounting Module**: Journal entries, chart of accounts, cost centers, assets
7. **Employees Module**: Staff management, roles, organizational structure
8. **Attendance Module**: Logs, permissions, shifts, leave management
9. **Payroll Module**: Contracts, pay runs, salary structures, loans
10. **Reports Module**: Comprehensive reporting across all modules
11. **Templates Module**: Printable templates, terms & conditions, documents
12. **QHSE Module**: Policies, procedures, forms, compliance reports
13. **Settings Module**: Account information, system configurations
14. **Organizational Structure**: Departments, designations, employee levels

## Role-Based Access Control Matrix

Based on the BGU Portal Layout requirements:

| Role | Administration | Finance | Procurement | Projects & Operations | IMS/Compliance | Correspondence |
|------|---------------|---------|-------------|----------------------|----------------|----------------|
| **Management** | Full (F) | Full (F) | Full (F) | Full (F) | Full (F) | Full (F) |
| **Finance Team** | Read (R) | Full (F) | Read (R) | Read (R) | None (N) | None (N) |
| **Procurement/BD** | None (N) | Read (R) | Full (F) | Full (F) | None (N) | Read (R) |
| **Admin/HR** | Full (F) | None (N) | None (N) | None (N) | None (N) | Read (R) |
| **IMS/QHSE** | None (N) | None (N) | None (N) | Read (R) | Full (F) | Read (R) |

## Setup Instructions

### Prerequisites

- Supabase account and project
- Node.js 18+ with npm
- Git for version control

### Initial Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd blackgoldunited
   npm install
   ```

2. **Supabase Configuration**
   ```bash
   # Copy environment variables
   cp .env.example .env.local

   # Edit .env.local file with your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Schema Setup**
   - Log into your Supabase Dashboard
   - Navigate to SQL Editor
   - Execute your database schema SQL scripts
   - Set up Row Level Security (RLS) policies
   - Create necessary database functions and triggers

4. **Authentication Setup**
   - Configure Supabase Auth settings in dashboard
   - Set up email templates (optional)
   - Configure auth providers if needed
   - Set up user roles and permissions

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:backup` - Create database backup using pg_dump

## Key Design Decisions

### 1. Supabase as Database Platform

**Decision**: Use Supabase instead of self-managed PostgreSQL
**Rationale**:
- Built-in authentication and authorization
- Real-time subscriptions out of the box
- Automatic API generation
- Managed database with backups
- Scalable infrastructure
- Row Level Security (RLS) support

### 2. Direct SQL Queries over ORM

**Decision**: Use Supabase client with direct SQL queries
**Rationale**:
- Better performance for complex queries
- Full PostgreSQL feature access
- Easier integration with Supabase features
- More control over query optimization
- Real-time subscription capabilities

### 3. Role-Based Access Control

**Decision**: Database-level permissions with Supabase Auth integration
**Rationale**:
- Security at multiple layers
- Granular control per module and action
- Integration with Supabase Auth system
- Future scalability for additional roles
- Compliance with access control matrix requirements

### 4. Audit Trail Implementation

**Decision**: Comprehensive audit logging using PostgreSQL triggers
**Rationale**:
- Automatic tracking without application-level overhead
- Immutable audit records
- Performance optimization through dedicated audit table
- Compliance with financial record-keeping requirements

## Database Schema Architecture

### Authentication & Users
- Managed by Supabase Auth
- Custom user metadata for role assignments
- Integration with application permissions

### Core Business Tables

**Sales & CRM**
- `clients` - Customer information
- `contacts` - Client contact persons
- `invoices` - Sales invoices with items
- `rfqs` - Request for quotations
- `payments` - Customer payments

**Inventory & Procurement**
- `products` - Product/service catalog
- `categories` - Product categorization
- `warehouses` - Storage locations
- `suppliers` - Vendor management
- `purchase_orders` - Purchase order processing

**Finance & Accounting**
- `chart_of_accounts` - Chart of accounts
- `journal_entries` - Double-entry bookkeeping
- `expenses` - Expense tracking
- `bank_accounts` - Bank account management

**Human Resources**
- `employees` - Employee master data
- `departments` - Organizational structure
- `attendance_logs` - Time tracking
- `contracts` - Employment contracts

## Security Features

### Supabase Authentication
- Email/password authentication
- Row Level Security (RLS) policies
- User session management
- Role-based access control

### Data Protection
- Encrypted connections (SSL/TLS)
- Row-level security for sensitive data
- Audit logging for compliance
- Backup and recovery capabilities

## Performance Considerations

### Indexing Strategy
1. **Primary Access Patterns**
   - Client/Supplier lookups by code
   - Invoice searches by number and date
   - Employee queries by department
   - Product searches by category

2. **Composite Indexes**
   - Status and date combinations
   - User and timestamp queries
   - Complex search patterns

### Real-time Features
- Use Supabase real-time subscriptions for live updates
- Optimize for specific tables that need real-time sync
- Configure real-time policies for security

## Maintenance and Monitoring

### Regular Tasks
```bash
# Create backups
npm run db:backup

# Monitor database performance via Supabase Dashboard
# Review query performance and slow queries
# Check storage usage and optimize
```

### Supabase Dashboard Monitoring
- Database performance metrics
- Query execution statistics
- User authentication logs
- Real-time connection monitoring

## Deployment Strategy

### Development Environment
- Use Supabase development/staging project
- Test all database changes before production
- Validate RLS policies and permissions

### Production Deployment
- Use separate Supabase production project
- Implement proper backup strategies
- Monitor performance and optimize queries
- Set up alerts for critical metrics

## Integration with Application

### Supabase Client Usage
```typescript
// Client-side
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Server-side (SSR)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

### Authentication Integration
```typescript
// Use the custom useAuth hook
import { useAuth } from '@/lib/hooks/useAuth'
const { user, role, loading } = useAuth()
```

## Future Enhancements

### Planned Features
1. **Advanced Real-time Features**
   - Live document collaboration
   - Real-time notifications
   - Live dashboard updates

2. **Enhanced Analytics**
   - Custom analytics views
   - Performance dashboards
   - Business intelligence integration

3. **Multi-company Support**
   - Company-based data isolation using RLS
   - Cross-company reporting
   - Consolidated views

## Support and Documentation

- **Supabase Documentation**: https://supabase.com/docs
- **Application Documentation**: Available in `/docs` directory
- **Schema Documentation**: Maintained in Supabase Dashboard

For technical support, contact the development team or refer to the Supabase Dashboard for database-specific issues.