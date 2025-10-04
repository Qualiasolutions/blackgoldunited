# Feature Workflow - End-to-End Feature Implementation

**Purpose**: Systematic workflow for implementing new features in the ERP system

```yaml
workflow:
  id: feature
  name: Feature Implementation Workflow
  icon: 🆕
  estimated_time: Variable (1 hour - 1 week)
  difficulty: Medium to High
  requires_agents:
    - database-guardian
    - backend-guard
    - frontend-doctor
    - qa-validator

phases:
  1_planning:
    name: Feature Planning & Design
    duration: 15-30 minutes
    steps:
      - Understand feature requirements
      - Identify affected modules
      - Design data model
      - Plan API endpoints
      - Sketch UI components
      - Estimate complexity

  2_database:
    name: Database Schema Changes
    duration: 15-45 minutes
    agent: database-guardian
    steps:
      - Design table schema
      - Write migration SQL
      - Create RLS policies
      - Enable RLS on tables
      - Apply migration via Supabase MCP
      - Verify schema changes

  3_backend:
    name: Backend API Development
    duration: 30-90 minutes
    agent: backend-guard
    steps:
      - Create API route files
      - Implement authentication
      - Add input validation
      - Implement business logic
      - Handle errors properly
      - Test API endpoints

  4_frontend:
    name: Frontend UI Development
    duration: 1-3 hours
    agent: frontend-doctor
    steps:
      - Create page components
      - Add forms and inputs
      - Integrate with APIs
      - Add loading states
      - Add error handling
      - Style components

  5_integration:
    name: Integration Testing
    duration: 15-30 minutes
    agent: qa-validator
    steps:
      - Test end-to-end flow
      - Test with different roles
      - Verify RLS policies
      - Check edge cases
      - Validate error messages

  6_deployment:
    name: Deployment
    duration: 10-15 minutes
    agent: devops-engineer
    steps:
      - Run type-check
      - Run build
      - Run security audit
      - Commit with detailed message
      - Push to main (auto-deploy)
      - Verify in production

decision_tree:
  needs_database_changes:
    yes: Start with database-guardian (Phase 2)
    no: Start with backend-guard (Phase 3)

  needs_ui_changes:
    yes: Include frontend-doctor (Phase 4)
    no: Skip to integration (Phase 5)

  is_critical_feature:
    yes: Add extra QA validation
    no: Standard testing flow

checklist:
  planning:
    - [ ] Feature requirements documented
    - [ ] Data model designed
    - [ ] API endpoints planned
    - [ ] UI mockups created
    - [ ] Complexity estimated

  database:
    - [ ] Migration file created
    - [ ] RLS policies written
    - [ ] RLS enabled on tables
    - [ ] Migration applied
    - [ ] Schema verified

  backend:
    - [ ] API routes created
    - [ ] Authentication added
    - [ ] Input validation implemented
    - [ ] Error handling added
    - [ ] API tested

  frontend:
    - [ ] Pages created
    - [ ] Forms implemented
    - [ ] API integration working
    - [ ] Loading states added
    - [ ] Error handling added
    - [ ] Styling complete

  quality:
    - [ ] TypeScript: 0 errors
    - [ ] Build: Successful
    - [ ] End-to-end flow tested
    - [ ] RLS policies verified
    - [ ] Security audit passed

  deployment:
    - [ ] Code committed
    - [ ] Changes documented
    - [ ] Pushed to main
    - [ ] Vercel deployed
    - [ ] Production verified
```

## Example: Add Employee Onboarding Feature

### Phase 1: Planning
```
Feature: Employee Onboarding Workflow

Requirements:
- HR can create onboarding checklist for new hires
- Track onboarding tasks (documents, training, equipment)
- Send automated notifications
- Generate onboarding reports

Data Model:
- onboarding_checklists table
- onboarding_tasks table
- onboarding_progress table

APIs Needed:
- POST /api/hr/onboarding/checklists
- GET /api/hr/onboarding/checklists
- POST /api/hr/onboarding/tasks
- PUT /api/hr/onboarding/tasks/:id/complete

UI Components:
- Onboarding dashboard page
- Checklist creation form
- Task tracking interface
```

### Phase 2: Database (database-guardian)
```sql
-- Migration: create_onboarding_system
-- Date: 2025-10-05

CREATE TABLE public.onboarding_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id),
  status VARCHAR(20) DEFAULT 'IN_PROGRESS',
  start_date DATE NOT NULL,
  target_completion DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID REFERENCES public.onboarding_checklists(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.users(id),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.onboarding_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies (HR and employee access)
...
```

### Phase 3: Backend (backend-guard)
```typescript
// app/api/hr/onboarding/checklists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const authResult = await authenticateAndAuthorize(request, 'employees', 'POST');
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const { employee_id, start_date, target_completion } = body;

    // Validation
    if (!employee_id || !start_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create checklist
    const { data: checklist, error } = await supabase
      .from('onboarding_checklists')
      .insert({
        employee_id,
        created_by: authResult.user.id,
        start_date,
        target_completion
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: checklist }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating onboarding checklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Phase 4: Frontend (frontend-doctor)
```typescript
// app/hr/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { hasModuleAccess } from '@/lib/auth/permissions';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChecklists = async () => {
      try {
        const res = await fetch('/api/hr/onboarding/checklists');
        const data = await res.json();
        setChecklists(data.data || []);
      } catch (error) {
        console.error('Error fetching checklists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [user]);

  if (!user || !hasModuleAccess(user.role, 'employees')) {
    return <div>Access Denied</div>;
  }

  if (loading) {
    return <Loader2 className="animate-spin" />;
  }

  return (
    <div>
      <h1>Employee Onboarding</h1>
      {/* Onboarding interface */}
    </div>
  );
}
```

### Phase 5: Integration Testing (qa-validator)
```
Test Scenarios:
✓ HR admin can create onboarding checklist
✓ HR admin can see all checklists
✓ Employee can only see their own checklist
✓ Tasks can be marked complete
✓ Notifications sent on task completion
✓ RLS prevents unauthorized access
✓ Form validation works correctly
```

### Phase 6: Deployment (devops-engineer)
```bash
# Type check
npm run type-check
✓ 0 errors

# Build
npm run build
✓ Build successful

# Security audit
./scripts/security-check-detailed.sh
✓ No critical issues

# Commit
git add .
git commit -m "✨ Feature: Add employee onboarding workflow

- Create onboarding_checklists and onboarding_tasks tables
- Add RLS policies for HR and employee access
- Implement onboarding API endpoints
- Create onboarding dashboard page
- Add task tracking interface

Closes #123
"

# Deploy
git push origin main
✓ Deployed to production
```

## Success Criteria

- [ ] Feature works end-to-end
- [ ] All user roles tested
- [ ] RLS policies verified
- [ ] TypeScript: 0 errors
- [ ] Build: Successful
- [ ] Documentation updated
- [ ] Production verified
