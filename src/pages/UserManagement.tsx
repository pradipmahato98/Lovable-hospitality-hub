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
import { 
  Users, 
  Loader2, 
  Search,
  ShieldAlert,
  Shield,
  UserCog,
  User as UserIcon,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

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

const roleConfig: Record<AppRole, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  admin: { label: "Admin", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: ShieldAlert },
  manager: { label: "Manager", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Shield },
  staff: { label: "Staff", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: UserCog },
  user: { label: "User", color: "bg-muted text-muted-foreground border-border", icon: UserIcon },
};

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { isAdmin, isLoading: isLoadingRole } = useIsAdmin();
  const queryClient = useQueryClient();

  // Fetch users with their roles
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, email, first_name, last_name, created_at");

      if (profilesError) throw profilesError;

      // Then get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine them
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

  // Update user role mutation
  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
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
                    filteredUsers?.map((user) => {
                      const RoleIcon = roleConfig[user.role].icon;
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {(user.first_name?.[0] || "") + (user.last_name?.[0] || "") || "U"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {user.first_name || ""} {user.last_name || ""}
                                  {!user.first_name && !user.last_name && "Unnamed User"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {user.user_id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email || "No email"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={roleConfig[user.role].color}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {roleConfig[user.role].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value: AppRole) => 
                                updateRole.mutate({ userId: user.user_id, newRole: value })
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
    </MainLayout>
  );
};

export default UserManagement;