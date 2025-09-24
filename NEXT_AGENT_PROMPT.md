# 🚀 Next Agent Instructions - Week 4 Sales Module

**IMPORTANT**: Use this prompt when starting fresh with a new Claude Code agent.

---

## 📋 **CONTEXT**

I'm continuing development of the **BlackGoldUnited ERP system**. Week 3 has just been completed, and we're now moving into **Week 4: Sales Module Foundation**.

**Current Status**:
- **40% Complete** (3 weeks done, 11 weeks remaining)
- **Phase 2**: Core Modules Implementation
- **Week 3 Achievement**: Complete Client Management System with API integration
- **Ready for**: Week 4 - Sales Module Foundation

---

## 🎯 **YOUR MISSION**

You need to build the **Sales Module** using the established patterns from the Client module.

**Primary Goals**:
1. Create invoice API endpoints (CRUD)
2. Build invoice management forms
3. Connect invoices to clients and products
4. Implement invoice business logic
5. Test with all user roles

---

## 📚 **CRITICAL FILES TO READ FIRST**

1. **`DEVELOPMENT_PLAN.md`** - Master plan showing current status and Week 4 tasks
2. **`WEEK3_COMPLETION_SUMMARY.md`** - What was just completed and established patterns
3. **`API_DOCUMENTATION.md`** - API patterns to follow
4. **`CLAUDE.md`** - Project guidelines and workflows

---

## 🏗️ **ESTABLISHED PATTERNS TO FOLLOW**

### **API Pattern** (from `/app/api/clients/`)
```typescript
// 1. Route structure: /app/api/invoices/route.ts and /app/api/invoices/[id]/route.ts
// 2. Authentication: Use authenticateAndAuthorize(request, 'invoices', method)
// 3. Validation: Zod schemas for input validation
// 4. Error handling: Consistent HTTP status codes (401, 403, 404, 409, 500)
// 5. Response format: { success: boolean, data?: any, error?: string }
```

### **Frontend Pattern** (from `/app/clients/`)
```typescript
// 1. Page structure: page.tsx, create/page.tsx, [id]/page.tsx, [id]/edit/page.tsx
// 2. State management: useState with loading/error states
// 3. API integration: fetch() with proper error handling
// 4. Form validation: Client-side + server-side validation
// 5. Permission checks: usePermissions() hook
```

---

## 🚀 **START HERE**

1. **Review Current Status**:
   ```bash
   # Check that everything is working
   npm run type-check  # Should pass with 0 errors
   npm run lint        # Should pass (warnings OK)
   npm run dev         # Should start on port 3001
   ```

2. **Examine Reference Implementation**:
   - Study `/app/clients/` pages for UI patterns
   - Study `/app/api/clients/` for API patterns
   - Note the data mapping and error handling

3. **Start Week 4 Tasks**:
   - **Task 4.1**: Create invoice API endpoints (CRUD)
   - Follow the exact task list in `DEVELOPMENT_PLAN.md`

---

## ⚠️ **CRITICAL REMINDERS**

- **NEVER** skip reading `DEVELOPMENT_PLAN.md` first
- **ALWAYS** follow the established API and UI patterns from Client module
- **TEST** with all 5 user roles for any functionality you create
- **UPDATE** `DEVELOPMENT_PLAN.md` when you complete tasks
- **MAINTAIN** TypeScript strictness and ESLint compliance

---

## 🎯 **WEEK 4 SUCCESS CRITERIA**

- [ ] Invoice API endpoints working (GET, POST, PUT, DELETE)
- [ ] Invoice creation and editing forms
- [ ] Invoice list with search and filtering
- [ ] Invoice-client relationships working
- [ ] Invoice line items functionality
- [ ] Business logic (calculations, numbering)
- [ ] All functionality tested with user roles
- [ ] TypeScript and ESLint passing

---

## 📞 **NEED HELP?**

- **Stuck on patterns?** → Look at `/app/clients/` and `/app/api/clients/`
- **API questions?** → Check `API_DOCUMENTATION.md`
- **Permission issues?** → Review `lib/auth/` files
- **Database schema?** → Check Supabase dashboard or ask for schema info

---

**Ready to build the Sales module!** 🚀

The foundation is solid, the patterns are established, and the codebase is clean. Just follow the proven patterns and you'll make rapid progress.

**Start with**: `DEVELOPMENT_PLAN.md` → Week 4 tasks → Task 4.1