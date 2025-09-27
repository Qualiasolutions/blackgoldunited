import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Update onboarding task schema
const updateTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().optional().or(z.literal('')),
  completedAt: z.string().optional().or(z.literal(''))
})

// GET /api/hr/onboarding/[employeeId] - Get employee onboarding details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> }
) {
  const { employeeId } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'employees', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get employee details
    const { data: employee, error: empError } = await supabase
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
        designation:designations(id, title),
        reportingManager:employees!employees_reportingManagerId_fkey(
          id,
          firstName,
          lastName,
          employeeNumber
        )
      `)
      .eq('id', employeeId)
      .is('deletedAt', null)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Get onboarding tasks from activity_logs
    const { data: taskLogs, error: taskError } = await supabase
      .from('activity_logs')
      .select(`
        id,
        action,
        description,
        metadata,
        createdAt,
        updatedAt
      `)
      .eq('entityType', 'onboarding_task')
      .eq('entityId', employeeId)
      .order('createdAt', { ascending: true })

    if (taskError) {
      console.error('Database error:', taskError)
      // Don't fail if no tasks found, return empty array
    }

    // Transform task logs into tasks
    const tasks = taskLogs?.map(log => {
      const metadata = log.metadata || {}
      return {
        id: metadata.taskId,
        title: metadata.title || '',
        description: metadata.description || '',
        category: metadata.category || 'other',
        priority: metadata.priority || 'medium',
        status: metadata.status || 'pending',
        dueDate: metadata.dueDate || '',
        assignedTo: metadata.assignedTo || '',
        isRequired: metadata.isRequired !== false,
        notes: metadata.notes || '',
        completedAt: metadata.completedAt || '',
        createdAt: log.createdAt,
        updatedAt: log.updatedAt
      }
    }) || []

    // Calculate onboarding progress
    const hireDate = new Date(employee.hireDate)
    const daysSinceHire = Math.floor((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24))

    const completedTasks = tasks.filter(task => task.status === 'completed').length
    const totalTasks = tasks.length
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    let onboardingStatus = 'pending'
    if (progressPercentage === 100) {
      onboardingStatus = 'completed'
    } else if (progressPercentage > 0) {
      onboardingStatus = 'in_progress'
    }

    // Check for overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (task.status === 'completed' || !task.dueDate) return false
      return new Date(task.dueDate) < new Date()
    }).length

    if (overdueTasks > 0) {
      onboardingStatus = 'overdue'
    }

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('activity_logs')
      .select(`
        id,
        action,
        description,
        createdAt,
        user:users!activity_logs_userId_fkey(firstName, lastName)
      `)
      .eq('entityType', 'onboarding_task')
      .eq('entityId', employeeId)
      .order('createdAt', { ascending: false })
      .limit(10)

    const onboardingData = {
      employee,
      onboardingStatus,
      daysSinceHire,
      isProbationPeriod: !employee.confirmationDate,
      progress: {
        completedTasks,
        totalTasks,
        percentage: progressPercentage,
        overdueTasks
      },
      tasks,
      recentActivity: recentActivity || []
    }

    return NextResponse.json({
      success: true,
      data: onboardingData
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/hr/onboarding/[employeeId] - Update onboarding task status
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> }
) {
  const { employeeId } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'employees', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = updateTaskSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { taskId, status, notes, completedAt } = validationResult.data

    // Find the task in activity_logs
    const { data: existingTask, error: findError } = await supabase
      .from('activity_logs')
      .select('id, metadata')
      .eq('entityType', 'onboarding_task')
      .eq('entityId', employeeId)
      .eq('metadata->taskId', taskId)
      .single()

    if (findError || !existingTask) {
      return NextResponse.json({ error: 'Onboarding task not found' }, { status: 404 })
    }

    // Update task metadata
    const updatedMetadata = {
      ...existingTask.metadata,
      status,
      notes: notes || existingTask.metadata?.notes || '',
      completedAt: status === 'completed' ?
        (completedAt || new Date().toISOString()) :
        (existingTask.metadata?.completedAt || ''),
      lastUpdatedBy: authResult.user.id
    }

    // Update the activity log entry
    const { error: updateError } = await supabase
      .from('activity_logs')
      .update({
        metadata: updatedMetadata,
        updatedAt: new Date().toISOString()
      })
      .eq('id', existingTask.id)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ error: 'Failed to update onboarding task' }, { status: 500 })
    }

    // Create a new activity log entry for the status change
    const statusChangeDescription = `Onboarding task "${updatedMetadata.title}" status changed to ${status}`

    const { error: logError } = await supabase
      .from('activity_logs')
      .insert([{
        entityType: 'onboarding_task_update',
        entityId: employeeId,
        action: 'updated',
        description: statusChangeDescription,
        userId: authResult.user.id,
        metadata: {
          taskId,
          taskTitle: updatedMetadata.title,
          previousStatus: existingTask.metadata?.status || 'pending',
          newStatus: status,
          notes,
          employeeName: updatedMetadata.employeeName
        },
        createdAt: new Date().toISOString()
      }])

    if (logError) {
      console.warn('Failed to log task update:', logError)
    }

    // Return updated task
    const updatedTask = {
      id: taskId,
      title: updatedMetadata.title,
      description: updatedMetadata.description || '',
      category: updatedMetadata.category || 'other',
      priority: updatedMetadata.priority || 'medium',
      status,
      dueDate: updatedMetadata.dueDate || '',
      assignedTo: updatedMetadata.assignedTo || '',
      isRequired: updatedMetadata.isRequired !== false,
      notes: updatedMetadata.notes || '',
      completedAt: updatedMetadata.completedAt || '',
      lastUpdatedBy: authResult.user.id,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: `Task "${updatedMetadata.title}" updated successfully`
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}