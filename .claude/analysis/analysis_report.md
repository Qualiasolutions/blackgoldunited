# Project Analysis Report: blackgoldunited

**Generated:** Sat Sep 20 10:23:15 PM EEST 2025
**Analysis ID:** 20250920_222312

## Project Overview

### Detected Stack
- **Languages:** JavaScript/TypeScript,
- **Frameworks:** React,Next.js,
- **Tools:** GitHub Actions,ESLint,

### Code Metrics
- **Total Lines of Code:** 220139
- **JavaScript/TypeScript Files:** 24964
- **Python Files:** 2
- **Test Files:** 637

### Technical Debt
```
./node_modules/@eslint-community/eslint-utils/index.js:                        // TODO(mysticatea): don't support destructuring here.
./node_modules/@humanwhocodes/config-array/api.js:	// TODO: Throw more verbose error
./node_modules/@humanwhocodes/config-array/api.js:		// TODO: Maybe move elsewhere? Maybe combine with getConfig() logic?
./node_modules/@humanwhocodes/config-array/api.js:		// TODO: Maybe move elsewhere?
./node_modules/@next/eslint-plugin-next/dist/utils/url.js:        // TODO: this should account for all page extensions
./node_modules/@next/eslint-plugin-next/dist/utils/url.js:        // TODO: this should account for all page extensions
./node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch/dist/commonjs/ast.js:    // TODO: instead of injecting the start/end at this point, just return
./node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch/dist/commonjs/ast.js:        // XXX abstract out this map method
./node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch/dist/commonjs/index.js:                    // XXX remove this slice.  Just pass the start index.
./node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch/dist/esm/ast.js:    // TODO: instead of injecting the start/end at this point, just return
```

### Recommendations
- Consider containerization with Docker

### Directory Structure
```
.
├── app
│   ├── accounting
│   │   └── page.tsx
│   ├── api
│   │   ├── dashboard
│   │   ├── finance
│   │   ├── hr
│   │   ├── inventory
│   │   ├── purchase
│   │   └── sales
│   ├── attendance
│   │   └── page.tsx
│   ├── auth
│   │   ├── error
│   │   ├── forgot-password
│   │   ├── login
│   │   ├── reset-password
│   │   └── signup
│   ├── clients
│   │   ├── create
│   │   └── page.tsx
│   ├── dashboard
│   │   └── page.tsx
│   ├── documents
│   │   └── page.tsx
│   ├── employees
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── finance
│   │   └── page.tsx
│   ├── globals.css
│   ├── inventory
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── payroll
│   │   └── page.tsx
│   ├── purchase
│   │   └── page.tsx
│   ├── qhse
│   │   └── page.tsx
│   ├── sales
│   │   ├── credit-notes
│   │   ├── invoices
│   │   ├── page.tsx
│   │   ├── payments
│   │   ├── rfq
│   │   └── settings
│   └── settings
│       └── page.tsx
├── AUTHENTICATION.md
├── BGU_COMPONENTS_SUMMARY.md
├── BGU_IMPLEMENTATION_CHECKLIST.md
├── BGU Portal Layout.pdf
├── CLAUDE.md
├── components
│   ├── auth
│   │   ├── protected-route.tsx
│   │   └── role-guard.tsx
│   ├── dashboard
│   │   ├── dashboard-page.tsx
│   │   ├── quick-actions.tsx
│   │   ├── realtime-stats.tsx
│   │   └── summary-widgets.tsx
│   ├── data-table
│   │   └── data-table.tsx
│   ├── documents
│   │   ├── document-upload.tsx
│   │   ├── document-versions.tsx
│   │   └── folder-manager.tsx
│   ├── index.ts
│   ├── layout
│   │   ├── header.tsx
│   │   ├── main-layout.tsx
│   │   └── sidebar.tsx
│   ├── modules
│   │   ├── clients
│   │   ├── inventory
│   │   ├── purchase
│   │   └── sales
│   ├── providers
│   │   └── AuthProvider.tsx
│   ├── realtime
│   │   ├── activity-feed.tsx
│   │   └── notification-system.tsx
│   └── ui
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── loading.tsx
│       ├── progress.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       └── textarea.tsx
├── components.json
├── DATABASE_SETUP.md
├── lib
│   ├── auth
│   │   ├── audit.ts
│   │   ├── email.ts
│   │   └── validation.ts
│   ├── config
│   │   └── navigation.ts
│   ├── hooks
│   │   ├── useAuth.ts
│   │   ├── useRealtimeStats.ts
│   │   └── useSalesStats.ts
│   ├── supabase
│   │   ├── client.ts
│   │   └── server.ts
│   ├── types
│   │   ├── auth.ts
│   │   └── bgu.ts
│   ├── utils
│   │   └── permissions.ts
│   └── utils.ts
├── middleware.ts
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── prisma
│   ├── dev.db
│   ├── migration.sql
│   └── schema.prisma
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── README.md
├── scripts
│   ├── claude-project-analyzer.sh
│   ├── claude-validation-suite.sh
│   ├── context-integrity-checker.py
│   ├── mcp-health-monitor.sh
│   ├── security-audit-gate.sh
│   └── switch-database.sh
├── SETUP_COMPLETE.md
├── supabase
│   └── schema.sql
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── types
│   └── bcryptjs.d.ts
├── VERCEL_DEPLOYMENT.md
├── VERCEL_ENV.md
└── vercel.json

60 directories, 101 files
```

### Next Steps for Claude Code Integration
1. Run `./scripts/claude-master-setup.sh` to initialize Claude Code
2. Review and implement recommendations above
3. Set up essential MCP servers based on detected stack
4. Create feature development workflow with `/plan` command
