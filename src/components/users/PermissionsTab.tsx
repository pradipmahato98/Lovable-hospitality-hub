import { useRolePermissions, useUpdateRolePermission, AppRole, roleConfig } from "@/hooks/useUsersWithRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Shield, Loader2, Info } from "lucide-react";
import { RoleBadge } from "./RoleBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ALL_PERMISSIONS = [
  "guests:view", "guests:manage", "reservations:view", "reservations:manage",
  "front_desk:view", "front_desk:manage", "housekeeping:view", "housekeeping:manage",
  "engineering:view", "engineering:manage", "pos:view", "pos:manage",
  "inventory:view", "inventory:manage", "channel_manager:view", "channel_manager:manage",
  "finance:view", "finance:manage", "banquet:view", "banquet:manage",
  "reports:view", "operations:night_audit", "operations:day_close",
  "admin:staff", "admin:hr"
];

export const PermissionsTab = () => {
  const { data: permissions, isLoading } = useRolePermissions();
  const updatePermission = useUpdateRolePermission();

  const hasPermission = (role: AppRole, permission: string) => {
    if (role === 'admin') return true;
    return permissions?.some(p => p.role === role && p.permission === permission);
  };

  const handleToggle = (role: AppRole, permission: string, checked: boolean) => {
    updatePermission.mutate({
      role,
      permission,
      action: checked ? 'add' : 'remove'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const roles: AppRole[] = ['manager', 'staff', 'user'];

  return (
    <div className="space-y-6">
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle>Role-Based Access Control</AlertTitle>
        <AlertDescription>
          Admins have 'all' permissions by default and cannot be modified. Managers, Staff, and Users can have their granular permissions adjusted here.
        </AlertDescription>
      </Alert>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions Matrix
          </CardTitle>
          <CardDescription>
            Configure granular access for each system role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px]">Permission</TableHead>
                  {roles.map(role => (
                    <TableHead key={role} className="text-center">
                      <RoleBadge role={role} />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_PERMISSIONS.map(permission => (
                  <TableRow key={permission} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium font-mono text-xs uppercase tracking-wider">
                      {permission.replace(':', ' ')}
                    </TableCell>
                    {roles.map(role => (
                      <TableCell key={`${role}-${permission}`} className="text-center">
                        <Switch
                          checked={hasPermission(role, permission)}
                          onCheckedChange={(checked) => handleToggle(role, permission, checked)}
                          disabled={updatePermission.isPending}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
