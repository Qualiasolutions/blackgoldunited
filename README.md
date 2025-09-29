# BlackGoldUnited ERP System

A comprehensive Enterprise Resource Planning system built with Next.js 15, featuring 14 business modules, role-based access control, and full production integrations.

## 🚀 Production Status

**Live Application**: https://blackgoldunited-10cnui8d7-qualiasolutionscy.vercel.app
**Status**: ✅ Production Ready
**Last Updated**: September 28, 2025

## 🏃‍♂️ Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive project guide and technical documentation
- **[docs/](./docs/)** - Complete documentation library
  - `docs/setup/` - Deployment and environment setup
  - `docs/development/` - API docs and development guides
  - `docs/progress/` - Historical progress tracking

## ⚙️ Key Commands

```bash
# Development
npm run dev              # Start with Turbopack
npm run build           # Production build
npm run type-check      # TypeScript validation
npm run lint           # Code quality check

# Deployment
npm run deploy         # Deploy to production
npm run env:validate   # Check environment setup
npm run health:check   # Verify deployment health
```

## 🏗️ Architecture

- **Framework**: Next.js 15.5.3 + React 19 + TypeScript
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: 5-role RBAC system
- **UI**: Radix UI + Tailwind CSS
- **Deployment**: Vercel with CI/CD
- **Integrations**: Sentry, Resend, Novu, Inngest, Checkly

## 📊 Business Modules

14 core modules: Sales, Clients, Inventory, Purchase, Finance, Accounting, Employees, Organizational, Attendance, Payroll, Reports, Templates, QHSE, Settings

## 🔐 Security

- JWT-based authentication
- Role-based access control (5 roles)
- Row Level Security on all 63 database tables
- Production-grade security hardening

---

For detailed technical information, development guidelines, and complete project overview, see **[CLAUDE.md](./CLAUDE.md)**.
