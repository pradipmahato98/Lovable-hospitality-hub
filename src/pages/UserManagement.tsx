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

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: AppRole;
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
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: (userRole?.role as AppRole) || "user",
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
      // Update the role
      const { error: updateError } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Log the audit
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

      // Create a notification
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
                                <Badge variant="outline" className={roleConfig[userItem.role].color}>
                                  <RoleIcon className="h-3 w-3 mr-1" />
                                  {roleConfig[userItem.role].label}
                                </Badge>
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
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Role Change Audit Log
              </CardTitle>
              <CardDescription>
                Track all role changes for security and compliance
              </CardDescription>
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
                      {auditLogs?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No audit logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs?.map((log) => (
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
