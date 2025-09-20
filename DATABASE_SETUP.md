# BlackGoldUnited ERP - Database Setup Guide

## 🎯 Database Options

Your BlackGoldUnited ERP system supports two database configurations:

## Overview

The database schema supports a complete ERP system with 14 integrated modules, role-based access control, and comprehensive audit capabilities. The system is designed for PostgreSQL and uses Prisma as the ORM.

## Database Architecture

### Core Features

- **Role-Based Access Control (RBAC)**: 5 user roles with granular permissions
- **Audit Trail**: Complete tracking of changes to critical data
- **Data Retention**: Automated cleanup based on configurable retention policies
- **Multi-tenant Ready**: Foundation for future multi-company support
- **Performance Optimized**: Strategic indexes and query optimization

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

- PostgreSQL 14+ installed and running
- Node.js 18+ with npm
- Git for version control

### Initial Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd blackgoldunited
   npm install
   ```

2. **Database Configuration**
   ```bash
   # Copy environment variables
   cp .env.example .env

   # Edit .env file with your database credentials
   DATABASE_URL="postgresql://username:password@localhost:5432/blackgoldunited_db?schema=public"
   ```

3. **Initialize Database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Create and run initial migration
   npm run db:migrate

   # Apply custom SQL functions and triggers
   psql $DATABASE_URL -f prisma/migration.sql

   # Seed initial data
   npm run db:seed
   ```

4. **Verify Setup**
   ```bash
   # Open Prisma Studio to explore data
   npm run db:studio

   # Validate schema
   npm run db:validate
   ```

### Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Create and apply new migration
- `npm run db:push` - Push schema changes without migration
- `npm run db:reset` - Reset database and re-run migrations
- `npm run db:seed` - Populate database with initial data
- `npm run db:studio` - Open Prisma Studio
- `npm run db:backup` - Create database backup
- `npm run db:format` - Format Prisma schema
- `npm run db:validate` - Validate schema

## Key Design Decisions

### 1. Audit Trail Implementation

**Decision**: Comprehensive audit logging using PostgreSQL triggers
**Rationale**:
- Automatic tracking without application-level overhead
- Immutable audit records
- Performance optimization through dedicated audit table
- Compliance with financial record-keeping requirements

### 2. Role-Based Access Control

**Decision**: Database-level permissions with application enforcement
**Rationale**:
- Security at multiple layers
- Granular control per module and action
- Future scalability for additional roles
- Compliance with access control matrix requirements

### 3. Data Retention Policies

**Decision**: Configurable retention with automated cleanup
**Rationale**:
- Legal compliance (invoices 10 years, HR records 5 years)
- Performance optimization
- Storage cost management
- Data privacy compliance

### 4. Soft Deletes for Critical Data

**Decision**: Use `deletedAt` timestamp for important records
**Rationale**:
- Data recovery capabilities
- Audit trail preservation
- Regulatory compliance
- Business continuity

### 5. UUID Primary Keys

**Decision**: Use CUID for all primary keys
**Rationale**:
- URL-safe identifiers
- No sequential enumeration attacks
- Distributed system ready
- Collision-resistant

## Database Schema Summary

### Core Tables (50+ tables)

**User Management**
- `users` - System users with role assignments
- `permissions` - Role-based access control matrix
- `audit_logs` - Complete change tracking

**Sales & CRM**
- `clients` - Customer information
- `contacts` - Client contact persons
- `invoices` - Sales invoices with items
- `rfqs` - Request for quotations
- `payments` - Customer payments
- `credit_notes` - Credit note management

**Inventory & Procurement**
- `products` - Product/service catalog
- `categories` - Product categorization
- `warehouses` - Storage locations
- `stocks` - Current inventory levels
- `stock_movements` - Inventory transactions
- `suppliers` - Vendor management
- `purchase_orders` - Purchase order processing

**Finance & Accounting**
- `chart_of_accounts` - Chart of accounts
- `journal_entries` - Double-entry bookkeeping
- `expenses` - Expense tracking
- `incomes` - Revenue tracking
- `bank_accounts` - Bank account management
- `assets` - Fixed asset register

**Human Resources**
- `employees` - Employee master data
- `departments` - Organizational structure
- `designations` - Job positions
- `attendance_logs` - Time tracking
- `leave_applications` - Leave management
- `contracts` - Employment contracts
- `payroll` - Salary processing

### Key Relationships

1. **Hierarchical Structures**
   - Department → Employee management
   - Category → Product organization
   - Chart of Accounts → Financial reporting

2. **Transaction Flows**
   - Client → Invoice → Payment
   - Supplier → Purchase Order → Purchase Invoice
   - Employee → Attendance → Payroll

3. **Audit Connections**
   - All critical tables → Audit logs
   - User actions → Change tracking

## Performance Considerations

### Indexing Strategy

1. **Primary Access Patterns**
   - Client/Supplier lookups by code
   - Invoice searches by number and date
   - Employee queries by number and department
   - Product searches by code and category

2. **Composite Indexes**
   - Invoice status and due dates
   - Employee department and active status
   - Stock levels by product and warehouse

3. **Partial Indexes**
   - Active records only for frequently queried tables
   - Overdue invoices for collection processes

### Query Optimization

1. **Views for Common Queries**
   - `v_invoice_summary` - Invoice overview with client info
   - `v_employee_summary` - Employee details with org structure
   - `v_stock_summary` - Inventory levels with status

2. **Materialized Views** (for future implementation)
   - Monthly financial summaries
   - Employee performance metrics
   - Inventory turnover analysis

## Security Features

### Access Control

1. **Row-Level Security (RLS)**
   - Foundation implemented for sensitive tables
   - Ready for multi-tenant deployment
   - User-based data isolation

2. **Data Encryption**
   - Password hashing with bcrypt
   - Sensitive fields marked for encryption
   - Environment variable protection

### Audit Compliance

1. **Change Tracking**
   - Who, what, when, where for all changes
   - Before/after data snapshots
   - IP address and user agent logging

2. **Data Retention**
   - Automated cleanup of old records
   - Configurable retention periods
   - Compliance with legal requirements

## Maintenance Tasks

### Daily Operations

```bash
# Check database health
npm run db:validate

# Monitor audit log size
psql $DATABASE_URL -c "SELECT COUNT(*) FROM audit_logs;"

# Check for overdue invoices
psql $DATABASE_URL -c "SELECT * FROM check_overdue_invoices();"
```

### Weekly Maintenance

```bash
# Create backup
npm run db:backup

# Update statistics
psql $DATABASE_URL -c "ANALYZE;"

# Check for data integrity issues
npm run db:validate
```

### Monthly Cleanup

```bash
# Run retention policy cleanup
psql $DATABASE_URL -c "SELECT cleanup_old_data();"

# Reindex for performance
psql $DATABASE_URL -c "REINDEX DATABASE blackgoldunited_db;"
```

## Migration Strategy

### Development Workflow

1. **Schema Changes**
   ```bash
   # Make changes to schema.prisma
   npm run db:migrate
   npm run db:generate
   ```

2. **Custom SQL Changes**
   ```bash
   # Add custom SQL to migration.sql
   psql $DATABASE_URL -f prisma/migration.sql
   ```

3. **Data Seeding**
   ```bash
   # Update seed.ts for new default data
   npm run db:seed
   ```

### Production Deployment

1. **Pre-deployment**
   ```bash
   # Backup production database
   pg_dump $PROD_DATABASE_URL > backup_before_migration.sql

   # Test migration on staging
   npm run db:migrate:deploy
   ```

2. **Deployment**
   ```bash
   # Deploy migrations
   npm run db:migrate:deploy

   # Verify deployment
   npm run db:validate
   ```

3. **Post-deployment**
   ```bash
   # Monitor performance
   # Check audit logs
   # Verify application functionality
   ```

## Troubleshooting

### Common Issues

1. **Migration Failures**
   ```bash
   # Reset to last working state
   npm run db:reset

   # Re-run from clean state
   npm run db:migrate
   npm run db:seed
   ```

2. **Performance Issues**
   ```bash
   # Check slow queries
   # Update table statistics
   # Review index usage
   ```

3. **Data Integrity Issues**
   ```bash
   # Validate constraints
   # Check foreign key relationships
   # Review audit logs for corruption
   ```

## Future Enhancements

### Planned Features

1. **Multi-company Support**
   - Company-based data isolation
   - Cross-company reporting
   - Consolidated financials

2. **Advanced Analytics**
   - Business intelligence views
   - Predictive analytics tables
   - Performance dashboards

3. **Integration Capabilities**
   - API audit logging
   - External system connectors
   - Real-time synchronization

4. **Enhanced Security**
   - Field-level encryption
   - Advanced RLS policies
   - Compliance reporting

## Support and Documentation

- **Schema Documentation**: Auto-generated from Prisma schema
- **API Documentation**: Generated from application routes
- **User Manual**: Available in `/docs` directory
- **Video Tutorials**: Available on company intranet

For technical support, contact the development team or refer to the project wiki.