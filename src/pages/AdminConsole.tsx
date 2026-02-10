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

const AdminConsole = () => {
  const { isAdmin, isLoading } = useIsAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

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

  if (isLoading) return null;
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
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>Manage user access and verification status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center border border-dashed rounded-lg">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">User listing and management tools will appear here.</p>
              </div>
            </CardContent>
          </Card>
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
              <CardTitle>Granular RBAC System</CardTitle>
              <CardDescription>Define module-level permissions for each role</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Assign Read, Write, and Admin permissions for each application module.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-medium">Module</th>
                      <th className="px-4 py-3 font-medium">Admin</th>
                      <th className="px-4 py-3 font-medium">Manager</th>
                      <th className="px-4 py-3 font-medium">Staff</th>
                      <th className="px-4 py-3 font-medium">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {["Reservations", "POS", "Finance", "Inventory", "Housekeeping"].map((module) => (
                      <tr key={module} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{module}</td>
                        <td className="px-4 py-3"><Badge className="bg-success/20 text-success border-success/30">All</Badge></td>
                        <td className="px-4 py-3"><Badge variant="outline">RW</Badge></td>
                        <td className="px-4 py-3"><Badge variant="outline">R</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Audit Trails</CardTitle>
              <CardDescription>Detailed history of all administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center border border-dashed rounded-lg">
                <Terminal className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Comprehensive system logs will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Connected Integrations</CardTitle>
              <CardDescription>External services and API connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-blue-500/10 flex items-center justify-center">
                      <Database className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Supabase</p>
                      <Badge variant="outline" className="text-[10px] h-4">Connected</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Settings</Button>
                </div>
                <div className="p-4 rounded-lg border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Channel Manager</p>
                      <Badge variant="outline" className="text-[10px] h-4 text-success">Active</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Sync</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security_breach">
          <SecurityBreachPanel />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default AdminConsole;
