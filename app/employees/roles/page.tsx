'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Plus, Eye, Edit2, Trash2, Loader2, ArrowLeft, Shield, UserCheck, Lock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  totalEmployees: number;
  customRoles: number;
}

interface EmployeeRole {
  id: string;
  roleName: string;
  description: string;
  employeeCount: number;
  permissions: string[];
  isSystemRole: boolean;
  createdAt?: string;
}

export default function EmployeeRolesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RoleStats>({
    totalRoles: 0,
    activeRoles: 0,
    totalEmployees: 0,
    customRoles: 0,
  });
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<EmployeeRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Permission checks
  const hasModuleAccess = user?.role && ['MANAGEMENT', 'ADMIN_HR'].includes(user.role);
  const hasFullAccess = user?.role === 'MANAGEMENT';

  useEffect(() => {
    if (!hasModuleAccess) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [hasModuleAccess, router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Mock data for employee roles
      const mockRoles: EmployeeRole[] = [
        {
          id: '1',
          roleName: 'System Administrator',
          description: 'Full system access with all administrative privileges',
          employeeCount: 3,
          permissions: ['FULL_ACCESS', 'USER_MANAGEMENT', 'SYSTEM_CONFIG', 'AUDIT_LOGS'],
          isSystemRole: true,
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          roleName: 'HR Manager',
          description: 'Manage employee records, attendance, and payroll',
          employeeCount: 5,
          permissions: ['EMPLOYEE_MANAGE', 'ATTENDANCE_MANAGE', 'PAYROLL_MANAGE', 'REPORTS_VIEW'],
          isSystemRole: true,
          createdAt: '2024-01-01',
        },
        {
          id: '3',
          roleName: 'Finance Manager',
          description: 'Manage financial transactions, accounting, and reports',
          employeeCount: 4,
          permissions: ['FINANCE_MANAGE', 'ACCOUNTING_MANAGE', 'REPORTS_VIEW', 'AUDIT_VIEW'],
          isSystemRole: true,
          createdAt: '2024-01-01',
        },
        {
          id: '4',
          roleName: 'Sales Manager',
          description: 'Manage sales operations, clients, and invoicing',
          employeeCount: 8,
          permissions: ['SALES_MANAGE', 'CLIENT_MANAGE', 'INVOICE_CREATE', 'REPORTS_VIEW'],
          isSystemRole: true,
          createdAt: '2024-01-01',
        },
        {
          id: '5',
          roleName: 'Procurement Officer',
          description: 'Handle purchase orders, supplier management, and inventory',
          employeeCount: 6,
          permissions: ['PURCHASE_MANAGE', 'SUPPLIER_MANAGE', 'INVENTORY_VIEW', 'REQUISITION_CREATE'],
          isSystemRole: true,
          createdAt: '2024-01-01',
        },
        {
          id: '6',
          roleName: 'Warehouse Manager',
          description: 'Manage inventory, stock movements, and warehouse operations',
          employeeCount: 4,
          permissions: ['INVENTORY_MANAGE', 'STOCK_ADJUST', 'WAREHOUSE_MANAGE', 'REPORTS_VIEW'],
          isSystemRole: false,
          createdAt: '2024-03-15',
        },
        {
          id: '7',
          roleName: 'QHSE Officer',
          description: 'Quality, health, safety, and environment management',
          employeeCount: 2,
          permissions: ['QHSE_MANAGE', 'INCIDENT_REPORT', 'POLICY_MANAGE', 'AUDIT_VIEW'],
          isSystemRole: true,
          createdAt: '2024-01-01',
        },
        {
          id: '8',
          roleName: 'Department Head',
          description: 'Departmental management and team oversight',
          employeeCount: 12,
          permissions: ['TEAM_MANAGE', 'ATTENDANCE_VIEW', 'REPORTS_VIEW', 'EMPLOYEE_VIEW'],
          isSystemRole: false,
          createdAt: '2024-02-10',
        },
        {
          id: '9',
          roleName: 'Standard Employee',
          description: 'Basic employee access with self-service capabilities',
          employeeCount: 45,
          permissions: ['SELF_VIEW', 'ATTENDANCE_MARK', 'LEAVE_REQUEST', 'PROFILE_EDIT'],
          isSystemRole: true,
          createdAt: '2024-01-01',
        },
      ];

      setRoles(mockRoles);
      setFilteredRoles(mockRoles);

      // Calculate stats
      const totalEmployees = mockRoles.reduce((sum, role) => sum + role.employeeCount, 0);
      setStats({
        totalRoles: mockRoles.length,
        activeRoles: mockRoles.length,
        totalEmployees,
        customRoles: mockRoles.filter(r => !r.isSystemRole).length,
      });
    } catch (err) {
      console.error('Error fetching employee roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = roles;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (role) =>
          role.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          role.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          role.permissions.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredRoles(filtered);
  }, [searchQuery, roles]);

  if (!hasModuleAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/employees')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Employee Roles</h1>
            <p className="text-muted-foreground">Manage employee roles and permissions</p>
          </div>
        </div>
        {hasFullAccess && (
          <Button onClick={() => router.push('/employees/roles/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Role
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRoles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
            <Lock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customRoles}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search roles by name, description, or permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Employees</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No roles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {role.roleName}
                        {role.isSystemRole && (
                          <Badge variant="outline" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-muted-foreground truncate">{role.description}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{role.employeeCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {permission.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/employees/roles/${role.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasFullAccess && !role.isSystemRole && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/employees/roles/${role.id}/edit`)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {role.isSystemRole && (
                          <Button variant="ghost" size="icon" disabled title="System roles cannot be deleted">
                            <Lock className="h-4 w-4 text-gray-400" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}