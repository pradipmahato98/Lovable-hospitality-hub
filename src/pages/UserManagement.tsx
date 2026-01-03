import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Loader2, 
  Search,
  ShieldAlert,
  Shield,
  UserCog,
  User as UserIcon,
  History,
  Clock,
  AlertCircle,
  Filter,
  Calendar,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_PRIORITY: Record<AppRole, number> = {
  user: 0,
  staff: 1,
  manager: 2,
  admin: 3,
};

const getHighestRole = (roles: AppRole[]): AppRole => {
  if (roles.length === 0) return "user";
  return roles.reduce((best, current) => 
    ROLE_PRIORITY[current] > ROLE_PRIORITY[best] ? current : best
  );
};

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: AppRole;
  allRoles: AppRole[];
  hasMultipleRoles: boolean;
  created_at: string;
}

interface RoleChangeAudit {
  id: string;
  user_id: string;
  changed_by_user_id: string;
  old_role: string;
  new_role: string;
  reason: string | null;
  created_at: string;
  user_email?: string;
  changed_by_email?: string;
}

const roleConfig: Record<AppRole, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  admin: { label: "Admin", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: ShieldAlert },
  manager: { label: "Manager", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Shield },
  staff: { label: "Staff", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: UserCog },
  user: { label: "User", color: "bg-muted text-muted-foreground border-border", icon: UserIcon },
};

const UserManagement = () => {
const [searchQuery, setSearchQuery] = useState("");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>("all");
  const [auditDateFilter, setAuditDateFilter] = useState<string>("all");
  const { isAdmin, isLoading: isLoadingRole } = useIsAdmin();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch users with their roles
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, email, first_name, last_name, created_at");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRoles = roles.filter(r => r.user_id === profile.user_id);
        const allRoles = userRoles.map(r => r.role as AppRole);
        const hasMultipleRoles = allRoles.length > 1;
        const highestRole = getHighestRole(allRoles);
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: highestRole,
          allRoles,
          hasMultipleRoles,
          created_at: profile.created_at,
        };
      });

      return usersWithRoles;
    },
    enabled: isAdmin,
  });

  // Fetch role change audit logs
  const { data: auditLogs, isLoading: isLoadingAudit } = useQuery({
    queryKey: ["role-change-audit"],
    queryFn: async () => {
      const { data: audits, error: auditError } = await supabase
        .from("role_change_audit")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (auditError) throw auditError;

      // Fetch profile info for user_id and changed_by_user_id
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email");

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);

      return audits.map(audit => ({
        ...audit,
        user_email: profileMap.get(audit.user_id) || "Unknown",
        changed_by_email: profileMap.get(audit.changed_by_user_id) || "Unknown",
      })) as RoleChangeAudit[];
    },
    enabled: isAdmin,
  });

  // Update user role mutation with audit logging
  const updateRole = useMutation({
    mutationFn: async ({ userId, oldRole, newRole }: { userId: string; oldRole: AppRole; newRole: AppRole }) => {
      // Normalize to exactly ONE role row per user to prevent duplicates.
      // Some users may already have multiple role rows from earlier versions.
      const { data: existingRoles, error: rolesFetchError } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", userId);

      if (rolesFetchError) throw rolesFetchError;

      const roles = (existingRoles ?? []).map((r) => r.role as AppRole);
      const alreadyHasNewRole = roles.includes(newRole);

      // Ensure the desired role exists first (so we never end up with 0 roles due to a failed insert).
      if (!alreadyHasNewRole) {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (insertError) throw insertError;
      }

      // Remove any other roles for this user.
      const { error: cleanupError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .neq("role", newRole);

      if (cleanupError) throw cleanupError;

      // Only log audit/notify if the displayed role actually changed.
      if (oldRole !== newRole) {
        const { error: auditError } = await supabase
          .from("role_change_audit")
          .insert({
            user_id: userId,
            changed_by_user_id: user?.id || "",
            old_role: oldRole,
            new_role: newRole,
            reason: `Role changed from ${oldRole} to ${newRole}`,
          });

        if (auditError) throw auditError;

        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            title: "Role Updated",
            message: `Your role has been changed from ${roleConfig[oldRole].label} to ${roleConfig[newRole].label}`,
            type: "role_change",
            category: "system",
          });

        if (notifError) console.error("Failed to create notification:", notifError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ["role-change-audit"] });
      toast.success("User role updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });

  // Filter users based on search
  const filteredUsers = users?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    );
  });

  // Filter audit logs
  const filteredAuditLogs = auditLogs?.filter(log => {
    const searchLower = auditSearchQuery.toLowerCase();
    const matchesSearch = !auditSearchQuery || 
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.changed_by_email?.toLowerCase().includes(searchLower);
    
    const matchesRole = auditRoleFilter === "all" || 
      log.old_role === auditRoleFilter || 
      log.new_role === auditRoleFilter;
    
    const logDate = new Date(log.created_at);
    const now = new Date();
    let matchesDate = true;
    if (auditDateFilter === "today") {
      matchesDate = logDate.toDateString() === now.toDateString();
    } else if (auditDateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = logDate >= weekAgo;
    } else if (auditDateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = logDate >= monthAgo;
    }
    
    return matchesSearch && matchesRole && matchesDate;
  });

  // Redirect non-admins
  if (isLoadingRole) {
    return (
      <MainLayout title="User Management" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout title="User Management" subtitle="Manage user roles and permissions (Admin only)">
      <div className="mb-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
        <ShieldAlert className="h-4 w-4" />
        <span>You are viewing admin-only settings. Role changes take effect immediately.</span>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Users
                  </CardTitle>
                  <CardDescription>
                    View and manage user roles across the system
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Change Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers?.map((userItem) => {
                          const RoleIcon = roleConfig[userItem.role].icon;
                          return (
                            <TableRow key={userItem.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-primary">
                                      {(userItem.first_name?.[0] || "") + (userItem.last_name?.[0] || "") || "U"}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {userItem.first_name || ""} {userItem.last_name || ""}
                                      {!userItem.first_name && !userItem.last_name && "Unnamed User"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      ID: {userItem.user_id.slice(0, 8)}...
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {userItem.email || "No email"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={roleConfig[userItem.role].color}>
                                    <RoleIcon className="h-3 w-3 mr-1" />
                                    {roleConfig[userItem.role].label}
                                  </Badge>
                                  {userItem.hasMultipleRoles && (
                                    <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      {userItem.allRoles.length} roles
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={userItem.role}
                                  onValueChange={(value: AppRole) => 
                                    updateRole.mutate({ 
                                      userId: userItem.user_id, 
                                      oldRole: userItem.role,
                                      newRole: value 
                                    })
                                  }
                                  disabled={updateRole.isPending}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Role Change Audit Log
                  </CardTitle>
                  <CardDescription>
                    Track all role changes for security and compliance
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={auditRoleFilter} onValueChange={setAuditRoleFilter}>
                    <SelectTrigger className="w-full sm:w-36">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={auditDateFilter} onValueChange={setAuditDateFilter}>
                    <SelectTrigger className="w-full sm:w-36">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAudit ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Changed By</TableHead>
                        <TableHead>Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuditLogs?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No audit logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAuditLogs?.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                              </div>
                            </TableCell>
                            <TableCell>{log.user_email}</TableCell>
                            <TableCell className="text-muted-foreground">{log.changed_by_email}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={roleConfig[log.old_role as AppRole]?.color || "bg-muted"}>
                                  {roleConfig[log.old_role as AppRole]?.label || log.old_role}
                                </Badge>
                                <span className="text-muted-foreground">→</span>
                                <Badge variant="outline" className={roleConfig[log.new_role as AppRole]?.color || "bg-muted"}>
                                  {roleConfig[log.new_role as AppRole]?.label || log.new_role}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default UserManagement;
