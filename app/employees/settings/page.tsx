'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Separator component not available, using border divs instead
import { Settings, ArrowLeft, Clock, Calendar, UserX, FileText, Save, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface EmployeeSettings {
  workingHours: {
    startTime: string;
    endTime: string;
    workDays: number;
    weekendDays: string[];
  };
  leavePolicies: {
    annualLeaveEnabled: boolean;
    annualLeaveDays: number;
    sickLeaveEnabled: boolean;
    sickLeaveDays: number;
    unpaidLeaveEnabled: boolean;
    carryForwardEnabled: boolean;
    maxCarryForwardDays: number;
  };
  probationPeriod: {
    enabled: boolean;
    durationDays: number;
    requiresConfirmation: boolean;
  };
  noticePeriod: {
    enabled: boolean;
    durationDays: number;
    variesByRole: boolean;
  };
  general: {
    autoGenerateEmployeeId: boolean;
    employeeIdPrefix: string;
    requirePhotoUpload: boolean;
    requireDocumentVerification: boolean;
  };
}

export default function EmployeeSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<EmployeeSettings>({
    workingHours: {
      startTime: '09:00',
      endTime: '17:00',
      workDays: 5,
      weekendDays: ['Saturday', 'Sunday'],
    },
    leavePolicies: {
      annualLeaveEnabled: true,
      annualLeaveDays: 21,
      sickLeaveEnabled: true,
      sickLeaveDays: 10,
      unpaidLeaveEnabled: true,
      carryForwardEnabled: true,
      maxCarryForwardDays: 5,
    },
    probationPeriod: {
      enabled: true,
      durationDays: 90,
      requiresConfirmation: true,
    },
    noticePeriod: {
      enabled: true,
      durationDays: 30,
      variesByRole: false,
    },
    general: {
      autoGenerateEmployeeId: true,
      employeeIdPrefix: 'EMP',
      requirePhotoUpload: true,
      requireDocumentVerification: true,
    },
  });

  // Permission checks
  const hasModuleAccess = user?.role && ['MANAGEMENT', 'ADMIN_HR'].includes(user.role);
  const hasFullAccess = user?.role === 'MANAGEMENT';

  useEffect(() => {
    if (!hasModuleAccess) {
      router.push('/dashboard');
      return;
    }
  }, [hasModuleAccess, router]);

  const handleSave = async () => {
    if (!hasFullAccess) return;

    setSaving(true);
    setSaved(false);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSaving(false);
    setSaved(true);

    // Hide success message after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSettings = (section: keyof EmployeeSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  if (!hasModuleAccess) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/employees')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Employee Settings</h1>
            <p className="text-muted-foreground">Configure employee management preferences and policies</p>
          </div>
        </div>
        {hasFullAccess && (
          <Button onClick={handleSave} disabled={saving || saved}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>

      {/* Working Hours Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>Configure standard working hours and work week</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={settings.workingHours.startTime}
                onChange={(e) => updateSettings('workingHours', 'startTime', e.target.value)}
                disabled={!hasFullAccess}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={settings.workingHours.endTime}
                onChange={(e) => updateSettings('workingHours', 'endTime', e.target.value)}
                disabled={!hasFullAccess}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workDays">Work Days per Week</Label>
            <Select
              value={settings.workingHours.workDays.toString()}
              onValueChange={(value) => updateSettings('workingHours', 'workDays', parseInt(value))}
              disabled={!hasFullAccess}
            >
              <SelectTrigger id="workDays">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Days (Monday - Friday)</SelectItem>
                <SelectItem value="6">6 Days (Monday - Saturday)</SelectItem>
                <SelectItem value="7">7 Days (Every Day)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Policies Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle>Leave Policies</CardTitle>
              <CardDescription>Configure leave types and entitlements</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Annual Leave</Label>
                <p className="text-sm text-muted-foreground">Enable paid annual leave</p>
              </div>
              <Switch
                checked={settings.leavePolicies.annualLeaveEnabled}
                onCheckedChange={(checked) => updateSettings('leavePolicies', 'annualLeaveEnabled', checked)}
                disabled={!hasFullAccess}
              />
            </div>
            {settings.leavePolicies.annualLeaveEnabled && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="annualDays">Annual Leave Days per Year</Label>
                <Input
                  id="annualDays"
                  type="number"
                  value={settings.leavePolicies.annualLeaveDays}
                  onChange={(e) => updateSettings('leavePolicies', 'annualLeaveDays', parseInt(e.target.value))}
                  disabled={!hasFullAccess}
                />
              </div>
            )}
          </div>

          <div className="border-t my-6" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Sick Leave</Label>
                <p className="text-sm text-muted-foreground">Enable paid sick leave</p>
              </div>
              <Switch
                checked={settings.leavePolicies.sickLeaveEnabled}
                onCheckedChange={(checked) => updateSettings('leavePolicies', 'sickLeaveEnabled', checked)}
                disabled={!hasFullAccess}
              />
            </div>
            {settings.leavePolicies.sickLeaveEnabled && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="sickDays">Sick Leave Days per Year</Label>
                <Input
                  id="sickDays"
                  type="number"
                  value={settings.leavePolicies.sickLeaveDays}
                  onChange={(e) => updateSettings('leavePolicies', 'sickLeaveDays', parseInt(e.target.value))}
                  disabled={!hasFullAccess}
                />
              </div>
            )}
          </div>

          <div className="border-t my-6" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Unpaid Leave</Label>
              <p className="text-sm text-muted-foreground">Allow unpaid leave requests</p>
            </div>
            <Switch
              checked={settings.leavePolicies.unpaidLeaveEnabled}
              onCheckedChange={(checked) => updateSettings('leavePolicies', 'unpaidLeaveEnabled', checked)}
              disabled={!hasFullAccess}
            />
          </div>

          <div className="border-t my-6" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Carry Forward Leave</Label>
                <p className="text-sm text-muted-foreground">Allow unused leave to carry forward to next year</p>
              </div>
              <Switch
                checked={settings.leavePolicies.carryForwardEnabled}
                onCheckedChange={(checked) => updateSettings('leavePolicies', 'carryForwardEnabled', checked)}
                disabled={!hasFullAccess}
              />
            </div>
            {settings.leavePolicies.carryForwardEnabled && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="carryForwardDays">Maximum Carry Forward Days</Label>
                <Input
                  id="carryForwardDays"
                  type="number"
                  value={settings.leavePolicies.maxCarryForwardDays}
                  onChange={(e) => updateSettings('leavePolicies', 'maxCarryForwardDays', parseInt(e.target.value))}
                  disabled={!hasFullAccess}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Probation Period Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-orange-600" />
            <div>
              <CardTitle>Probation Period</CardTitle>
              <CardDescription>Configure probation settings for new hires</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Probation Period</Label>
              <p className="text-sm text-muted-foreground">Apply probation period to new employees</p>
            </div>
            <Switch
              checked={settings.probationPeriod.enabled}
              onCheckedChange={(checked) => updateSettings('probationPeriod', 'enabled', checked)}
              disabled={!hasFullAccess}
            />
          </div>
          {settings.probationPeriod.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="probationDays">Probation Duration (Days)</Label>
                <Input
                  id="probationDays"
                  type="number"
                  value={settings.probationPeriod.durationDays}
                  onChange={(e) => updateSettings('probationPeriod', 'durationDays', parseInt(e.target.value))}
                  disabled={!hasFullAccess}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Require Confirmation</Label>
                  <p className="text-sm text-muted-foreground">Require manual confirmation after probation</p>
                </div>
                <Switch
                  checked={settings.probationPeriod.requiresConfirmation}
                  onCheckedChange={(checked) => updateSettings('probationPeriod', 'requiresConfirmation', checked)}
                  disabled={!hasFullAccess}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notice Period Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Notice Period</CardTitle>
              <CardDescription>Configure resignation notice period requirements</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Notice Period</Label>
              <p className="text-sm text-muted-foreground">Require notice period for resignations</p>
            </div>
            <Switch
              checked={settings.noticePeriod.enabled}
              onCheckedChange={(checked) => updateSettings('noticePeriod', 'enabled', checked)}
              disabled={!hasFullAccess}
            />
          </div>
          {settings.noticePeriod.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="noticeDays">Notice Period Duration (Days)</Label>
                <Input
                  id="noticeDays"
                  type="number"
                  value={settings.noticePeriod.durationDays}
                  onChange={(e) => updateSettings('noticePeriod', 'durationDays', parseInt(e.target.value))}
                  disabled={!hasFullAccess}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Varies by Role</Label>
                  <p className="text-sm text-muted-foreground">Different notice periods for different roles</p>
                </div>
                <Switch
                  checked={settings.noticePeriod.variesByRole}
                  onCheckedChange={(checked) => updateSettings('noticePeriod', 'variesByRole', checked)}
                  disabled={!hasFullAccess}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <div>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Other employee management preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Auto-Generate Employee ID</Label>
              <p className="text-sm text-muted-foreground">Automatically assign employee IDs</p>
            </div>
            <Switch
              checked={settings.general.autoGenerateEmployeeId}
              onCheckedChange={(checked) => updateSettings('general', 'autoGenerateEmployeeId', checked)}
              disabled={!hasFullAccess}
            />
          </div>
          {settings.general.autoGenerateEmployeeId && (
            <div className="space-y-2">
              <Label htmlFor="idPrefix">Employee ID Prefix</Label>
              <Input
                id="idPrefix"
                value={settings.general.employeeIdPrefix}
                onChange={(e) => updateSettings('general', 'employeeIdPrefix', e.target.value)}
                placeholder="EMP"
                disabled={!hasFullAccess}
              />
            </div>
          )}
          <div className="border-t my-6" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Require Photo Upload</Label>
              <p className="text-sm text-muted-foreground">Make employee photo mandatory</p>
            </div>
            <Switch
              checked={settings.general.requirePhotoUpload}
              onCheckedChange={(checked) => updateSettings('general', 'requirePhotoUpload', checked)}
              disabled={!hasFullAccess}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Require Document Verification</Label>
              <p className="text-sm text-muted-foreground">Mandatory document verification for new hires</p>
            </div>
            <Switch
              checked={settings.general.requireDocumentVerification}
              onCheckedChange={(checked) => updateSettings('general', 'requireDocumentVerification', checked)}
              disabled={!hasFullAccess}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      {hasFullAccess && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || saved} size="lg">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Changes Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}