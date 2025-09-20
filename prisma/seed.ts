import { PrismaClient, UserRole, AccessLevel, AccountType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default permissions based on access control matrix
  const permissions = [
    // Management - Full access to all
    { role: UserRole.MANAGEMENT, module: 'administration', action: 'create', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'administration', action: 'read', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'administration', action: 'update', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'administration', action: 'delete', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'finance', action: 'create', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'finance', action: 'read', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'finance', action: 'update', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'finance', action: 'delete', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'procurement', action: 'create', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'procurement', action: 'read', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'procurement', action: 'update', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'procurement', action: 'delete', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'projects_operations', action: 'create', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'projects_operations', action: 'read', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'projects_operations', action: 'update', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'projects_operations', action: 'delete', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'ims_compliance', action: 'create', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'ims_compliance', action: 'read', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'ims_compliance', action: 'update', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'ims_compliance', action: 'delete', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'correspondence', action: 'create', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'correspondence', action: 'read', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'correspondence', action: 'update', access: AccessLevel.FULL },
    { role: UserRole.MANAGEMENT, module: 'correspondence', action: 'delete', access: AccessLevel.FULL },

    // Finance Team - Full access to Finance, Read-only to Procurement
    { role: UserRole.FINANCE_TEAM, module: 'administration', action: 'read', access: AccessLevel.READ },
    { role: UserRole.FINANCE_TEAM, module: 'finance', action: 'create', access: AccessLevel.FULL },
    { role: UserRole.FINANCE_TEAM, module: 'finance', action: 'read', access: AccessLevel.FULL },
    { role: UserRole.FINANCE_TEAM, module: 'finance', action: 'update', access: AccessLevel.FULL },
    { role: UserRole.FINANCE_TEAM, module: 'finance', action: 'delete', access: AccessLevel.FULL },
    { role: UserRole.FINANCE_TEAM, module: 'procurement', action: 'read', access: AccessLevel.READ },
    { role: UserRole.FINANCE_TEAM, module: 'projects_operations', action: 'read', access: AccessLevel.READ },
    { role: UserRole.FINANCE_TEAM, module: 'ims_compliance', action: 'read', access: AccessLevel.NONE },
    { role: UserRole.FINANCE_TEAM, module: 'correspondence', action: 'read', access: AccessLevel.NONE },

    // Procurement/BD Team - Full access to Procurement & Projects, Read-only to Finance
    { role: UserRole.PROCUREMENT_BD, module: 'administration', action: 'read', access: AccessLevel.NONE },
    { role: UserRole.PROCUREMENT_BD, module: 'finance', action: 'read', access: AccessLevel.READ },
    { role: UserRole.PROCUREMENT_BD, module: 'procurement', action: 'create', access: AccessLevel.FULL },
    { role: UserRole.PROCUREMENT_BD, module: 'procurement', action: 'read', access: AccessLevel.FULL },
    { role: UserRole.PROCUREMENT_BD, module: 'procurement', action: 'update', access: AccessLevel.FULL },
    { role: UserRole.PROCUREMENT_BD, module: 'procurement', action: 'delete', access: AccessLevel.FULL },
    { role: UserRole.PROCUREMENT_BD, module: 'projects_operations', action: 'create', access: AccessLevel.FULL },
    { role: UserRole.PROCUREMENT_BD, module: 'projects_operations', action: 'read', access: AccessLevel.FULL },
    { role: UserRole.PROCUREMENT_BD, module: 'projects_operations', action: 'update', access: AccessLevel.FULL },
    { role: UserRole.PROCUREMENT_BD, module: 'projects_operations', action: 'delete', access: AccessLevel.FULL },
    { role: UserRole.PROCUREMENT_BD, module: 'ims_compliance', action: 'read', access: AccessLevel.NONE },
    { role: UserRole.PROCUREMENT_BD, module: 'correspondence', action: 'read', access: AccessLevel.READ },

    // Admin/HR - Full access to Admin, Limited read-only to others
    { role: UserRole.ADMIN_HR, module: 'administration', action: 'create', access: AccessLevel.FULL },
    { role: UserRole.ADMIN_HR, module: 'administration', action: 'read', access: AccessLevel.FULL },
    { role: UserRole.ADMIN_HR, module: 'administration', action: 'update', access: AccessLevel.FULL },
    { role: UserRole.ADMIN_HR, module: 'administration', action: 'delete', access: AccessLevel.FULL },
    { role: UserRole.ADMIN_HR, module: 'finance', action: 'read', access: AccessLevel.NONE },
    { role: UserRole.ADMIN_HR, module: 'procurement', action: 'read', access: AccessLevel.NONE },
    { role: UserRole.ADMIN_HR, module: 'projects_operations', action: 'read', access: AccessLevel.NONE },
    { role: UserRole.ADMIN_HR, module: 'ims_compliance', action: 'read', access: AccessLevel.NONE },
    { role: UserRole.ADMIN_HR, module: 'correspondence', action: 'read', access: AccessLevel.READ },

    // IMS/QHSE Officer - Full access to IMS/Compliance, Limited access to Operations
    { role: UserRole.IMS_QHSE, module: 'administration', action: 'read', access: AccessLevel.NONE },
    { role: UserRole.IMS_QHSE, module: 'finance', action: 'read', access: AccessLevel.NONE },
    { role: UserRole.IMS_QHSE, module: 'procurement', action: 'read', access: AccessLevel.NONE },
    { role: UserRole.IMS_QHSE, module: 'projects_operations', action: 'read', access: AccessLevel.READ },
    { role: UserRole.IMS_QHSE, module: 'ims_compliance', action: 'create', access: AccessLevel.FULL },
    { role: UserRole.IMS_QHSE, module: 'ims_compliance', action: 'read', access: AccessLevel.FULL },
    { role: UserRole.IMS_QHSE, module: 'ims_compliance', action: 'update', access: AccessLevel.FULL },
    { role: UserRole.IMS_QHSE, module: 'ims_compliance', action: 'delete', access: AccessLevel.FULL },
    { role: UserRole.IMS_QHSE, module: 'correspondence', action: 'read', access: AccessLevel.READ },
  ]

  // Create permissions
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { role_module_action: { role: permission.role, module: permission.module, action: permission.action } },
      update: {},
      create: permission,
    })
  }

  // Create default company info
  await prisma.companyInfo.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'Black Gold United',
      currency: 'USD',
      fiscalYearStart: 1,
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24',
    },
  })

  // Create default departments
  const departments = [
    { name: 'Management', description: 'Executive Management' },
    { name: 'Finance', description: 'Finance and Accounting' },
    { name: 'Procurement', description: 'Procurement and Business Development' },
    { name: 'Administration', description: 'Human Resources and Administration' },
    { name: 'QHSE', description: 'Quality, Health, Safety and Environment' },
    { name: 'Operations', description: 'Operations and Projects' },
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    })
  }

  // Create default designations
  const designations = [
    { title: 'Managing Director', level: 1 },
    { title: 'General Manager', level: 2 },
    { title: 'Manager', level: 3 },
    { title: 'Assistant Manager', level: 4 },
    { title: 'Senior Officer', level: 5 },
    { title: 'Officer', level: 6 },
    { title: 'Assistant', level: 7 },
  ]

  for (const designation of designations) {
    await prisma.designation.upsert({
      where: { title: designation.title },
      update: {},
      create: designation,
    })
  }

  // Create default employment types
  const employmentTypes = [
    { typeName: 'FULL_TIME', description: 'Full-time permanent employee' },
    { typeName: 'PART_TIME', description: 'Part-time employee' },
    { typeName: 'CONTRACT', description: 'Contract employee' },
    { typeName: 'INTERN', description: 'Intern' },
    { typeName: 'CONSULTANT', description: 'Consultant' },
  ]

  for (const empType of employmentTypes) {
    await prisma.employmentType.upsert({
      where: { typeName: empType.typeName },
      update: {},
      create: empType,
    })
  }

  // Create default employee levels
  const employeeLevels = [
    { levelName: 'Executive', minSalary: 100000, maxSalary: 500000 },
    { levelName: 'Senior Management', minSalary: 60000, maxSalary: 150000 },
    { levelName: 'Middle Management', minSalary: 40000, maxSalary: 80000 },
    { levelName: 'Junior Management', minSalary: 25000, maxSalary: 50000 },
    { levelName: 'Senior Staff', minSalary: 20000, maxSalary: 35000 },
    { levelName: 'Staff', minSalary: 15000, maxSalary: 25000 },
    { levelName: 'Entry Level', minSalary: 10000, maxSalary: 18000 },
  ]

  for (const level of employeeLevels) {
    await prisma.employeeLevel.upsert({
      where: { levelName: level.levelName },
      update: {},
      create: level,
    })
  }

  // Create default expense categories
  const expenseCategories = [
    { name: 'Office Supplies', description: 'General office supplies and stationery' },
    { name: 'Travel', description: 'Business travel expenses' },
    { name: 'Utilities', description: 'Electricity, water, internet, phone' },
    { name: 'Rent', description: 'Office and facility rent' },
    { name: 'Marketing', description: 'Marketing and advertising expenses' },
    { name: 'Training', description: 'Employee training and development' },
    { name: 'Equipment', description: 'Office equipment and hardware' },
    { name: 'Professional Services', description: 'Legal, consulting, and professional fees' },
  ]

  for (const category of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  // Create default income categories
  const incomeCategories = [
    { name: 'Sales Revenue', description: 'Revenue from sales of products and services' },
    { name: 'Service Revenue', description: 'Revenue from service contracts' },
    { name: 'Investment Income', description: 'Income from investments' },
    { name: 'Other Income', description: 'Miscellaneous income' },
  ]

  for (const category of incomeCategories) {
    await prisma.incomeCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  // Create default leave types
  const leaveTypes = [
    { name: 'Annual Leave', maxDays: 30, carryForward: true },
    { name: 'Sick Leave', maxDays: 15, carryForward: false },
    { name: 'Maternity Leave', maxDays: 90, carryForward: false },
    { name: 'Paternity Leave', maxDays: 15, carryForward: false },
    { name: 'Emergency Leave', maxDays: 5, carryForward: false },
    { name: 'Study Leave', maxDays: 10, carryForward: false },
  ]

  for (const leaveType of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: leaveType.name },
      update: {},
      create: leaveType,
    })
  }

  // Create default shifts
  const shifts = [
    { name: 'Morning Shift', startTime: new Date('1970-01-01T08:00:00Z'), endTime: new Date('1970-01-01T17:00:00Z'), breakDuration: 60 },
    { name: 'Evening Shift', startTime: new Date('1970-01-01T14:00:00Z'), endTime: new Date('1970-01-01T23:00:00Z'), breakDuration: 60 },
    { name: 'Night Shift', startTime: new Date('1970-01-01T22:00:00Z'), endTime: new Date('1970-01-01T07:00:00Z'), breakDuration: 60 },
    { name: 'Flexible', startTime: new Date('1970-01-01T09:00:00Z'), endTime: new Date('1970-01-01T18:00:00Z'), breakDuration: 60 },
  ]

  for (const shift of shifts) {
    await prisma.shift.upsert({
      where: { name: shift.name },
      update: {},
      create: shift,
    })
  }

  // Create default salary components
  const salaryComponents = [
    { name: 'Basic Salary', type: 'EARNING', isFixed: true },
    { name: 'Housing Allowance', type: 'EARNING', isFixed: true },
    { name: 'Transport Allowance', type: 'EARNING', isFixed: true },
    { name: 'Medical Allowance', type: 'EARNING', isFixed: true },
    { name: 'Overtime', type: 'EARNING', isFixed: false },
    { name: 'Bonus', type: 'EARNING', isFixed: false },
    { name: 'Tax Deduction', type: 'DEDUCTION', isFixed: false, percentage: 5.0 },
    { name: 'Social Security', type: 'DEDUCTION', isFixed: false, percentage: 2.0 },
    { name: 'Loan Deduction', type: 'DEDUCTION', isFixed: false },
  ]

  for (const component of salaryComponents) {
    await prisma.salaryComponent.upsert({
      where: { name: component.name },
      update: {},
      create: component,
    })
  }

  // Create default chart of accounts
  const chartOfAccounts = [
    // Assets
    { accountCode: '1000', accountName: 'Current Assets', accountType: AccountType.ASSET },
    { accountCode: '1100', accountName: 'Cash and Cash Equivalents', accountType: AccountType.ASSET },
    { accountCode: '1200', accountName: 'Accounts Receivable', accountType: AccountType.ASSET },
    { accountCode: '1300', accountName: 'Inventory', accountType: AccountType.ASSET },
    { accountCode: '1500', accountName: 'Fixed Assets', accountType: AccountType.ASSET },

    // Liabilities
    { accountCode: '2000', accountName: 'Current Liabilities', accountType: AccountType.LIABILITY },
    { accountCode: '2100', accountName: 'Accounts Payable', accountType: AccountType.LIABILITY },
    { accountCode: '2200', accountName: 'Accrued Expenses', accountType: AccountType.LIABILITY },
    { accountCode: '2500', accountName: 'Long-term Liabilities', accountType: AccountType.LIABILITY },

    // Equity
    { accountCode: '3000', accountName: 'Owner\'s Equity', accountType: AccountType.EQUITY },
    { accountCode: '3100', accountName: 'Retained Earnings', accountType: AccountType.EQUITY },

    // Revenue
    { accountCode: '4000', accountName: 'Revenue', accountType: AccountType.REVENUE },
    { accountCode: '4100', accountName: 'Sales Revenue', accountType: AccountType.REVENUE },
    { accountCode: '4200', accountName: 'Service Revenue', accountType: AccountType.REVENUE },

    // Expenses
    { accountCode: '5000', accountName: 'Operating Expenses', accountType: AccountType.EXPENSE },
    { accountCode: '5100', accountName: 'Cost of Goods Sold', accountType: AccountType.EXPENSE },
    { accountCode: '5200', accountName: 'Salaries and Wages', accountType: AccountType.EXPENSE },
    { accountCode: '5300', accountName: 'Rent Expense', accountType: AccountType.EXPENSE },
    { accountCode: '5400', accountName: 'Utilities Expense', accountType: AccountType.EXPENSE },
  ]

  for (const account of chartOfAccounts) {
    await prisma.chartOfAccounts.upsert({
      where: { accountCode: account.accountCode },
      update: {},
      create: account,
    })
  }

  // Create default warehouses
  const warehouses = [
    { code: 'WH001', name: 'Main Warehouse', location: 'Primary Storage Facility' },
    { code: 'WH002', name: 'Secondary Warehouse', location: 'Backup Storage Facility' },
  ]

  for (const warehouse of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: warehouse.code },
      update: {},
      create: warehouse,
    })
  }

  // Create default product categories
  const categories = [
    { name: 'Raw Materials', description: 'Raw materials for production' },
    { name: 'Finished Goods', description: 'Finished products ready for sale' },
    { name: 'Services', description: 'Service offerings' },
    { name: 'Consumables', description: 'Office and operational consumables' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  // Create system settings
  const systemSettings = [
    { key: 'company_name', value: 'Black Gold United', category: 'company', description: 'Company name' },
    { key: 'default_currency', value: 'USD', category: 'finance', description: 'Default currency' },
    { key: 'tax_rate', value: '5.0', category: 'finance', description: 'Default tax rate percentage' },
    { key: 'invoice_prefix', value: 'INV', category: 'sales', description: 'Invoice number prefix' },
    { key: 'po_prefix', value: 'PO', category: 'purchase', description: 'Purchase order number prefix' },
    { key: 'employee_id_prefix', value: 'EMP', category: 'hr', description: 'Employee ID prefix' },
    { key: 'backup_retention_days', value: '90', category: 'system', description: 'Backup retention period in days' },
    { key: 'session_timeout_minutes', value: '30', category: 'security', description: 'Session timeout in minutes' },
  ]

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@blackgoldunited.com' },
    update: {},
    create: {
      email: 'admin@blackgoldunited.com',
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.MANAGEMENT,
      passwordHash: hashedPassword,
      emailVerified: true,
      isActive: true,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`🔑 Admin user created: admin@blackgoldunited.com / admin123`)
  console.log(`📊 Created ${permissions.length} permission entries`)
  console.log('🏢 Default company data and settings created')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })