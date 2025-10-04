import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Employee document validation schema
const documentSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  documentType: z.enum([
    'passport', 'visa', 'emirates_id', 'degree_certificate', 'experience_certificate',
    'medical_certificate', 'no_objection_certificate', 'salary_certificate',
    'bank_statement', 'contract', 'other'
  ]),
  documentName: z.string().min(1, 'Document name is required').max(200),
  description: z.string().optional().or(z.literal('')),
  documentUrl: z.string().url('Invalid document URL').optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  issueDate: z.string().optional().or(z.literal('')),
  issuingAuthority: z.string().max(200).optional().or(z.literal('')),
  isRequired: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  tags: z.array(z.string()).optional().default([])
})

// GET /api/hr/documents - List employee documents with filtering
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - HR module access required
    const authResult = await authenticateAndAuthorize(request, 'employees', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const employeeId = searchParams.get('employeeId')
    const documentType = searchParams.get('documentType')
    const isVerified = searchParams.get('isVerified')
    const isRequired = searchParams.get('isRequired')
    const expiringWithin = searchParams.get('expiringWithin') // days
    const search = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // For this implementation, we'll use activity_logs to store document information
    // with a special entityType of 'employee_document'
    let query = supabase
      .from('activity_logs')
      .select(`
        id,
        entityId,
        description,
        metadata,
        createdAt,
        updatedAt,
        userId,
        user:users!activity_logs_userId_fkey(firstName, lastName)
      `)
      .eq('entityType', 'employee_document')
      .order('created_at', { ascending: false })

    // Apply filters
    if (employeeId) {
      query = query.eq('entityId', employeeId)
    }

    const { data: documentLogs, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Get employee details for documents
    const employeeIds = [...new Set(documentLogs?.map(log => log.entityId) || [])]
    const { data: employees } = await supabase
      .from('employees')
      .select(`
        id,
        firstName,
        lastName,
        employeeNumber,
        department:departments(name)
      `)
      .in('id', employeeIds)
      const employeeMap = employees?.reduce((acc, emp) => {
      acc[emp.id] = emp
      return acc
    }, {} as any) || {}

    // Transform document logs into documents
    let documents = documentLogs?.map(log => {
      const metadata = log.metadata || {}
      const employee = employeeMap[log.entityId]

      return {
        id: log.id,
        employeeId: log.entityId,
        employee: employee ? {
          name: `${employee.firstName} ${employee.lastName}`,
          employeeNumber: employee.employeeNumber,
          department: employee.department?.name || ''
        } : null,
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
        uploadedBy: log.user ? `${(log.user as any).firstName} ${(log.user as any).lastName}` : '',
        createdAt: log.createdAt,
        updatedAt: log.updatedAt
      }
    }) || []

    // Apply client-side filters (since we can't filter metadata in the database easily)
    if (documentType) {
      documents = documents.filter(doc => doc.documentType === documentType)
    }

    if (isVerified !== null) {
      documents = documents.filter(doc => doc.isVerified === (isVerified === 'true'))
    }

    if (isRequired !== null) {
      documents = documents.filter(doc => doc.isRequired === (isRequired === 'true'))
    }

    if (expiringWithin) {
      const days = parseInt(expiringWithin)
      const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      documents = documents.filter(doc => {
        if (!doc.expiryDate) return false
        return new Date(doc.expiryDate) <= futureDate && new Date(doc.expiryDate) >= new Date()
      })
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase()
      documents = documents.filter(doc =>
        doc.documentName.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.employee?.name.toLowerCase().includes(searchLower) ||
        doc.employee?.employeeNumber.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        limit,
        offset,
        total: documents.length, // Note: This will be the filtered count, not total DB count
        pages: Math.ceil(documents.length / limit)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hr/documents - Upload/Create new employee document
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize - HR write access required
    const authResult = await authenticateAndAuthorize(request, 'employees', 'POST')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Additional role check - only MANAGEMENT, ADMIN_HR, and document owners can upload documents
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      // We'll check if user is the employee themselves later
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate request data
    const validationResult = documentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Verify employee exists
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, firstName, lastName, employeeNumber, userId')
      .eq('id', validatedData.employeeId)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if user can upload documents for this employee
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      if (employee.userId !== authResult.user.id) {
        return NextResponse.json({
          error: 'Insufficient permissions - You can only upload documents for yourself'
        }, { status: 403 })
      }
    }

    // Check for duplicate documents of the same type
    const { data: existingDoc } = await supabase
      .from('activity_logs')
      .select('id, metadata')
      .eq('entityType', 'employee_document')
      .eq('entityId', validatedData.employeeId)
      .eq('metadata->documentType', validatedData.documentType)
      .eq('metadata->documentName', validatedData.documentName)
      .single()

    if (existingDoc) {
      return NextResponse.json({
        error: 'A document with this type and name already exists for this employee'
      }, { status: 409 })
    }

    // Create document entry in activity_logs
    const documentMetadata = {
      documentType: validatedData.documentType,
      documentName: validatedData.documentName,
      description: validatedData.description || '',
      documentUrl: validatedData.documentUrl || '',
      expiryDate: validatedData.expiryDate || '',
      issueDate: validatedData.issueDate || '',
      issuingAuthority: validatedData.issuingAuthority || '',
      isRequired: validatedData.isRequired,
      isVerified: ['MANAGEMENT', 'ADMIN_HR'].includes(userRole) ? validatedData.isVerified : false,
      tags: validatedData.tags || [],
      employeeNumber: employee.employeeNumber,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      uploadedByRole: userRole
    }

    const { data: documentEntry, error: docError } = await supabase
      .from('activity_logs')
      .insert([{
        entityType: 'employee_document',
        entityId: validatedData.employeeId,
        action: 'uploaded',
        description: `Document "${validatedData.documentName}" uploaded for ${employee.firstName} ${employee.lastName}`,
        userId: authResult.user.id,
        metadata: documentMetadata,
        createdAt: new Date().toISOString()
      }])
      .select(`
        id,
        metadata,
        createdAt,
        user:users!activity_logs_userId_fkey(firstName, lastName)
      `)
      .single()

    if (docError) {
      console.error('Database error:', docError)
      return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
    }

    // Return the created document
    const createdDocument = {
      id: documentEntry.id,
      employeeId: validatedData.employeeId,
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        employeeNumber: employee.employeeNumber
      },
      ...documentMetadata,
      uploadedBy: documentEntry.user ? `${(documentEntry.user as any).firstName} ${(documentEntry.user as any).lastName}` : '',
      createdAt: documentEntry.createdAt,
      updatedAt: documentEntry.createdAt
    }

    return NextResponse.json({
      success: true,
      data: createdDocument,
      message: 'Document uploaded successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}