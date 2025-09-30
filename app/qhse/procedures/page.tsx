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
import { ClipboardList, Search, Plus, Eye, Edit2, Trash2, Loader2, ArrowLeft, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface ProcedureStats {
  totalProcedures: number;
  activeProcedures: number;
  underReview: number;
  outdated: number;
}

interface Procedure {
  id: string;
  procedureName: string;
  category: string;
  lastUpdated: string;
  status: string;
  version?: string;
  owner?: string;
  description?: string;
}

export default function QHSEProceduresPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProcedureStats>({
    totalProcedures: 0,
    activeProcedures: 0,
    underReview: 0,
    outdated: 0,
  });
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([]);
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
      const response = await fetch('/api/qhse/procedures');
      if (response.ok) {
        const data = await response.json();
        setProcedures(data.data || []);
        setFilteredProcedures(data.data || []);

        // Calculate stats
        const total = data.data.length;
        const active = data.data.filter((p: Procedure) => p.status === 'ACTIVE').length;
        const review = data.data.filter((p: Procedure) => p.status === 'UNDER_REVIEW').length;
        const outdated = data.data.filter((p: Procedure) => p.status === 'OUTDATED').length;

        setStats({ totalProcedures: total, activeProcedures: active, underReview: review, outdated });
      } else {
        // Fallback to mock data
        const mockProcedures: Procedure[] = [
          {
            id: '1',
            procedureName: 'Emergency Response Procedure',
            category: 'Safety',
            lastUpdated: '2025-01-15',
            status: 'ACTIVE',
            version: '2.0',
            owner: 'Safety Manager',
            description: 'Steps to follow during emergency situations',
          },
          {
            id: '2',
            procedureName: 'Waste Disposal Procedure',
            category: 'Environment',
            lastUpdated: '2024-12-10',
            status: 'ACTIVE',
            version: '1.5',
            owner: 'Environmental Officer',
            description: 'Proper methods for waste segregation and disposal',
          },
          {
            id: '3',
            procedureName: 'Quality Inspection Procedure',
            category: 'Quality',
            lastUpdated: '2025-01-20',
            status: 'UNDER_REVIEW',
            version: '3.0 (Draft)',
            owner: 'QA Manager',
            description: 'Product quality inspection guidelines',
          },
          {
            id: '4',
            procedureName: 'Personal Protective Equipment (PPE) Usage',
            category: 'Safety',
            lastUpdated: '2024-08-15',
            status: 'OUTDATED',
            version: '1.2',
            owner: 'Safety Coordinator',
            description: 'Guidelines for proper PPE selection and use',
          },
          {
            id: '5',
            procedureName: 'Incident Investigation Procedure',
            category: 'Safety',
            lastUpdated: '2025-01-05',
            status: 'ACTIVE',
            version: '2.1',
            owner: 'QHSE Manager',
            description: 'Process for investigating workplace incidents',
          },
          {
            id: '6',
            procedureName: 'Chemical Handling Procedure',
            category: 'Health',
            lastUpdated: '2024-11-20',
            status: 'ACTIVE',
            version: '1.8',
            owner: 'HSE Officer',
            description: 'Safe handling and storage of hazardous chemicals',
          },
          {
            id: '7',
            procedureName: 'Equipment Calibration Procedure',
            category: 'Quality',
            lastUpdated: '2025-01-10',
            status: 'ACTIVE',
            version: '1.0',
            owner: 'QC Technician',
            description: 'Regular calibration schedule for testing equipment',
          },
        ];
        setProcedures(mockProcedures);
        setFilteredProcedures(mockProcedures);

        // Calculate stats from mock data
        setStats({
          totalProcedures: mockProcedures.length,
          activeProcedures: mockProcedures.filter(p => p.status === 'ACTIVE').length,
          underReview: mockProcedures.filter(p => p.status === 'UNDER_REVIEW').length,
          outdated: mockProcedures.filter(p => p.status === 'OUTDATED').length,
        });
      }
    } catch (err) {
      setError('Failed to load QHSE procedures. Please try again.');
      console.error('Error fetching QHSE procedures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = procedures;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (procedure) =>
          procedure.procedureName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          procedure.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          procedure.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((procedure) => procedure.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((procedure) => procedure.category === categoryFilter);
    }

    setFilteredProcedures(filtered);
  }, [searchQuery, statusFilter, categoryFilter, procedures]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      ACTIVE: { label: 'Active', variant: 'default' },
      UNDER_REVIEW: { label: 'Under Review', variant: 'secondary' },
      OUTDATED: { label: 'Outdated', variant: 'destructive' },
      ARCHIVED: { label: 'Archived', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Safety: 'text-red-600',
      Environment: 'text-green-600',
      Quality: 'text-blue-600',
      Health: 'text-purple-600',
    };
    return colors[category] || 'text-gray-600';
  };

  if (!hasModuleAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
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
            <h1 className="text-3xl font-bold">QHSE Procedures</h1>
            <p className="text-muted-foreground">Manage standard operating procedures and work instructions</p>
          </div>
        </div>
        {hasFullAccess && (
          <Button onClick={() => router.push('/qhse/procedures/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Procedure
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
            <CardTitle className="text-sm font-medium">Total Procedures</CardTitle>
            <ClipboardList className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProcedures}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProcedures}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.underReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outdated</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outdated}</div>
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
                placeholder="Search procedures..."
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
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="OUTDATED">Outdated</SelectItem>
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

      {/* Procedures Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procedure Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProcedures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No procedures found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProcedures.map((procedure) => (
                  <TableRow key={procedure.id}>
                    <TableCell className="font-medium">{procedure.procedureName}</TableCell>
                    <TableCell>
                      <span className={getCategoryColor(procedure.category)}>{procedure.category}</span>
                    </TableCell>
                    <TableCell>{procedure.version || 'N/A'}</TableCell>
                    <TableCell>{new Date(procedure.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(procedure.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/qhse/procedures/${procedure.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasFullAccess && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/qhse/procedures/${procedure.id}/edit`)}
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