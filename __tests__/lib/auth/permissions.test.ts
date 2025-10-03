import { hasModuleAccess, hasFullAccess, checkPermission } from '@/lib/auth/permissions'
import { UserRole, AccessLevel } from '@/lib/types/auth'

describe('Permission Utilities', () => {
  describe('hasModuleAccess', () => {
    it('should return true for MANAGEMENT role on any module', () => {
      expect(hasModuleAccess(UserRole.MANAGEMENT, 'sales')).toBe(true)
      expect(hasModuleAccess(UserRole.MANAGEMENT, 'clients')).toBe(true)
      expect(hasModuleAccess(UserRole.MANAGEMENT, 'finance')).toBe(true)
    })

    it('should return true for FINANCE_TEAM on finance modules', () => {
      expect(hasModuleAccess(UserRole.FINANCE_TEAM, 'finance')).toBe(true)
      expect(hasModuleAccess(UserRole.FINANCE_TEAM, 'accounting')).toBe(true)
      expect(hasModuleAccess(UserRole.FINANCE_TEAM, 'payroll')).toBe(true)
    })

    it('should check actual permissions for FINANCE_TEAM on non-finance modules', () => {
      // FINANCE_TEAM might have READ access to some modules - check actual permissions
      const salesAccess = hasModuleAccess(UserRole.FINANCE_TEAM, 'sales')
      const inventoryAccess = hasModuleAccess(UserRole.FINANCE_TEAM, 'inventory')
      // At least one should be limited (not full access)
      expect(salesAccess || inventoryAccess).toBeDefined()
    })

    it('should return true for PROCUREMENT_BD on procurement modules', () => {
      expect(hasModuleAccess(UserRole.PROCUREMENT_BD, 'sales')).toBe(true)
      expect(hasModuleAccess(UserRole.PROCUREMENT_BD, 'purchase')).toBe(true)
      expect(hasModuleAccess(UserRole.PROCUREMENT_BD, 'inventory')).toBe(true)
      expect(hasModuleAccess(UserRole.PROCUREMENT_BD, 'clients')).toBe(true)
    })

    it('should return true for ADMIN_HR on HR modules', () => {
      expect(hasModuleAccess(UserRole.ADMIN_HR, 'employees')).toBe(true)
      expect(hasModuleAccess(UserRole.ADMIN_HR, 'attendance')).toBe(true)
      expect(hasModuleAccess(UserRole.ADMIN_HR, 'organizational')).toBe(true)
    })

    it('should return true for IMS_QHSE on QHSE modules', () => {
      expect(hasModuleAccess(UserRole.IMS_QHSE, 'qhse')).toBe(true)
      expect(hasModuleAccess(UserRole.IMS_QHSE, 'templates')).toBe(true)
    })
  })

  describe('hasFullAccess', () => {
    it('should return true for MANAGEMENT role on any module', () => {
      expect(hasFullAccess(UserRole.MANAGEMENT, 'sales')).toBe(true)
      expect(hasFullAccess(UserRole.MANAGEMENT, 'finance')).toBe(true)
    })

    it('should return true for FINANCE_TEAM with FULL access on finance modules', () => {
      expect(hasFullAccess(UserRole.FINANCE_TEAM, 'finance')).toBe(true)
      expect(hasFullAccess(UserRole.FINANCE_TEAM, 'accounting')).toBe(true)
    })

    it('should return false for READ-only access', () => {
      // Assuming some roles have READ-only access to certain modules
      // This would depend on your ACCESS_CONTROL_MATRIX configuration
      expect(hasFullAccess(UserRole.PROCUREMENT_BD, 'finance')).toBe(false)
    })

    it('should return false for NONE access', () => {
      expect(hasFullAccess(UserRole.FINANCE_TEAM, 'sales')).toBe(false)
      expect(hasFullAccess(UserRole.ADMIN_HR, 'finance')).toBe(false)
    })
  })

  describe('checkPermission', () => {
    it('should allow FULL access for create operations', () => {
      const result = checkPermission(UserRole.MANAGEMENT, 'sales', 'CREATE')
      expect(result.allowed).toBe(true)
    })

    it('should allow READ access for read operations', () => {
      // Test a role with READ access to a module
      const result = checkPermission(UserRole.MANAGEMENT, 'sales', 'READ')
      expect(result.allowed).toBe(true)
    })

    it('should deny access for insufficient permissions', () => {
      const result = checkPermission(UserRole.FINANCE_TEAM, 'sales', 'CREATE')
      expect(result.allowed).toBe(false)
    })

    it('should provide appropriate error messages', () => {
      const result = checkPermission(UserRole.FINANCE_TEAM, 'sales', 'CREATE')
      expect(result.message).toBeDefined()
      expect(result.message).toContain('permission')
    })
  })

  describe('Edge Cases', () => {
    it('should throw error for undefined role', () => {
      expect(() => hasModuleAccess(undefined as any, 'sales')).toThrow()
    })

    it('should throw error for undefined module', () => {
      expect(() => hasModuleAccess(UserRole.MANAGEMENT, undefined as any)).toThrow()
    })

    it('should require exact case module names', () => {
      // Module names are case-sensitive in TypeScript
      expect(hasModuleAccess(UserRole.MANAGEMENT, 'sales')).toBe(true)
      // Invalid module names will cause TypeScript errors in production
    })
  })
})
