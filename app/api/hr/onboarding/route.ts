import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Onboarding workflow validation schema
const onboardingWorkflowSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  tasks: z.array(z.object({
    title: z.string().min(1, 'Task title is required').max(200),
    description: z.string().optional().or(z.literal('')),
    category: z.enum(['documentation', 'equipment', 'training', 'system_access', 'orientation', 'other']),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    dueDate: z.string().optional().or(z.literal('')),
    assignedTo: z.string().uuid().optional().or(z.literal('')),
    isRequired: z.boolean().default(true)
  })).optional().default([])
})

// Update onboarding task schema
const updateTaskSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().optional().or(z.literal('')),
  completedAt: z.string().optional().or(z.literal(''))
})

// GET /api/hr/onboarding - List all onboarding workflows
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - HR module access required
    const authResult = await authenticateAndAuthorize(request, 'hr', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // For this implementation, we'll use activity_logs to track onboarding status
    // and create a virtual onboarding workflow system
    let query = supabase
      .from('employees')
      .select(`
        id,
        employeeNumber,
        firstName,
        lastName,
        email,
        hireDate,
        probationEndDate,
        confirmationDate,
        isActive,
        department:departments(id, name),
        designation:designations(id, title)
      `)
      .is('deletedAt', null)
      .order('hireDate', { ascending: false })

    if (employeeId) {
      query = query.eq('id', employeeId)
    }

    if (status === 'new') {
      // New employees (hired in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      query = query.gte('hireDate', thirtyDaysAgo.toISOString().split('T')[0])
    } else if (status === 'probation') {
      // Employees in probation
      query = query.is('confirmationDate', null)
        .gte('hireDate', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    }

    query = query.range(offset, offset + limit - 1)

    const { data: employees, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch onboarding data' }, { status: 500 })
    }

    // For each employee, create a virtual onboarding status
    const onboardingData = employees?.map(employee => {
      const hireDate = new Date(employee.hireDate)
      const daysSinceHire = Math.floor((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24))

      let onboardingStatus = 'completed'
      if (daysSinceHire <= 7) {
        onboardingStatus = 'in_progress'
      } else if (daysSinceHire <= 1) {
        onboardingStatus = 'pending'
      }

      if (!employee.confirmationDate && daysSinceHire > 90) {
        onboardingStatus = 'overdue'
      }

      return {
        ...employee,
        onboardingStatus,
        daysSinceHire,
        isProbationPeriod: !employee.confirmationDate,
        onboardingTasks: getDefaultOnboardingTasks(employee.id)
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: onboardingData,
      pagination: {
        limit,
        offset,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hr/onboarding - Create/Update onboarding workflow
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - HR write access required
    const authResult = await authenticateAndAuthorize(request, 'hr', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can manage onboarding
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can manage onboarding workflows'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = onboardingWorkflowSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { employeeId, tasks } = validationResult.data

    // Verify employee exists
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, firstName, lastName, employeeNumber, hireDate')
      .eq('id', employeeId)
      .is('deletedAt', null)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // For this implementation, we'll store onboarding tasks in activity_logs
    // with a special entityType of 'onboarding_task'
    const onboardingTasks = tasks.length > 0 ? tasks : getDefaultOnboardingTasks(employeeId)

    // Create activity log entries for onboarding tasks
    const taskInserts = onboardingTasks.map((task, index) => ({
      entityType: 'onboarding_task',
      entityId: employeeId,
      action: 'created',
      description: `Onboarding task: ${task.title}`,
      userId: authResult.user.id,
      metadata: {
        taskId: `onboarding_${employeeId}_${index}`,
        title: task.title,
        description: task.description || '',
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate || '',
        assignedTo: task.assignedTo || authResult.user.id,
        isRequired: task.isRequired,
        status: 'pending',
        employeeNumber: employee.employeeNumber,
        employeeName: `${employee.firstName} ${employee.lastName}`
      },
      createdAt: new Date().toISOString()
    }))

    const { error: taskError } = await supabase
      .from('activity_logs')
      .insert(taskInserts)

    if (taskError) {
      console.error('Database error:', taskError)
      return NextResponse.json({ error: 'Failed to create onboarding workflow' }, { status: 500 })
    }

    // Create main onboarding workflow entry
    const { error: workflowError } = await supabase
      .from('activity_logs')
      .insert([{
        entityType: 'onboarding_workflow',
        entityId: employeeId,
        action: 'created',
        description: `Onboarding workflow initiated for ${employee.firstName} ${employee.lastName}`,
        userId: authResult.user.id,
        metadata: {
          employeeNumber: employee.employeeNumber,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          taskCount: onboardingTasks.length,
          status: 'active'
        },
        createdAt: new Date().toISOString()
      }])

    if (workflowError) {
      console.warn('Failed to log workflow creation:', workflowError)
    }

    return NextResponse.json({
      success: true,
      data: {
        employeeId,
        employee: {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeNumber: employee.employeeNumber
        },
        tasks: onboardingTasks.map((task, index) => ({
          ...task,
          id: `onboarding_${employeeId}_${index}`,
          status: 'pending'
        })),
        message: 'Onboarding workflow created successfully'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Default onboarding tasks template
function getDefaultOnboardingTasks(employeeId: string) {
  return [
    {
      title: 'Complete personal information form',
      description: 'Fill out all required personal and emergency contact information',
      category: 'documentation' as const,
      priority: 'high' as const,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day
      assignedTo: employeeId,
      isRequired: true
    },
    {
      title: 'Submit required documents',
      description: 'Provide passport copy, visa, emirates ID, and educational certificates',
      category: 'documentation' as const,
      priority: 'critical' as const,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      assignedTo: employeeId,
      isRequired: true
    },
    {
      title: 'IT equipment allocation',
      description: 'Assign laptop, access cards, and other required equipment',
      category: 'equipment' as const,
      priority: 'high' as const,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      assignedTo: '', // To be assigned by HR
      isRequired: true
    },
    {
      title: 'System access setup',
      description: 'Create user accounts and assign appropriate system permissions',
      category: 'system_access' as const,
      priority: 'high' as const,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      assignedTo: '', // To be assigned by IT
      isRequired: true
    },
    {
      title: 'Company orientation session',
      description: 'Attend company culture, policies, and procedures orientation',
      category: 'orientation' as const,
      priority: 'medium' as const,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
      assignedTo: '', // To be assigned by HR
      isRequired: true
    },
    {
      title: 'Department-specific training',
      description: 'Complete role-specific training and meet team members',
      category: 'training' as const,
      priority: 'medium' as const,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      assignedTo: '', // To be assigned by manager
      isRequired: true
    },
    {
      title: 'Health and safety briefing',
      description: 'Complete QHSE orientation and safety protocols training',
      category: 'training' as const,
      priority: 'high' as const,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      assignedTo: '', // To be assigned by QHSE
      isRequired: true
    },
    {
      title: '30-day check-in meeting',
      description: 'Schedule meeting to review progress and address any concerns',
      category: 'orientation' as const,
      priority: 'medium' as const,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      assignedTo: '', // To be assigned by manager
      isRequired: false
    }
  ]
}