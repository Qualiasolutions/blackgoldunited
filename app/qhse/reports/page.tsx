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
import { FileText, Search, Plus, Eye, Edit2, Trash2, Loader2, ArrowLeft, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface QHSEStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  criticalReports: number;
}

interface QHSEReport {
  id: string;
  reportType: string;
  date: string;
  status: string;
  createdBy: string;
  severity?: string;
  description?: string;
}

export default function QHSEReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<QHSEStats>({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    criticalReports: 0,
  });
  const [reports, setReports] = useState<QHSEReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<QHSEReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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

      // Fetch stats
      const statsResponse = await fetch('/api/qhse/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch reports/incidents
      const reportsResponse = await fetch('/api/qhse/incidents');
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.data || []);
        setFilteredReports(reportsData.data || []);
      } else {
        // Fallback to mock data if API not available
        const mockReports: QHSEReport[] = [
          {
            id: '1',
            reportType: 'Safety Incident',
            date: '2025-01-28',
            status: 'PENDING',
            createdBy: 'John Doe',
            severity: 'HIGH',
            description: 'Workplace injury report',
          },
          {
            id: '2',
            reportType: 'Environmental Audit',
            date: '2025-01-25',
            status: 'RESOLVED',
            createdBy: 'Jane Smith',
            severity: 'LOW',
            description: 'Monthly environmental compliance check',
          },
          {
            id: '3',
            reportType: 'Quality Issue',
            date: '2025-01-22',
            status: 'IN_PROGRESS',
            createdBy: 'Mike Johnson',
            severity: 'MEDIUM',
            description: 'Product quality concern',
          },
          {
            id: '4',
            reportType: 'Near Miss',
            date: '2025-01-20',
            status: 'RESOLVED',
            createdBy: 'Sarah Williams',
            severity: 'HIGH',
            description: 'Near miss incident in warehouse',
          },
        ];
        setReports(mockReports);
        setFilteredReports(mockReports);

        // Calculate stats from mock data
        setStats({
          totalReports: mockReports.length,
          pendingReports: mockReports.filter(r => r.status === 'PENDING').length,
          resolvedReports: mockReports.filter(r => r.status === 'RESOLVED').length,
          criticalReports: mockReports.filter(r => r.severity === 'HIGH').length,
        });
      }
    } catch (err) {
      setError('Failed to load QHSE reports. Please try again.');
      console.error('Error fetching QHSE reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = reports;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (report) =>
          report.reportType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.createdBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((report) => report.reportType === typeFilter);
    }

    setFilteredReports(filtered);
  }, [searchQuery, statusFilter, typeFilter, reports]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Pending', variant: 'outline' },
      IN_PROGRESS: { label: 'In Progress', variant: 'secondary' },
      RESOLVED: { label: 'Resolved', variant: 'default' },
      CLOSED: { label: 'Closed', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;

    const severityConfig: Record<string, { label: string; className: string }> = {
      LOW: { label: 'Low', className: 'bg-green-100 text-green-800' },
      MEDIUM: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
      HIGH: { label: 'High', className: 'bg-red-100 text-red-800' },
      CRITICAL: { label: 'Critical', className: 'bg-red-600 text-white' },
    };

    const config = severityConfig[severity] || { label: severity, className: '' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (!hasModuleAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
            <h1 className="text-3xl font-bold">QHSE Reports</h1>
            <p className="text-muted-foreground">Manage quality, health, safety, and environment reports</p>
          </div>
        </div>
        {hasFullAccess && (
          <Button onClick={() => router.push('/qhse/reports/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
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
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalReports}</div>
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
                placeholder="Search reports..."
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
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Safety Incident">Safety Incident</SelectItem>
                <SelectItem value="Environmental Audit">Environmental Audit</SelectItem>
                <SelectItem value="Quality Issue">Quality Issue</SelectItem>
                <SelectItem value="Near Miss">Near Miss</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.reportType}</TableCell>
                    <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                    <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>{report.createdBy}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/qhse/reports/${report.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasFullAccess && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/qhse/reports/${report.id}/edit`)}
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