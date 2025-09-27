import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/payroll/pay-slips/[id]/pdf - Generate PDF for pay slip
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'payroll', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = params
    const supabase = await createClient()

    // Fetch pay slip with full details
    const { data: paySlip, error } = await supabase
      .from('pay_slips')
      .select(`
        *,
        employee:employees(
          id,
          employee_number,
          first_name,
          last_name,
          email,
          phone,
          hire_date,
          address,
          department:departments(id, name),
          designation:designations(id, title)
        ),
        pay_run:pay_runs(
          id,
          pay_run_number,
          pay_date,
          pay_period_start,
          pay_period_end
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pay slip not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch pay slip' }, { status: 500 })
    }

    // Generate HTML template for PDF
    const htmlContent = generatePaySlipHTML(paySlip)

    // For now, return the HTML content with proper headers
    // In a production environment, you would use a PDF generation library like puppeteer or jsPDF
    const fileName = `payslip_${paySlip.employee.employee_number}_${paySlip.pay_period_start.replace(/-/g, '')}.html`

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'GENERATE_PAY_SLIP_PDF',
      entity_type: 'pay_slip',
      entity_id: id,
      details: {
        employee_name: `${paySlip.employee.first_name} ${paySlip.employee.last_name}`,
        pay_period: `${paySlip.pay_period_start} to ${paySlip.pay_period_end}`
      }
    })

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })

  } catch (error) {
    console.error('Pay slip PDF generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generatePaySlipHTML(paySlip: any): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

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
    <title>Pay Slip - ${paySlip.employee.first_name} ${paySlip.employee.last_name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 1px solid #ddd;
        }
        .header {
            background: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .company-subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        .pay-slip-title {
            background: #f8fafc;
            padding: 15px 20px;
            border-bottom: 1px solid #e2e8f0;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
        }
        .info-section {
            display: flex;
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-left, .info-right {
            flex: 1;
        }
        .info-row {
            display: flex;
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            width: 140px;
            color: #4b5563;
        }
        .info-value {
            color: #1f2937;
        }
        .earnings-deductions {
            display: flex;
            border-bottom: 1px solid #e2e8f0;
        }
        .earnings, .deductions {
            flex: 1;
            padding: 20px;
        }
        .earnings {
            border-right: 1px solid #e2e8f0;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 2px solid #2563eb;
        }
        .item-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .item-name {
            color: #4b5563;
        }
        .item-amount {
            font-weight: bold;
            color: #1f2937;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            margin-top: 10px;
            border-top: 2px solid #e2e8f0;
            font-weight: bold;
            font-size: 16px;
        }
        .earnings .total-row {
            color: #059669;
        }
        .deductions .total-row {
            color: #dc2626;
        }
        .net-pay {
            background: #f0f9ff;
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
        }
        .net-pay-label {
            font-size: 18px;
            color: #1e293b;
            margin-bottom: 5px;
        }
        .net-pay-amount {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
        }
        .footer {
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            background: #f9fafb;
        }
        .signature-section {
            display: flex;
            justify-content: space-between;
            padding: 30px 20px;
            border-bottom: 1px solid #e2e8f0;
        }
        .signature-box {
            text-align: center;
            width: 200px;
        }
        .signature-line {
            border-top: 1px solid #9ca3af;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 12px;
            color: #6b7280;
        }
        @media print {
            body { margin: 0; }
            .container { border: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-name">BlackGoldUnited</div>
            <div class="company-subtitle">Employee Pay Slip</div>
        </div>

        <!-- Pay Slip Title -->
        <div class="pay-slip-title">
            Pay Slip for ${formatDate(paySlip.pay_period_start)} - ${formatDate(paySlip.pay_period_end)}
        </div>

        <!-- Employee Information -->
        <div class="info-section">
            <div class="info-left">
                <div class="info-row">
                    <span class="info-label">Employee Name:</span>
                    <span class="info-value">${paySlip.employee.first_name} ${paySlip.employee.last_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Employee No:</span>
                    <span class="info-value">${paySlip.employee.employee_number}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Department:</span>
                    <span class="info-value">${paySlip.employee.department?.name || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Designation:</span>
                    <span class="info-value">${paySlip.employee.designation?.title || 'N/A'}</span>
                </div>
            </div>
            <div class="info-right">
                <div class="info-row">
                    <span class="info-label">Pay Date:</span>
                    <span class="info-value">${paySlip.pay_run?.pay_date ? formatDate(paySlip.pay_run.pay_date) : 'TBD'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Working Days:</span>
                    <span class="info-value">${paySlip.working_days}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Pay Run:</span>
                    <span class="info-value">${paySlip.pay_run?.pay_run_number || 'Individual'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">${paySlip.status}</span>
                </div>
            </div>
        </div>

        <!-- Earnings and Deductions -->
        <div class="earnings-deductions">
            <div class="earnings">
                <div class="section-title">EARNINGS</div>
                ${paySlip.earnings.map((earning: any) => `
                    <div class="item-row">
                        <span class="item-name">${earning.component_name}</span>
                        <span class="item-amount">${formatCurrency(earning.amount)}</span>
                    </div>
                `).join('')}
                <div class="total-row">
                    <span>TOTAL EARNINGS</span>
                    <span>${formatCurrency(paySlip.gross_pay)}</span>
                </div>
            </div>

            <div class="deductions">
                <div class="section-title">DEDUCTIONS</div>
                ${paySlip.deductions.map((deduction: any) => `
                    <div class="item-row">
                        <span class="item-name">${deduction.component_name}</span>
                        <span class="item-amount">${formatCurrency(deduction.amount)}</span>
                    </div>
                `).join('')}
                <div class="total-row">
                    <span>TOTAL DEDUCTIONS</span>
                    <span>${formatCurrency(paySlip.total_deductions)}</span>
                </div>
            </div>
        </div>

        <!-- Net Pay -->
        <div class="net-pay">
            <div class="net-pay-label">NET PAY</div>
            <div class="net-pay-amount">${formatCurrency(paySlip.net_pay)}</div>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">Employee Signature</div>
            </div>
            <div class="signature-box">
                <div class="signature-line">HR Signature</div>
            </div>
            <div class="signature-box">
                <div class="signature-line">Authorized Signature</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>This is a computer-generated pay slip and does not require a signature.</p>
            <p>Generated on ${new Date().toLocaleDateString()} | BlackGoldUnited ERP System</p>
            ${paySlip.approval_notes ? `<p><strong>Notes:</strong> ${paySlip.approval_notes}</p>` : ''}
        </div>
    </div>
</body>
</html>
  `
}