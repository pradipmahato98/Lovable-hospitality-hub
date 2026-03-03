import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  Settings,
  Lock,
  Eye,
  Zap,
  Activity,
  UserPlus,
  Key,
  Database,
  Terminal,
  FileText,
  AlertTriangle,
  Globe,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Layout,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { SecurityBreachPanel } from "@/components/dev/SecurityBreachPanel";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateSettings, useSettings, useAPIKeysSettings, useUpdateAPIKeysSettings, APIKey } from "@/hooks/useSettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";
import { generateSecureAPIKey } from "@/utils/security";
import {
  useUsersWithRoles,
  useAdminAuditLogs,
  useRolePermissions,
  useUpdateUserRole,
  useOTAChannels,
  useOTASyncLogs,
  useUpdateRolePermission,
  useUpdateOTAChannel,
  AppRole
} from "@/hooks/useUsersWithRoles";
import { UsersTable } from "@/components/users/UsersTable";
import { GeneralAuditLogTable } from "@/components/users/GeneralAuditLogTable";
import { TableSkeleton } from "@/components/skeletons";
import { DesignSystemTab } from "@/components/admin/design-system/DesignSystemTab";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";
import { RoomManagement } from "@/components/admin/RoomManagement";
import { DatabaseControlCenter } from "@/components/database/DatabaseControlCenter";

const AdminConsole = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);

  // Realtime hook
  useAdminRealtime();

  // State for modals
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ email: "", firstName: "", lastName: "", role: "staff" as AppRole });
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Data hooks
  const { data: users, isLoading: loadingUsers } = useUsersWithRoles(activeTab === "users");
  const { data: adminLogs, isLoading: loadingLogs } = useAdminAuditLogs(activeTab === "audit");
  const { data: permissions, isLoading: loadingPerms } = useRolePermissions(activeTab === "permissions");
  const { data: otaChannels, isLoading: loadingChannels } = useOTAChannels(activeTab === "integrations");
  const { data: otaLogs, isLoading: loadingOTALogs } = useOTASyncLogs(activeTab === "integrations");
  const { data: apiKeysSettings, isLoading: loadingAPIKeys } = useAPIKeysSettings();
  const updateAPIKeys = useUpdateAPIKeysSettings();

  // State for RBAC
  const [rbacModalOpen, setRbacModalOpen] = useState(false);
  const [newPermission, setNewPermission] = useState({ role: "staff" as AppRole, permission: "" });

  const updateUserRole = useUpdateUserRole();
  const updatePermission = useUpdateRolePermission();
  const updateOTAChannel = useUpdateOTAChannel();

  const { data: lockdownEnabled } = useSettings<boolean>("system_lockdown", false);
  const updateSettings = useUpdateSettings<boolean>("system_lockdown");

  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info("No logs found to export");
        return;
      }

      // Simple CSV conversion
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map(log =>
        Object.values(log).map(val =>
          typeof val === 'object' ? `"${JSON.stringify(val).replace(/"/g, '""')}"` : `"${String(val).replace(/"/g, '""')}"`
        ).join(",")
      );
      const csv = [headers, ...rows].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("hidden", "");
      a.setAttribute("href", url);
      a.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success("Logs exported successfully");
    } catch (error: any) {
      toast.error("Failed to export logs: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSystemLockdown = () => {
    const newState = !lockdownEnabled;
    updateSettings.mutate(newState, {
      onSuccess: () => {
        toast.success(`System lockdown ${newState ? "enabled" : "disabled"}`);
      }
    });
  };

  const handleProvisionAccount = async () => {
    if (!newUserData.email) {
      toast.error("Email is required");
      return;
    }
    setIsProvisioning(true);
    try {
      // 1. Create Profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          email: newUserData.email,
          first_name: newUserData.firstName,
          last_name: newUserData.lastName,
          user_id: crypto.randomUUID(), // Mock user_id for profile-only entry
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // 2. Assign Role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: profile.user_id,
          role: newUserData.role,
        });

      if (roleError) throw roleError;

      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast.success("Account provisioned successfully. User can now sign up with this email.");
      setProvisionModalOpen(false);
      setNewUserData({ email: "", firstName: "", lastName: "", role: "staff" });
    } catch (error: any) {
      toast.error("Failed to provision account: " + error.message);
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleSyncChannel = (id: string) => {
    updateOTAChannel.mutate({ id, sync_status: "Synchronizing..." });
    setTimeout(() => {
      updateOTAChannel.mutate({ id, sync_status: "Last sync: Just now" });
    }, 2000);
  };

  const handleAddAPIKey = () => {
    const newKey: APIKey = {
      name: "New API Key",
      key: generateSecureAPIKey(),
      is_secret: true,
      description: "Auto-generated system key"
    };
    const currentKeys = apiKeysSettings?.keys || [];
    updateAPIKeys.mutate({ keys: [...currentKeys, newKey] });
  };

  const handleDeleteAPIKey = (keyName: string) => {
    const currentKeys = apiKeysSettings?.keys || [];
    updateAPIKeys.mutate({ keys: currentKeys.filter(k => k.name !== keyName) });
  };

  const handleAddPermission = () => {
    if (!newPermission.permission) {
      toast.error("Permission name is required");
      return;
    }
    updatePermission.mutate({
      role: newPermission.role,
      permission: newPermission.permission,
      action: 'add'
    }, {
      onSuccess: () => {
        setRbacModalOpen(false);
        setNewPermission({ ...newPermission, permission: "" });
      }
    });
  };

  if (!mounted || loadingAdmin) {
    return (
      <MainLayout title="Admin Console" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin && !import.meta.env.DEV) return <Navigate to="/" replace />;

  return (
    <MainLayout title="Admin Console" subtitle="System-wide administrative controls and security">
      <ErrorBoundary>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="flex-nowrap justify-start min-w-max bg-muted/50 p-1 h-auto inline-flex">
            <TabsTrigger value="overview" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Activity className="h-4 w-4" />
              System Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 whitespace-nowrap flex-shrink-0">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="rooms" className="gap-2 whitespace-nowrap flex-shrink-0">
              <LayoutDashboard className="h-4 w-4" />
              Room Management
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Users className="h-4 w-4" />
              Account Management
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Lock className="h-4 w-4" />
              Security Policies
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Shield className="h-4 w-4" />
              RBAC
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Terminal className="h-4 w-4" />
              Audit Trails
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Globe className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Database className="h-4 w-4" />
              Database Control
            </TabsTrigger>
            <TabsTrigger value="design_system" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Layout className="h-4 w-4" />
              Design System
            </TabsTrigger>
            <TabsTrigger value="security_breach" className="gap-2 text-destructive whitespace-nowrap flex-shrink-0">
              <ShieldAlert className="h-4 w-4" />
              Security Breach
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-success" />
                  RBAC Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{permissions?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active permission rules</p>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{otaChannels?.filter((c: any) => c.is_active).length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Connected OTA channels</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Quick Administrative Actions</CardTitle>
                <CardDescription>Common tasks for system administrators</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => setProvisionModalOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Provision Account
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => setActiveTab("integrations")}
                >
                  <Key className="h-4 w-4" />
                  Rotate API Keys
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={handleExportLogs}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Export Logs
                </Button>
                <Button
                  variant={lockdownEnabled ? "destructive" : "outline"}
                  className={`justify-start gap-2 ${!lockdownEnabled && 'text-destructive hover:text-destructive'}`}
                  onClick={handleSystemLockdown}
                >
                  <AlertTriangle className="h-4 w-4" />
                  {lockdownEnabled ? "End Lockdown" : "System Lockdown"}
                </Button>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Recent Administrative Activity</CardTitle>
                <CardDescription>Security and configuration changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingLogs ? (
                    <div className="py-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
                  ) : adminLogs?.slice(0, 5).map((log, i) => (
                    <div key={log.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                      <div>
                        <span className="font-medium">{log.action}</span>
                        <p className="text-xs text-muted-foreground">{log.user_email} → {log.entity_type}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), "HH:mm")}</span>
                    </div>
                  ))}
                  {(!adminLogs || adminLogs.length === 0) && !loadingLogs && (
                    <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>

        <TabsContent value="rooms">
          <RoomManagement />
        </TabsContent>

        <TabsContent value="users">
          <UsersTable
            users={users}
            isLoading={loadingUsers}
            searchQuery={userSearchQuery}
            onSearchChange={setUserSearchQuery}
            onRoleChange={(userId, oldRole, newRole) => updateUserRole.mutate({ userId, oldRole, newRole })}
            isUpdating={updateUserRole.isPending}
          />
        </TabsContent>

        <TabsContent value="security">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Global Security Policies</CardTitle>
              <CardDescription>Configure system-wide authentication and access rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Force Multi-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Require 2FA for all staff members</p>
                  </div>
                  <Badge variant="outline">Disabled</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Automatically logout after inactivity</p>
                  </div>
                  <Badge>4 Hours</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Password Policy</p>
                    <p className="text-sm text-muted-foreground">Minimum length and complexity requirements</p>
                  </div>
                  <Badge variant="outline">Standard</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Granular RBAC System</CardTitle>
                  <CardDescription>Role-based access control policies</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Button size="sm" className="gap-2" onClick={() => setRbacModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Rule
                  </Button>
                  <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider rounded-full animate-pulse">
                    <div className="w-1.5 h-1.5 bg-success rounded-full" />
                    Live
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPerms ? (
                <TableSkeleton columns={3} rows={5} />
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Permission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {permissions?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-secondary/30 transition-colors group">
                          <td className="px-4 py-3 capitalize font-bold">{p.role}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="border-primary/30 text-primary">
                              {p.permission}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                              onClick={() => updatePermission.mutate({ role: p.role, permission: p.permission, action: 'remove' })}
                              disabled={updatePermission.isPending}
                            >
                              {updatePermission.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <GeneralAuditLogTable logs={adminLogs} isLoading={loadingLogs} />
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-primary" />
                      System API Keys
                    </CardTitle>
                    <CardDescription>Manage security credentials for external services</CardDescription>
                  </div>
                  <Button size="sm" onClick={handleAddAPIKey} disabled={updateAPIKeys.isPending}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAPIKeys ? (
                  <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                ) : (
                  <div className="space-y-4">
                    {apiKeysSettings?.keys.map((key) => (
                      <div key={key.name} className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/5">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{key.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {key.is_secret ? "••••••••••••••••" : key.key}
                          </p>
                          {key.description && <p className="text-[10px] text-muted-foreground">{key.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => toast.info("Key copied to clipboard")}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteAPIKey(key.name)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!apiKeysSettings?.keys || apiKeysSettings.keys.length === 0) && (
                      <p className="text-center text-sm text-muted-foreground py-8">No API keys configured</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>OTA Channels</CardTitle>
                    <CardDescription>External booking service connections</CardDescription>
                  </div>
                  <Badge className="bg-success/20 text-success border-success/30">
                    {otaChannels?.length || 0} Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loadingChannels ? (
                    <div className="col-span-2 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                  ) : otaChannels?.map((channel: any) => (
                    <div key={channel.id} className="p-4 rounded-lg border border-border flex items-center justify-between bg-secondary/10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{channel.name}</p>
                          <Badge variant="outline" className={`text-[10px] h-4 ${channel.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                            {channel.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Sync Status</p>
                          <p className="text-xs font-medium">{channel.sync_status || 'Idle'}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Switch
                            checked={channel.is_active}
                            onCheckedChange={(checked) => updateOTAChannel.mutate({ id: channel.id, is_active: checked })}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-[10px]"
                            onClick={() => handleSyncChannel(channel.id)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Sync
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Recent OTA Sync Events
                    </CardTitle>
                    <CardDescription>Real-time channel synchronization logs</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider rounded-full animate-pulse">
                    <div className="w-1.5 h-1.5 bg-success rounded-full" />
                    Live
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingOTALogs ? (
                  <TableSkeleton columns={3} rows={5} />
                ) : (
                  <div className="space-y-3">
                    {otaLogs?.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/5">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={log.status === 'success' ? 'border-success/50 text-success' : 'border-destructive/50 text-destructive'}>
                            {log.direction.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">{log.ota_name}</p>
                            <p className="text-xs text-muted-foreground">{log.message}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(log.created_at), "HH:mm:ss")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database">
          <DatabaseControlCenter />
        </TabsContent>

        <TabsContent value="design_system">
          <DesignSystemTab />
        </TabsContent>

        <TabsContent value="security_breach">
          <SecurityBreachPanel />
        </TabsContent>
      </Tabs>

      <Dialog open={provisionModalOpen} onOpenChange={setProvisionModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Provision New Account
            </DialogTitle>
            <DialogDescription>
              Create a user profile and assign roles. The user will be able to complete signup with this email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                placeholder="email@luxestay.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newUserData.firstName}
                  onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newUserData.lastName}
                  onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Initial Role</Label>
              <Select
                value={newUserData.role}
                onValueChange={(val: AppRole) => setNewUserData({...newUserData, role: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProvisionModalOpen(false)}>Cancel</Button>
            <Button onClick={handleProvisionAccount} disabled={isProvisioning}>
              {isProvisioning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Provision Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rbacModalOpen} onOpenChange={setRbacModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Add RBAC Rule
            </DialogTitle>
            <DialogDescription>
              Grant a specific permission to a user role. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rbac-role">Target Role</Label>
              <Select
                value={newPermission.role}
                onValueChange={(val: AppRole) => setNewPermission({...newPermission, role: val})}
              >
                <SelectTrigger id="rbac-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="permission">Permission Name</Label>
              <Input
                id="permission"
                value={newPermission.permission}
                onChange={(e) => setNewPermission({...newPermission, permission: e.target.value})}
                placeholder="e.g., manage_finance, view_reports"
              />
              <p className="text-[10px] text-muted-foreground italic">
                Use snake_case for internal permission identifiers.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRbacModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPermission} disabled={updatePermission.isPending}>
              {updatePermission.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Grant Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </ErrorBoundary>
    </MainLayout>
  );
};

export default AdminConsole;
