import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, History, ShieldAlert, Loader2 } from "lucide-react";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { useUsersWithRoles, useRoleChangeAudit, useUpdateUserRole, AppRole } from "@/hooks/useUsersWithRoles";
import { UsersTable, AuditLogTable } from "@/components/users";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>("all");
  const [auditDateFilter, setAuditDateFilter] = useState<string>("all");
  const { isAdmin, isLoading: isLoadingRole } = useIsAdmin();

  const { data: users, isLoading: isLoadingUsers } = useUsersWithRoles(isAdmin);
  const { data: auditLogs, isLoading: isLoadingAudit } = useRoleChangeAudit(isAdmin);
  const updateRole = useUpdateUserRole();

  const handleRoleChange = (userId: string, oldRole: AppRole, newRole: AppRole) => {
    updateRole.mutate({ userId, oldRole, newRole });
  };

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
      <ErrorBoundary>
        <div className="mb-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
          <ShieldAlert className="h-4 w-4" />
          <span>You are viewing admin-only settings. Role changes take effect immediately.</span>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <div className="overflow-x-auto pb-1 scrollbar-hide">
            <TabsList className="flex-nowrap justify-start w-full bg-muted/50 p-1 h-auto inline-flex">
              <TabsTrigger value="users" className="gap-2 whitespace-nowrap">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-2 whitespace-nowrap">
                <History className="h-4 w-4" />
                Audit Log
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users">
            <UsersTable
              users={users}
              isLoading={isLoadingUsers}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRoleChange={handleRoleChange}
              isUpdating={updateRole.isPending}
            />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogTable
              logs={auditLogs}
              isLoading={isLoadingAudit}
              searchQuery={auditSearchQuery}
              roleFilter={auditRoleFilter}
              dateFilter={auditDateFilter}
              onSearchChange={setAuditSearchQuery}
              onRoleFilterChange={setAuditRoleFilter}
              onDateFilterChange={setAuditDateFilter}
            />
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </MainLayout>
  );
};

export default UserManagement;
