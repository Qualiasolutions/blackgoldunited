import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/documents/[id]/pdf - Generate PDF for document
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'templates', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()

    // Fetch document with full details
    const { data: document, error } = await supabase
      .from('documents')
      .select(`
        *,
        template:document_templates(
          id,
          template_name,
          template_type
        ),
        created_by_user:users!documents_created_by_fkey(
          first_name,
          last_name,
          email
        ),
        latest_version:document_versions(
          version_number,
          content,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
    }

    // Check access permissions
    const userRole = authResult.user.role
    if (!['MANAGEMENT', 'ADMIN_HR'].includes(userRole)) {
      if (document.access_level === 'PRIVATE' && document.created_by !== authResult.user.id) {
        return NextResponse.json({
          error: 'Access denied - Document is private'
        }, { status: 403 })
      }
    }

    // Generate HTML content for PDF
    const htmlContent = generateDocumentHTML(document)

    // For now, return the HTML content with proper headers
    // In a production environment, you would use a PDF generation library like puppeteer or jsPDF
    const fileName = `${document.document_number}_${document.document_name.replace(/[^a-zA-Z0-9]/g, '_')}.html`

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'GENERATE_DOCUMENT_PDF',
      entity_type: 'document',
      entity_id: id,
      details: {
        document_number: document.document_number,
        document_name: document.document_name,
        document_type: document.document_type
      }
    })

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })

  } catch (error) {
    console.error('Document PDF generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateDocumentHTML(document: any): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.document_name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .company-subtitle {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
        }
        .document-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-top: 20px;
        }
        .document-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .info-item {
            display: flex;
            flex-direction: column;
        }
        .info-label {
            font-weight: bold;
            color: #4b5563;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .info-value {
            color: #1f2937;
            font-size: 14px;
        }
        .content {
            margin: 30px 0;
            padding: 20px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            min-height: 400px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-draft { background: #fef3c7; color: #92400e; }
        .status-review { background: #dbeafe; color: #1e40af; }
        .status-approved { background: #d1fae5; color: #065f46; }
        .status-published { background: #dcfce7; color: #166534; }
        .status-archived { background: #f3f4f6; color: #374151; }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        .signature-section {
            margin-top: 60px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 50px;
        }
        .signature-box {
            text-align: center;
            border-top: 1px solid #9ca3af;
            padding-top: 10px;
        }
        .signature-label {
            font-size: 12px;
            color: #6b7280;
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72px;
            color: rgba(0, 0, 0, 0.05);
            z-index: -1;
            pointer-events: none;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    ${document.status === 'DRAFT' ? '<div class="watermark">DRAFT</div>' : ''}

    <!-- Header -->
    <div class="header">
        <div class="company-name">BlackGoldUnited</div>
        <div class="company-subtitle">Enterprise Resource Planning System</div>
        <div class="document-title">${document.document_name}</div>
    </div>

    <!-- Document Information -->
    <div class="document-info">
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Document Number</span>
                <span class="info-value">${document.document_number}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Document Type</span>
                <span class="info-value">${document.document_type}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Category</span>
                <span class="info-value">${document.category}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Status</span>
                <span class="status-badge status-${document.status.toLowerCase()}">${document.status}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Created By</span>
                <span class="info-value">${document.created_by_user?.first_name || ''} ${document.created_by_user?.last_name || ''}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Created Date</span>
                <span class="info-value">${formatDate(document.created_at)}</span>
            </div>
            ${document.template ? `
            <div class="info-item">
                <span class="info-label">Template Used</span>
                <span class="info-value">${document.template.template_name}</span>
            </div>
            ` : ''}
            ${document.expiry_date ? `
            <div class="info-item">
                <span class="info-label">Expiry Date</span>
                <span class="info-value">${formatDate(document.expiry_date)}</span>
            </div>
            ` : ''}
        </div>
    </div>

    <!-- Document Content -->
    <div class="content">
        ${document.content || 'No content available.'}
    </div>

    <!-- Variables (if any) -->
    ${Object.keys(document.variables || {}).length > 0 ? `
    <div class="document-info">
        <h3 style="margin-top: 0; color: #1f2937;">Document Variables</h3>
        <div class="info-grid">
            ${Object.entries(document.variables).map(([key, value]) => `
                <div class="info-item">
                    <span class="info-label">${key}</span>
                    <span class="info-value">${value}</span>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <!-- Tags (if any) -->
    ${document.tags && document.tags.length > 0 ? `
    <div style="margin: 20px 0;">
        <span class="info-label">Tags:</span>
        ${document.tags.map((tag: string) => `
            <span style="display: inline-block; background: #e5e7eb; padding: 2px 8px; border-radius: 12px; margin: 2px; font-size: 12px;">${tag}</span>
        `).join('')}
    </div>
    ` : ''}

    <!-- Signature Section -->
    ${['CONTRACT', 'PROPOSAL', 'CERTIFICATE'].includes(document.document_type) ? `
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-label">Prepared By</div>
        </div>
        <div class="signature-box">
            <div class="signature-label">Approved By</div>
        </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
        <p>This document was generated electronically by BlackGoldUnited ERP System</p>
        <p>Generated on ${new Date().toLocaleString()} | Document ID: ${document.id}</p>
        ${document.latest_version ? `<p>Version: ${document.latest_version[0]?.version_number || '1.0'}</p>` : ''}
    </div>
</body>
</html>
  `
}