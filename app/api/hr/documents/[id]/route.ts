import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Document update validation schema
const documentUpdateSchema = z.object({
  documentName: z.string().min(1, 'Document name is required').max(200).optional(),
  description: z.string().optional().or(z.literal('')),
  documentUrl: z.string().url('Invalid document URL').optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  issueDate: z.string().optional().or(z.literal('')),
  issuingAuthority: z.string().max(200).optional().or(z.literal('')),
  isVerified: z.boolean().optional(),
  tags: z.array(z.string()).optional()
})

// GET /api/hr/documents/[id] - Get single document details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'employees', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Get document from activity_logs
    const { data: documentLog, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        entityId,
        description,
        metadata,
        createdAt,
        updatedAt,
        userId,
        user:users!activity_logs_userId_fkey(firstName, lastName, email)
      `)
      .eq('entityType', 'employee_document')
      .eq('id', id)
      .single()

    if (error || !documentLog) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select(`
        id,
        firstName,
        lastName,
        employeeNumber,
        userId,
        department:departments(id, name),
        designation:designations(id, title)
      `)
      .eq('id', documentLog.entityId)
      .is('deletedAt', null)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if user can view this document
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      if (employee.userId !== authResult.user.id) {
        return NextResponse.json({
          error: 'Insufficient permissions - You can only view your own documents'
        }, { status: 403 })
      }
    }

    // Transform document log into document
    const metadata = documentLog.metadata || {}
    const document = {
      id: documentLog.id,
      employeeId: documentLog.entityId,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeNumber: employee.employeeNumber,
        department: employee.department ? (employee.department as any).name : '',
        designation: employee.designation ? (employee.designation as any).title : ''
      },
      documentType: metadata.documentType || 'other',
      documentName: metadata.documentName || '',
      description: metadata.description || '',
      documentUrl: metadata.documentUrl || '',
      expiryDate: metadata.expiryDate || '',
      issueDate: metadata.issueDate || '',
      issuingAuthority: metadata.issuingAuthority || '',
      isRequired: metadata.isRequired === true,
      isVerified: metadata.isVerified === true,
      tags: metadata.tags || [],
      uploadedBy: documentLog.user ? {
        name: `${(documentLog.user as any).firstName} ${(documentLog.user as any).lastName}`,
        email: (documentLog.user as any).email
      } : null,
      createdAt: documentLog.createdAt,
      updatedAt: documentLog.updatedAt
    }

    // Check if document is expiring soon
    let expiryStatus = 'valid'
    if (document.expiryDate) {
      const expiryDate = new Date(document.expiryDate)
      const now = new Date()
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilExpiry < 0) {
        expiryStatus = 'expired'
      } else if (daysUntilExpiry <= 30) {
        expiryStatus = 'expiring_soon'
      }
    }

    const documentWithStatus = {
      ...document,
      expiryStatus
    }

    return NextResponse.json({
      success: true,
      data: documentWithStatus
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/hr/documents/[id] - Update document
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'employees', 'PUT')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = documentUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Get existing document
    const { data: existingDoc, error: findError } = await supabase
      .from('activity_logs')
      .select('id, entityId, metadata, userId')
      .eq('entityType', 'employee_document')
      .eq('id', id)
      .single()

    if (findError || !existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get employee details to check permissions
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, firstName, lastName, employeeNumber, userId')
      .eq('id', existingDoc.entityId)
      .is('deletedAt', null)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if user can update this document
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      if (employee.userId !== authResult.user.id) {
        return NextResponse.json({
          error: 'Insufficient permissions - You can only update your own documents'
        }, { status: 403 })
      }
    }

    // Update document metadata
    const updatedMetadata = {
      ...existingDoc.metadata,
      ...Object.keys(validatedData).reduce((acc, key) => {
        const value = (validatedData as any)[key]
        if (value !== undefined) {
          acc[key] = value === '' ? null : value
        }
        return acc
      }, {} as any),
      lastUpdatedBy: authResult.user.id,
      updatedAt: new Date().toISOString()
    }

    // Only MANAGEMENT and ADMIN_HR can verify documents
    if (validatedData.isVerified !== undefined && !['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      delete updatedMetadata.isVerified
    }

    // Update the activity log entry
    const { error: updateError } = await supabase
      .from('activity_logs')
      .update({
        metadata: updatedMetadata,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    // Create a new activity log entry for the update
    const updateDescription = `Document "${updatedMetadata.documentName}" updated for ${employee.firstName} ${employee.lastName}`

    const { error: logError } = await supabase
      .from('activity_logs')
      .insert([{
        entityType: 'document_update',
        entityId: existingDoc.entityId,
        action: 'updated',
        description: updateDescription,
        userId: authResult.user.id,
        metadata: {
          id,
          documentName: updatedMetadata.documentName,
          updatedFields: Object.keys(validatedData),
          employeeName: `${employee.firstName} ${employee.lastName}`
        },
        createdAt: new Date().toISOString()
      }])

    if (logError) {
      console.warn('Failed to log document update:', logError)
    }

    // Return updated document
    const updatedDocument = {
      id: id,
      employeeId: existingDoc.entityId,
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        employeeNumber: employee.employeeNumber
      },
      documentType: updatedMetadata.documentType || 'other',
      documentName: updatedMetadata.documentName || '',
      description: updatedMetadata.description || '',
      documentUrl: updatedMetadata.documentUrl || '',
      expiryDate: updatedMetadata.expiryDate || '',
      issueDate: updatedMetadata.issueDate || '',
      issuingAuthority: updatedMetadata.issuingAuthority || '',
      isRequired: updatedMetadata.isRequired === true,
      isVerified: updatedMetadata.isVerified === true,
      tags: updatedMetadata.tags || [],
      lastUpdatedBy: authResult.user.id,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: updatedDocument,
      message: 'Document updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/hr/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'employees', 'DELETE')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT and ADMIN_HR can delete documents
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions - Only MANAGEMENT and ADMIN_HR can delete documents'
      }, { status: 403 })
    }

    const supabase = await createClient()

    // Get document details before deletion
    const { data: documentLog, error: findError } = await supabase
      .from('activity_logs')
      .select('id, entityId, metadata')
      .eq('entityType', 'employee_document')
      .eq('id', id)
      .single()

    if (findError || !documentLog) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const metadata = documentLog.metadata || {}

    // Get employee details
    const { data: employee } = await supabase
      .from('employees')
      .select('firstName, lastName, employeeNumber')
      .eq('id', documentLog.entityId)
      .is('deletedAt', null)
      .single()

    // Soft delete by updating metadata
    const { error: deleteError } = await supabase
      .from('activity_logs')
      .update({
        metadata: {
          ...metadata,
          deletedAt: new Date().toISOString(),
          deletedBy: authResult.user.id
        },
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    // Log the deletion
    if (employee) {
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert([{
          entityType: 'document_deletion',
          entityId: documentLog.entityId,
          action: 'deleted',
          description: `Document "${metadata.documentName}" deleted for ${employee.firstName} ${employee.lastName}`,
          userId: authResult.user.id,
          metadata: {
            id,
            documentName: metadata.documentName,
            documentType: metadata.documentType,
            employeeName: `${employee.firstName} ${employee.lastName}`
          },
          createdAt: new Date().toISOString()
        }])

      if (logError) {
        console.warn('Failed to log document deletion:', logError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Document "${metadata.documentName}" deleted successfully`
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}