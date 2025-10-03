# Sales Module - User Guide

**BlackGoldUnited ERP System**
**Version**: 1.0
**Last Updated**: October 3, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Managing Invoices](#managing-invoices)
4. [Request for Quotation (RFQ)](#request-for-quotation-rfq)
5. [Credit Notes & Refunds](#credit-notes--refunds)
6. [Recurring Invoices](#recurring-invoices)
7. [Payment Management](#payment-management)
8. [Reports & Analytics](#reports--analytics)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Sales Module is your central hub for managing all sales operations including invoicing, quotations, payments, and customer interactions.

### Key Features

✅ **Invoice Management** - Create, edit, and track sales invoices
✅ **RFQ Processing** - Handle requests for quotation and convert to invoices
✅ **Payment Tracking** - Record and monitor client payments
✅ **Credit Notes** - Issue refunds and credit notes
✅ **Recurring Billing** - Automate periodic invoicing
✅ **Sales Reports** - Comprehensive sales analytics

### Who Can Access

| Role | Access Level | Permissions |
|------|--------------|-------------|
| Management | Full Access | Create, Read, Update, Delete |
| Procurement & BD | Full Access | Create, Read, Update, Delete |
| Finance Team | Read-Only | View invoices and payments |
| Admin & HR | Read-Only | View only |
| IMS & QHSE | No Access | - |

---

## Getting Started

### Accessing the Sales Module

1. Log in to BlackGoldUnited ERP
2. Click **"Sales"** in the left sidebar
3. You'll see the Sales Dashboard with key metrics:
   - Total Sales (current month)
   - Active Clients
   - Pending Invoices
   - Recent Activity

### Dashboard Overview

The Sales Dashboard provides:
- **Quick Stats**: Total sales, pending invoices, active clients
- **Recent Invoices**: Last 10 invoices with status
- **Top Clients**: Best clients by revenue
- **Sales Trend**: Monthly sales chart (last 12 months)

---

## Managing Invoices

### Creating a New Invoice

**Step 1: Navigate to Invoices**
1. Click **Sales** → **Invoices** in the sidebar
2. Click the **"New Invoice"** button (top right)

**Step 2: Select Client**
1. Search for the client by company name
2. Select from the dropdown
3. Client details auto-populate (address, payment terms, etc.)

**Step 3: Invoice Details**
- **Invoice Date**: Defaults to today (editable)
- **Due Date**: Auto-calculated based on payment terms
- **PO Number** (optional): Client's purchase order reference
- **Notes** (optional): Additional information

**Step 4: Add Line Items**
For each product/service:
1. Click **"Add Item"**
2. Select product from dropdown
3. Enter quantity
4. Unit price auto-fills (editable)
5. Tax automatically calculated
6. Line total shows instantly

**Step 5: Review & Save**
- Check invoice totals (Subtotal, Tax, Total)
- Click **"Save as Draft"** or **"Send to Client"**

### Invoice Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| 🟡 Draft | Not yet sent | Edit or Send |
| 🔵 Sent | Delivered to client | Wait for payment |
| 🟢 Paid | Fully paid | Archive |
| 🔴 Overdue | Past due date | Follow up |
| ⚫ Cancelled | Void invoice | None |

### Editing an Invoice

**Draft Invoices**:
1. Find the invoice (Status: Draft)
2. Click **"Edit"**
3. Make changes
4. Click **"Update Invoice"**

**Sent Invoices**:
⚠️ You can only edit draft invoices. Once sent, create a Credit Note for corrections.

### Sending an Invoice

**Option 1: Email (Automatic)**
1. Open the invoice
2. Click **"Send to Client"**
3. System sends email with PDF attachment
4. Status changes to "Sent"

**Option 2: Download PDF**
1. Open the invoice
2. Click **"Download PDF"**
3. Print or send manually
4. Manually change status to "Sent"

### Cancelling an Invoice

1. Open the invoice
2. Click **"Actions"** → **"Cancel Invoice"**
3. Confirm cancellation
4. Status changes to "Cancelled"

⚠️ **Note**: Cancelled invoices cannot be restored. Create a new invoice instead.

---

## Request for Quotation (RFQ)

### Creating an RFQ

**Step 1: Navigate to RFQ**
1. Click **Sales** → **RFQ** in the sidebar
2. Click **"New RFQ"**

**Step 2: Fill RFQ Details**
- **Client**: Select client
- **Valid Until**: Quotation expiry date
- **Terms & Conditions**: Add quotation terms
- **Line Items**: Add products with quantities and prices

**Step 3: Send Quotation**
1. Click **"Save as Draft"** or **"Send to Client"**
2. System generates quote number (QTE-YYYYMMDD-NNNN)
3. Client receives email with PDF

### Converting RFQ to Invoice

**When Client Accepts Quotation**:
1. Open the RFQ
2. Click **"Convert to Invoice"**
3. Review pre-filled invoice details
4. Click **"Create Invoice"**
5. RFQ status → "Converted"
6. New invoice created automatically

---

## Credit Notes & Refunds

### Issuing a Credit Note

**When to Use**: Product returns, pricing errors, customer disputes

**Step 1: Navigate to Credit Notes**
1. Click **Sales** → **Credit Notes**
2. Click **"New Credit Note"**

**Step 2: Select Invoice**
1. Search for the original invoice
2. Select from list
3. Invoice details auto-populate

**Step 3: Credit Note Details**
- **Reason**: Select reason (Return, Discount, Error)
- **Amount**: Enter credit amount
- **Notes**: Explain the credit

**Step 4: Approve & Send**
1. Review details
2. Click **"Issue Credit Note"**
3. System generates number (CN-YYYYMMDD-NNNN)
4. Client receives notification

### Processing Refunds

**Step 1: Create Refund Receipt**
1. Click **Sales** → **Refunds**
2. Click **"New Refund"**

**Step 2: Refund Details**
- **Invoice**: Select invoice
- **Amount**: Cannot exceed invoice total
- **Method**: Cash, Bank Transfer, Check, Card
- **Reference**: Transaction/check number

**Step 3: Complete Refund**
1. Click **"Process Refund"**
2. Invoice balance updated
3. Client notified

---

## Recurring Invoices

### Creating a Recurring Invoice

**Use Case**: Monthly subscriptions, annual contracts, periodic services

**Step 1: Navigate to Recurring**
1. Click **Sales** → **Recurring Invoices**
2. Click **"New Recurring Invoice"**

**Step 2: Set Up Template**
- **Client**: Select client
- **Line Items**: Add standard products/services
- **Frequency**: Weekly, Monthly, Quarterly, Yearly
- **Start Date**: First invoice date
- **End Date** (optional): When to stop

**Step 3: Activate**
1. Click **"Activate Recurring Invoice"**
2. System automatically generates invoices on schedule
3. Status shows next billing date

### Managing Recurring Invoices

**Pause Subscription**:
1. Open recurring invoice
2. Click **"Pause"**
3. No new invoices generated until resumed

**Edit Recurring Invoice**:
1. Open recurring invoice
2. Click **"Edit Template"**
3. Changes apply to future invoices only

**Cancel Recurring Invoice**:
1. Open recurring invoice
2. Click **"Cancel"**
3. No more invoices generated

---

## Payment Management

### Recording a Payment

**Step 1: Navigate to Payments**
1. Click **Sales** → **Payments**
2. Click **"Record Payment"**

**Step 2: Payment Details**
- **Client**: Select client
- **Invoice(s)**: Select one or more invoices
- **Amount**: Enter payment amount
- **Method**: Cash, Bank Transfer, Check, Card, Other
- **Reference**: Check number or transaction ID
- **Date**: Payment date

**Step 3: Save Payment**
1. Click **"Record Payment"**
2. Invoice balance updated automatically
3. Status changes to "Paid" when fully paid

### Partial Payments

**Scenario**: Client pays $500 on a $1000 invoice

1. Record payment for $500
2. Invoice shows:
   - Total: $1000
   - Paid: $500
   - Balance: $500
   - Status: "Partially Paid"
3. Record remaining $500 when received
4. Status → "Paid"

### Payment History

**View All Payments**:
1. Click **Sales** → **Payments**
2. See all recorded payments
3. Filter by client, date, or payment method

**View Client Payment History**:
1. Go to **Clients** → Select client
2. Scroll to "Payment History"
3. See all payments from this client

---

## Reports & Analytics

### Sales Report

**Access**: Click **Reports** → **Sales Report**

**Key Metrics**:
- Total Sales (current period)
- Total Paid
- Total Outstanding
- Invoice Count
- Average Invoice Value

**Charts**:
- Sales by Status (pie chart)
- Monthly Sales Trend (line chart)
- Top 10 Clients (bar chart)

### Exporting Reports

**Export to Excel**:
1. Open any report
2. Click **"Export to Excel"**
3. File downloads automatically

**Export to PDF**:
1. Open any report
2. Click **"Export to PDF"**
3. Print-friendly format

**Custom Date Range**:
1. Select **"Custom"** from date filter
2. Choose start and end dates
3. Report updates automatically

---

## Best Practices

### Invoice Numbering

✅ **DO**: Use the auto-generated invoice numbers (INV-YYYYMMDD-NNNN)
❌ **DON'T**: Manually edit invoice numbers (breaks sequence)

### Payment Terms

✅ **DO**: Set standard payment terms in client profile (Net 30, Net 60)
✅ **DO**: Honor the payment terms consistently
❌ **DON'T**: Change payment terms on individual invoices without agreement

### Credit Notes

✅ **DO**: Issue credit notes for corrections
✅ **DO**: Document the reason clearly
❌ **DON'T**: Delete or edit sent invoices

### Data Entry

✅ **DO**: Save drafts frequently
✅ **DO**: Double-check amounts before sending
✅ **DO**: Verify client details
❌ **DON'T**: Send invoices with incorrect client information

---

## Troubleshooting

### Common Issues

**Problem**: Cannot create invoice
- **Solution**: Check that client is active and has all required fields

**Problem**: Email not sending
- **Solution**: Verify client email address is valid
- **Solution**: Check system email settings (Admin only)

**Problem**: Wrong tax calculation
- **Solution**: Verify product tax rate in product settings
- **Solution**: Check client tax exemption status

**Problem**: Cannot edit invoice
- **Solution**: Only draft invoices can be edited
- **Solution**: Issue a credit note instead

**Problem**: Payment not reflecting
- **Solution**: Wait a few seconds for system to update
- **Solution**: Refresh the page
- **Solution**: Verify payment was saved (check Payments page)

### Getting Help

📧 **Email Support**: support@blackgoldunited.com
📱 **Phone**: +1 (555) 123-4567
💬 **Live Chat**: Available during business hours (bottom right corner)

---

## Quick Reference Card

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New Invoice | `Ctrl + N` (when on Invoices page) |
| Save | `Ctrl + S` |
| Search | `Ctrl + F` |

### Status Colors

- 🟡 Yellow = Draft
- 🔵 Blue = Sent
- 🟢 Green = Paid
- 🔴 Red = Overdue
- ⚫ Grey = Cancelled

### Common Workflows

**Standard Sale**:
1. Create Invoice → 2. Send to Client → 3. Record Payment → 4. Done

**Quotation to Sale**:
1. Create RFQ → 2. Send to Client → 3. Convert to Invoice → 4. Record Payment

**Refund Process**:
1. Issue Credit Note → 2. Process Refund → 3. Done

---

## Appendix: Field Definitions

| Field | Description | Required | Format |
|-------|-------------|----------|--------|
| Invoice Number | Unique identifier | Auto | INV-YYYYMMDD-NNNN |
| Client | Customer receiving invoice | ✅ | Dropdown selection |
| Invoice Date | Date of invoice | ✅ | YYYY-MM-DD |
| Due Date | Payment deadline | ✅ | YYYY-MM-DD |
| PO Number | Client's purchase order | ❌ | Text |
| Subtotal | Sum before tax | Auto | Currency |
| Tax Amount | Calculated tax | Auto | Currency |
| Total Amount | Final amount | Auto | Currency |
| Paid Amount | Amount received | Manual | Currency |
| Balance | Remaining amount | Auto | Currency |

---

**Need more help?** Contact your system administrator or visit our knowledge base.

**Document Version**: 1.0
**Last Updated**: October 3, 2025
**Feedback**: Send feedback to docs@blackgoldunited.com
