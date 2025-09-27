import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// GET /api/finance/reports - Generate financial reports
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, 'finance', 'GET')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const reportType = searchParams.get('reportType') || 'balance_sheet'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const format = searchParams.get('format') || 'json'

    // Validate report type
    const validReportTypes = [
      'balance_sheet',
      'income_statement',
      'cash_flow',
      'trial_balance',
      'general_ledger',
      'account_summary',
      'financial_position'
    ]

    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json({
        error: 'Invalid report type',
        valid_types: validReportTypes
      }, { status: 400 })
    }

    let reportData: any = {}
    const reportDate = endDate

    switch (reportType) {
      case 'balance_sheet':
        reportData = await generateBalanceSheet(supabase, reportDate)
        break
      case 'income_statement':
        reportData = await generateIncomeStatement(supabase, startDate || getFinancialYearStart(reportDate), reportDate)
        break
      case 'cash_flow':
        reportData = await generateCashFlow(supabase, startDate || getFinancialYearStart(reportDate), reportDate)
        break
      case 'trial_balance':
        reportData = await generateTrialBalance(supabase, reportDate)
        break
      case 'general_ledger':
        reportData = await generateGeneralLedger(supabase, startDate || getFinancialYearStart(reportDate), reportDate)
        break
      case 'account_summary':
        reportData = await generateAccountSummary(supabase, startDate || getFinancialYearStart(reportDate), reportDate)
        break
      case 'financial_position':
        reportData = await generateFinancialPosition(supabase, reportDate)
        break
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: authResult.user.id,
      action: 'GENERATE_FINANCIAL_REPORT',
      entity_type: 'financial_report',
      details: {
        report_type: reportType,
        start_date: startDate,
        end_date: reportDate,
        format
      }
    })

    // Handle CSV format
    if (format === 'csv') {
      const csv = convertReportToCSV(reportData, reportType)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}_${reportDate}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      report_type: reportType,
      report_date: reportDate,
      start_date: startDate,
      data: reportData
    })

  } catch (error) {
    console.error('Financial report generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Balance Sheet Report
async function generateBalanceSheet(supabase: any, asOfDate: string) {
  // Get all accounts with their balances
  const { data: accounts } = await supabase
    .from('chart_of_accounts')
    .select(`
      *,
      journal_lines:journal_entry_lines(
        debit_amount,
        credit_amount,
        journal_entry:journal_entries!inner(entry_date)
      )
    `)
    .eq('is_active', true)
    .lte('journal_lines.journal_entry.entry_date', asOfDate)

  const balanceSheet = {
    assets: { current: [] as any[], non_current: [] as any[], total: 0 },
    liabilities: { current: [] as any[], non_current: [] as any[], total: 0 },
    equity: { items: [] as any[], total: 0 },
    total_assets: 0,
    total_liabilities_equity: 0
  }

  accounts?.forEach((account: any) => {
    const balance = calculateAccountBalance(account)
    if (balance === 0) return

    const accountData = {
      account_code: account.account_code,
      account_name: account.account_name,
      balance: balance
    }

    switch (account.account_type) {
      case 'ASSET':
        // Classify as current or non-current based on account name/code
        if (isCurrentAsset(account.account_name, account.account_code)) {
          balanceSheet.assets.current.push(accountData)
        } else {
          balanceSheet.assets.non_current.push(accountData)
        }
        balanceSheet.assets.total += balance
        break
      case 'LIABILITY':
        if (isCurrentLiability(account.account_name, account.account_code)) {
          balanceSheet.liabilities.current.push(accountData)
        } else {
          balanceSheet.liabilities.non_current.push(accountData)
        }
        balanceSheet.liabilities.total += balance
        break
      case 'EQUITY':
        balanceSheet.equity.items.push(accountData)
        balanceSheet.equity.total += balance
        break
    }
  })

  balanceSheet.total_assets = balanceSheet.assets.total
  balanceSheet.total_liabilities_equity = balanceSheet.liabilities.total + balanceSheet.equity.total

  return balanceSheet
}

// Income Statement Report
async function generateIncomeStatement(supabase: any, startDate: string, endDate: string) {
  const { data: accounts } = await supabase
    .from('chart_of_accounts')
    .select(`
      *,
      journal_lines:journal_entry_lines(
        debit_amount,
        credit_amount,
        journal_entry:journal_entries!inner(entry_date)
      )
    `)
    .eq('is_active', true)
    .in('account_type', ['REVENUE', 'EXPENSE'])
    .gte('journal_lines.journal_entry.entry_date', startDate)
    .lte('journal_lines.journal_entry.entry_date', endDate)

  const incomeStatement = {
    revenue: { items: [] as any[], total: 0 },
    expenses: { operating: [] as any[], non_operating: [] as any[], total: 0 },
    gross_profit: 0,
    operating_income: 0,
    net_income: 0
  }

  accounts?.forEach((account: any) => {
    const balance = calculateAccountBalance(account)
    if (balance === 0) return

    const accountData = {
      account_code: account.account_code,
      account_name: account.account_name,
      balance: Math.abs(balance)
    }

    if (account.account_type === 'REVENUE') {
      incomeStatement.revenue.items.push(accountData)
      incomeStatement.revenue.total += Math.abs(balance)
    } else if (account.account_type === 'EXPENSE') {
      if (isOperatingExpense(account.account_name, account.account_code)) {
        incomeStatement.expenses.operating.push(accountData)
      } else {
        incomeStatement.expenses.non_operating.push(accountData)
      }
      incomeStatement.expenses.total += Math.abs(balance)
    }
  })

  incomeStatement.gross_profit = incomeStatement.revenue.total - getCostOfGoodsSold(incomeStatement.expenses.operating)
  incomeStatement.operating_income = incomeStatement.revenue.total - getOperatingExpenses(incomeStatement.expenses.operating)
  incomeStatement.net_income = incomeStatement.revenue.total - incomeStatement.expenses.total

  return incomeStatement
}

// Trial Balance Report
async function generateTrialBalance(supabase: any, asOfDate: string) {
  const { data: accounts } = await supabase
    .from('chart_of_accounts')
    .select(`
      *,
      journal_lines:journal_entry_lines(
        debit_amount,
        credit_amount,
        journal_entry:journal_entries!inner(entry_date)
      )
    `)
    .eq('is_active', true)
    .lte('journal_lines.journal_entry.entry_date', asOfDate)

  const trialBalance = {
    accounts: [] as any[],
    totals: { debits: 0, credits: 0 }
  }

  accounts?.forEach((account: any) => {
    const { totalDebits, totalCredits } = calculateAccountTotals(account)

    if (totalDebits > 0 || totalCredits > 0) {
      const accountData = {
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        debit_balance: totalDebits > totalCredits ? totalDebits - totalCredits : 0,
        credit_balance: totalCredits > totalDebits ? totalCredits - totalDebits : 0
      }

      trialBalance.accounts.push(accountData)
      trialBalance.totals.debits += accountData.debit_balance
      trialBalance.totals.credits += accountData.credit_balance
    }
  })

  return trialBalance
}

// Helper functions
function calculateAccountBalance(account: any): number {
  const { totalDebits, totalCredits } = calculateAccountTotals(account)

  // Normal balance calculation based on account type
  switch (account.account_type) {
    case 'ASSET':
    case 'EXPENSE':
      return totalDebits - totalCredits
    case 'LIABILITY':
    case 'EQUITY':
    case 'REVENUE':
      return totalCredits - totalDebits
    default:
      return 0
  }
}

function calculateAccountTotals(account: any): { totalDebits: number, totalCredits: number } {
  const totalDebits = account.journal_lines?.reduce((sum: number, line: any) =>
    sum + (line.debit_amount || 0), 0) || 0
  const totalCredits = account.journal_lines?.reduce((sum: number, line: any) =>
    sum + (line.credit_amount || 0), 0) || 0

  return { totalDebits, totalCredits }
}

function isCurrentAsset(accountName: string, accountCode: string): boolean {
  const currentAssetKeywords = ['cash', 'bank', 'receivable', 'inventory', 'prepaid', 'current']
  const name = accountName.toLowerCase()
  const code = accountCode.toLowerCase()

  return currentAssetKeywords.some(keyword => name.includes(keyword) || code.includes(keyword))
}

function isCurrentLiability(accountName: string, accountCode: string): boolean {
  const currentLiabilityKeywords = ['payable', 'accrued', 'current', 'short-term', 'wages', 'taxes']
  const name = accountName.toLowerCase()
  const code = accountCode.toLowerCase()

  return currentLiabilityKeywords.some(keyword => name.includes(keyword) || code.includes(keyword))
}

function isOperatingExpense(accountName: string, accountCode: string): boolean {
  const operatingKeywords = ['salary', 'rent', 'utilities', 'office', 'marketing', 'admin', 'cost of goods']
  const name = accountName.toLowerCase()
  const code = accountCode.toLowerCase()

  return operatingKeywords.some(keyword => name.includes(keyword) || code.includes(keyword))
}

function getCostOfGoodsSold(operatingExpenses: any[]): number {
  return operatingExpenses
    .filter(exp => exp.account_name.toLowerCase().includes('cost of goods'))
    .reduce((sum, exp) => sum + exp.balance, 0)
}

function getOperatingExpenses(operatingExpenses: any[]): number {
  return operatingExpenses
    .filter(exp => !exp.account_name.toLowerCase().includes('cost of goods'))
    .reduce((sum, exp) => sum + exp.balance, 0)
}

function getFinancialYearStart(date: string): string {
  const year = new Date(date).getFullYear()
  return `${year}-01-01` // Assuming calendar year
}

// Placeholder functions for other report types
async function generateCashFlow(supabase: any, startDate: string, endDate: string) {
  return { message: 'Cash flow report implementation coming soon' }
}

async function generateGeneralLedger(supabase: any, startDate: string, endDate: string) {
  return { message: 'General ledger report implementation coming soon' }
}

async function generateAccountSummary(supabase: any, startDate: string, endDate: string) {
  return { message: 'Account summary report implementation coming soon' }
}

async function generateFinancialPosition(supabase: any, asOfDate: string) {
  return { message: 'Financial position report implementation coming soon' }
}

function convertReportToCSV(reportData: any, reportType: string): string {
  // Basic CSV conversion - would need specific formatting for each report type
  return `Report Type,${reportType}\nGenerated Date,${new Date().toISOString()}\n\nData:\n${JSON.stringify(reportData)}`
}