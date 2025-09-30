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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, Plus, Eye, Edit2, Trash2, Loader2, ArrowLeft, FileCheck, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface PolicyStats {
  totalPolicies: number;
  activePolicies: number;
  draftPolicies: number;
  expiringPolicies: number;
}

interface Policy {
  id: string;
  policyName: string;
  version: string;
  effectiveDate: string;
  expiryDate?: string;
  status: string;
  category?: string;
  owner?: string;
}

export default function QHSEPolicyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PolicyStats>({
    totalPolicies: 0,
    activePolicies: 0,
    draftPolicies: 0,
    expiringPolicies: 0,
  });
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Permission checks
  const hasModuleAccess = user?.role && ['MANAGEMENT', 'IMS_QHSE'].includes(user.role);
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
      setError(null);

      // Try to fetch from API
      const response = await fetch('/api/qhse/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.data || []);
        setFilteredPolicies(data.data || []);

        // Calculate stats
        const total = data.data.length;
        const active = data.data.filter((p: Policy) => p.status === 'ACTIVE').length;
        const draft = data.data.filter((p: Policy) => p.status === 'DRAFT').length;
        const expiring = data.data.filter((p: Policy) => {
          if (!p.expiryDate) return false;
          const expiryDate = new Date(p.expiryDate);
          const today = new Date();
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
        }).length;

        setStats({ totalPolicies: total, activePolicies: active, draftPolicies: draft, expiringPolicies: expiring });
      } else {
        // Fallback to mock data
        const mockPolicies: Policy[] = [
          {
            id: '1',
            policyName: 'Workplace Safety Policy',
            version: '2.1',
            effectiveDate: '2025-01-01',
            expiryDate: '2026-01-01',
            status: 'ACTIVE',
            category: 'Safety',
            owner: 'Safety Manager',
          },
          {
            id: '2',
            policyName: 'Environmental Management Policy',
            version: '1.5',
            effectiveDate: '2024-06-01',
            expiryDate: '2025-06-01',
            status: 'ACTIVE',
            category: 'Environment',
            owner: 'Environmental Officer',
          },
          {
            id: '3',
            policyName: 'Quality Assurance Policy',
            version: '3.0',
            effectiveDate: '2025-02-01',
            status: 'DRAFT',
            category: 'Quality',
            owner: 'QA Manager',
          },
          {
            id: '4',
            policyName: 'Incident Reporting Policy',
            version: '1.2',
            effectiveDate: '2024-09-01',
            expiryDate: '2025-09-01',
            status: 'ACTIVE',
            category: 'Safety',
            owner: 'QHSE Manager',
          },
          {
            id: '5',
            policyName: 'Waste Management Policy',
            version: '2.0',
            effectiveDate: '2024-12-01',
            expiryDate: '2025-02-15',
            status: 'ACTIVE',
            category: 'Environment',
            owner: 'Environmental Officer',
          },
        ];
        setPolicies(mockPolicies);
        setFilteredPolicies(mockPolicies);

        // Calculate stats from mock data
        setStats({
          totalPolicies: mockPolicies.length,
          activePolicies: mockPolicies.filter(p => p.status === 'ACTIVE').length,
          draftPolicies: mockPolicies.filter(p => p.status === 'DRAFT').length,
          expiringPolicies: mockPolicies.filter(p => {
            if (!p.expiryDate) return false;
            const expiryDate = new Date(p.expiryDate);
            const today = new Date();
            const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
          }).length,
        });
      }
    } catch (err) {
      setError('Failed to load QHSE policies. Please try again.');
      console.error('Error fetching QHSE policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = policies;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (policy) =>
          policy.policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          policy.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
          policy.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((policy) => policy.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((policy) => policy.category === categoryFilter);
    }

    setFilteredPolicies(filtered);
  }, [searchQuery, statusFilter, categoryFilter, policies]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      ACTIVE: { label: 'Active', variant: 'default' },
      DRAFT: { label: 'Draft', variant: 'secondary' },
      EXPIRED: { label: 'Expired', variant: 'destructive' },
      ARCHIVED: { label: 'Archived', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  if (!hasModuleAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/qhse')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">QHSE Policies</h1>
            <p className="text-muted-foreground">Manage organizational policies and procedures</p>
          </div>
        </div>
        {hasFullAccess && (
          <Button onClick={() => router.push('/qhse/policy/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPolicies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePolicies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftPolicies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiringPolicies}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Safety">Safety</SelectItem>
                <SelectItem value="Environment">Environment</SelectItem>
                <SelectItem value="Quality">Quality</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No policies found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {policy.policyName}
                        {isExpiringSoon(policy.expiryDate) && (
                          <Badge variant="destructive" className="text-xs">
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{policy.version}</TableCell>
                    <TableCell>{new Date(policy.effectiveDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {policy.expiryDate ? new Date(policy.expiryDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(policy.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/qhse/policy/${policy.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasFullAccess && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/qhse/policy/${policy.id}/edit`)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
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