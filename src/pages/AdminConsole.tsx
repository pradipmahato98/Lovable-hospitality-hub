import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { SecurityBreachPanel } from "@/components/dev/SecurityBreachPanel";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateSettings, useSettings } from "@/hooks/useSettings";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";
import {
  useUsersWithRoles,
  useAdminAuditLogs,
  useRolePermissions,
  useUpdateUserRole,
  useOTAChannels,
  useOTASyncLogs
} from "@/hooks/useUsersWithRoles";
import { UsersTable } from "@/components/users/UsersTable";
import { GeneralAuditLogTable } from "@/components/users/GeneralAuditLogTable";

const AdminConsole = () => {
  const { isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  // Realtime hook
  useAdminRealtime();

  // Data hooks
  const { data: users, isLoading: loadingUsers } = useUsersWithRoles(activeTab === "users");
  const { data: adminLogs, isLoading: loadingLogs } = useAdminAuditLogs(activeTab === "audit");
  const { data: permissions, isLoading: loadingPerms } = useRolePermissions(activeTab === "permissions");
  const { data: otaChannels, isLoading: loadingChannels } = useOTAChannels(activeTab === "integrations");
  const { data: otaLogs, isLoading: loadingOTALogs } = useOTASyncLogs(activeTab === "integrations");
  const updateUserRole = useUpdateUserRole();

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

  if (loadingAdmin) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <MainLayout title="Admin Console" subtitle="System-wide administrative controls and security">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-1 scrollbar-hide">
          <TabsList className="flex-nowrap justify-start w-full bg-muted/50 p-1 h-auto inline-flex">
            <TabsTrigger value="overview" className="gap-2 whitespace-nowrap">
            <Activity className="h-4 w-4" />
            System Overview
          </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              Account Management
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 whitespace-nowrap">
              <Lock className="h-4 w-4" />
              Security Policies
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2 whitespace-nowrap">
              <Shield className="h-4 w-4" />
              RBAC
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2 whitespace-nowrap">
              <Terminal className="h-4 w-4" />
              Audit Trails
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2 whitespace-nowrap">
              <Globe className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="security_breach" className="gap-2 text-destructive whitespace-nowrap">
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
                <div className="text-2xl font-bold">128</div>
                <p className="text-xs text-muted-foreground mt-1">+12 this month</p>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-success" />
                  Active Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground mt-1">Admin, Manager, Staff, User</p>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Optimal</div>
                <p className="text-xs text-muted-foreground mt-1">Latency: 42ms</p>
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
                  onClick={() => navigate("/users")}
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
                  {[
                    { action: "Role Changed", user: "John Doe", target: "Sarah Wilson", time: "2h ago" },
                    { action: "API Key Created", user: "Admin", target: "Stripe", time: "5h ago" },
                    { action: "Backup Created", user: "System", target: "PostgreSQL", time: "12h ago" },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                      <div>
                        <span className="font-medium">{log.action}</span>
                        <p className="text-xs text-muted-foreground">{log.user} → {log.target}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UsersTable
            users={users}
            isLoading={loadingUsers}
            searchQuery=""
            onSearchChange={() => {}}
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
                <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider rounded-full animate-pulse">
                  <div className="w-1.5 h-1.5 bg-success rounded-full" />
                  Live
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
                        <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 capitalize font-bold">{p.role}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="border-primary/30 text-primary">
                              {p.permission}
                            </Badge>
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
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Sync Status</p>
                        <p className="text-xs font-medium">{channel.sync_status || 'Idle'}</p>
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

        <TabsContent value="security_breach">
          <SecurityBreachPanel />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default AdminConsole;
