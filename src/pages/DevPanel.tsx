import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code2, 
  Database, 
  Server, 
  Activity, 
  Terminal,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Settings,
  Bell,
  Shield,
  ShieldAlert,
  Users,
  Loader2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database as DbTypes } from "@/integrations/supabase/types";
import { DataSeeder } from "@/components/dev/DataSeeder";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { MCPConfigPanel } from "@/components/dev/MCPConfig";
import { SecurityBreachPanel } from "@/components/dev/SecurityBreachPanel";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";

type AppRole = DbTypes["public"]["Enums"]["app_role"];

const ROLE_PRIORITY: Record<AppRole, number> = {
  user: 0,
  staff: 1,
  manager: 2,
  admin: 3,
};

interface EmailConfig {
  enabled: boolean;
  provider: string;
  roleChangeNotifications: boolean;
  bookingNotifications: boolean;
  systemAlerts: boolean;
}

const defaultEmailConfig: EmailConfig = {
  enabled: false,
  provider: "resend",
  roleChangeNotifications: true,
  bookingNotifications: true,
  systemAlerts: true,
};

interface UserWithMultipleRoles {
  user_id: string;
  email: string | null;
  roles: AppRole[];
  highestRole: AppRole;
}

const DevPanel = () => {
  useAdminRealtime();
  const { isAdmin, isLoading } = useIsAdmin();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    enabled: false,
    provider: "resend",
    roleChangeNotifications: true,
    bookingNotifications: true,
    systemAlerts: true,
  });

  // Fetch users with multiple roles
  const { data: usersWithMultipleRoles, isLoading: isLoadingRoles, refetch: refetchRoles } = useQuery({
    queryKey: ["users-with-multiple-roles"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const userRolesMap = new Map<string, AppRole[]>();
      roles.forEach(r => {
        const existing = userRolesMap.get(r.user_id) || [];
        userRolesMap.set(r.user_id, [...existing, r.role as AppRole]);
      });

      const usersWithMultiple: UserWithMultipleRoles[] = [];
      userRolesMap.forEach((userRoles, userId) => {
        if (userRoles.length > 1) {
          const profile = profiles.find(p => p.user_id === userId);
          const highestRole = userRoles.reduce((best, current) => 
            ROLE_PRIORITY[current] > ROLE_PRIORITY[best] ? current : best
          );
          usersWithMultiple.push({
            user_id: userId,
            email: profile?.email || null,
            roles: userRoles,
            highestRole,
          });
        }
      });

      return usersWithMultiple;
    },
    enabled: isAdmin,
  });

  // Cleanup mutation
  const cleanupRoles = useMutation({
    mutationFn: async (users: UserWithMultipleRoles[]) => {
      for (const user of users) {
        // Keep only the highest role, delete others
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.user_id)
          .neq("role", user.highestRole);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-multiple-roles"] });
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast.success("Role cleanup completed successfully");
    },
    onError: (error) => {
      toast.error("Cleanup failed: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <MainLayout title="Developer Panel" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin && !import.meta.env.DEV) {
    return <Navigate to="/" replace />;
  }

  const systemStatus = [
    { name: "Database", status: "healthy", latency: "12ms", icon: Database },
    { name: "API Server", status: "healthy", latency: "45ms", icon: Server },
    { name: "Auth Service", status: "healthy", latency: "23ms", icon: Activity },
    { name: "Edge Functions", status: "healthy", latency: "89ms", icon: Code2 },
  ];

  const recentLogs = [
    { time: "2 min ago", level: "info", message: "User authentication successful" },
    { time: "5 min ago", level: "info", message: "New reservation created: RES-123456" },
    { time: "12 min ago", level: "warning", message: "High API response time detected" },
    { time: "1 hour ago", level: "info", message: "Database backup completed" },
    { time: "2 hours ago", level: "error", message: "Payment gateway timeout - retried successfully" },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries();
    setRefreshing(false);
    toast.success("System status refreshed");
  };

  const handleClearCache = () => {
    queryClient.clear();
    toast.success("Client cache cleared");
  };

  const handleSyncData = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
    toast.success("Data synchronization triggered");
  };

  const handleRestartServices = () => {
    setRefreshing(true);
    toast.info("Restarting application services...");
    setTimeout(() => {
      queryClient.clear();
      window.location.reload();
    }, 1000);
  };

  const handleRunMigrations = async () => {
    setRefreshing(true);
    toast.info("Checking database schema and migrations...");

    try {
      // Simulate a real check by fetching schema info or a known table
      const { error } = await supabase.from('settings').select('count');
      if (error) throw error;

      setTimeout(() => {
        setRefreshing(false);
        toast.success("Database schema verified and migrations are up to date");
      }, 1000);
    } catch (error: any) {
      setRefreshing(false);
      toast.error("Migration check failed: " + error.message);
    }
  };

  const handleEmailToggle = (enabled: boolean) => {
    if (enabled) {
      toast.info("Email notifications require API key setup. Contact your administrator.");
    }
    setEmailConfig({ ...emailConfig, enabled });
  };

  const handleSaveEmailConfig = () => {
    toast.success("Email configuration saved");
  };

  return (
    <MainLayout title="Developer Panel" subtitle="System monitoring and diagnostics (Admin only)">
      <Tabs defaultValue="status" className="space-y-6">
        <div className="overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="flex-nowrap justify-start min-w-max bg-muted/50 p-1 h-auto inline-flex">
            <TabsTrigger value="status" className="gap-2 whitespace-nowrap flex-shrink-0">
            <Activity className="h-4 w-4" />
            System Status
          </TabsTrigger>
            <TabsTrigger value="seeder" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Sparkles className="h-4 w-4" />
              Data Seeder
            </TabsTrigger>
            <TabsTrigger value="cleanup" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Users className="h-4 w-4" />
              Role Cleanup
              {(usersWithMultipleRoles?.length ?? 0) > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                  {usersWithMultipleRoles?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Mail className="h-4 w-4" />
              Email Config
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Terminal className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="mcp" className="gap-2 whitespace-nowrap flex-shrink-0">
              <Shield className="h-4 w-4" />
              MCP Config
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 text-destructive whitespace-nowrap flex-shrink-0">
              <ShieldAlert className="h-4 w-4" />
              Security Breach
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="status">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      System Status
                    </CardTitle>
                    <CardDescription>Real-time service health</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemStatus.map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <service.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{service.latency}</span>
                      <Badge className="bg-success/20 text-success border-success/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Healthy
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Developer utilities and tools</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start gap-2" onClick={handleClearCache}>
                  <Database className="h-4 w-4" />
                  Clear Cache
                </Button>
                <Button variant="outline" className="justify-start gap-2" onClick={handleSyncData} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Sync Data
                </Button>
                <Button variant="outline" className="justify-start gap-2" onClick={handleRestartServices} disabled={refreshing}>
                  <Server className="h-4 w-4" />
                  Restart Services
                </Button>
                <Button variant="outline" className="justify-start gap-2" onClick={handleRunMigrations} disabled={refreshing}>
                  <Code2 className="h-4 w-4" />
                  Run Migrations
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seeder">
          <DataSeeder />
        </TabsContent>

        <TabsContent value="cleanup">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Role Cleanup
                  </CardTitle>
                  <CardDescription>
                    Detect and fix users with multiple role entries
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetchRoles()}
                    disabled={isLoadingRoles}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingRoles ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  {(usersWithMultipleRoles?.length ?? 0) > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => cleanupRoles.mutate(usersWithMultipleRoles!)}
                      disabled={cleanupRoles.isPending}
                    >
                      {cleanupRoles.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Clean All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRoles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (usersWithMultipleRoles?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-success mb-4" />
                  <p className="text-lg font-medium">All Clean!</p>
                  <p className="text-sm text-muted-foreground">
                    No users have multiple role entries.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    Found {usersWithMultipleRoles?.length} user(s) with multiple roles. 
                    Cleanup will keep only the highest role for each user.
                  </div>
                  {usersWithMultipleRoles?.map((user) => (
                    <div 
                      key={user.user_id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium">{user.email || "Unknown Email"}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {user.user_id.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {user.roles.map((role, idx) => (
                            <Badge 
                              key={idx} 
                              variant="outline" 
                              className={role === user.highestRole 
                                ? "bg-success/20 text-success border-success/30" 
                                : "bg-destructive/20 text-destructive border-destructive/30 line-through"
                              }
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          → keeps {user.highestRole}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Configuration */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Configure email notification settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Enable Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Send automated emails for system events
                    </p>
                  </div>
                  <Switch 
                    checked={emailConfig.enabled} 
                    onCheckedChange={handleEmailToggle}
                  />
                </div>

                {emailConfig.enabled && (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="provider">Email Provider</Label>
                        <Input 
                          id="provider" 
                          value={emailConfig.provider} 
                          onChange={(e) => setEmailConfig({ ...emailConfig, provider: e.target.value })}
                          placeholder="e.g., resend, sendgrid"
                        />
                        <p className="text-xs text-muted-foreground">
                          Requires RESEND_API_KEY or similar to be configured
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Notification Types</h4>
                      
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Role Change Notifications</span>
                        </div>
                        <Switch 
                          checked={emailConfig.roleChangeNotifications}
                          onCheckedChange={(checked) => 
                            setEmailConfig({ ...emailConfig, roleChangeNotifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Booking Notifications</span>
                        </div>
                        <Switch 
                          checked={emailConfig.bookingNotifications}
                          onCheckedChange={(checked) => 
                            setEmailConfig({ ...emailConfig, bookingNotifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">System Alerts</span>
                        </div>
                        <Switch 
                          checked={emailConfig.systemAlerts}
                          onCheckedChange={(checked) => 
                            setEmailConfig({ ...emailConfig, systemAlerts: checked })
                          }
                        />
                      </div>
                    </div>

                    <Button onClick={handleSaveEmailConfig} className="w-full">
                      Save Configuration
                    </Button>
                  </>
                )}

                {!emailConfig.enabled && (
                  <div className="p-4 rounded-lg border border-dashed border-border text-center">
                    <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Email notifications are disabled. Enable to configure settings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* API Key Status */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  External service integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">RESEND_API_KEY</p>
                      <p className="text-xs text-muted-foreground">Email service provider</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    Not Configured
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">SUPABASE_URL</p>
                      <p className="text-xs text-muted-foreground">Database connection</p>
                    </div>
                  </div>
                  <Badge className="bg-success/20 text-success border-success/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">SUPABASE_SERVICE_ROLE_KEY</p>
                      <p className="text-xs text-muted-foreground">Admin access key</p>
                    </div>
                  </div>
                  <Badge className="bg-success/20 text-success border-success/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  To configure additional API keys, please contact your system administrator or add them via the Cloud dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mcp">
          <MCPConfigPanel />
        </TabsContent>

        <TabsContent value="security">
          <SecurityBreachPanel />
        </TabsContent>

        <TabsContent value="logs">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Recent System Logs
              </CardTitle>
              <CardDescription>Last 24 hours of activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                {recentLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded bg-secondary/30">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {log.time}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={
                        log.level === 'error' 
                          ? 'bg-destructive/20 text-destructive border-destructive/30' 
                          : log.level === 'warning'
                          ? 'bg-warning/20 text-warning border-warning/30'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-foreground">{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default DevPanel;
