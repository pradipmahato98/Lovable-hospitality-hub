import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, Users, Eye, Ban, ShieldCheck } from "lucide-react";
import { UserWithRole, AppRole, roleConfig, useToggleUserBlock } from "@/hooks/useUsersWithRoles";
import { useState } from "react";
import { format } from "date-fns";
import { RoleBadge, MultiRoleBadge } from "./RoleBadge";
import { TableSkeleton } from "@/components/skeletons";

interface UsersTableProps {
  users: UserWithRole[] | undefined;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRoleChange: (userId: string, oldRole: AppRole, newRole: AppRole) => void;
  isUpdating: boolean;
}

export const UsersTable = ({
  users,
  isLoading,
  searchQuery,
  onSearchChange,
  onRoleChange,
  isUpdating,
}: UsersTableProps) => {
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const toggleBlock = useToggleUserBlock();

  const filteredUsers = users?.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users
              </CardTitle>
              <CardDescription>
                View and manage user roles across the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider rounded-full animate-pulse">
              <div className="w-1.5 h-1.5 bg-success rounded-full" />
              Live
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton columns={4} rows={5} />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                  filteredUsers?.map((userItem) => (
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
                          <RoleBadge role={userItem.role} />
                          {userItem.hasMultipleRoles && (
                            <MultiRoleBadge count={userItem.allRoles.length} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={userItem.role}
                          onValueChange={(value: AppRole) =>
                            onRoleChange(userItem.user_id, userItem.role, value)
                          }
                          disabled={isUpdating}
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!userItem.is_blocked}
                            onCheckedChange={(checked) => toggleBlock.mutate({ userId: userItem.user_id, isBlocked: !checked })}
                          />
                          <span className="text-xs text-muted-foreground">
                            {userItem.is_blocked ? "Blocked" : "Active"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(userItem)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the user account.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                  {(selectedUser.first_name?.[0] || "") + (selectedUser.last_name?.[0] || "") || "U"}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">User ID</p>
                  <p className="text-sm font-mono">{selectedUser.user_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Joined Date</p>
                  <p className="text-sm">
                    {format(new Date(selectedUser.created_at), "PPP")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Current Role</p>
                  <Badge variant="outline" className="capitalize">
                    {selectedUser.role}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Account Status</p>
                  <Badge variant={selectedUser.is_blocked ? "destructive" : "success"}>
                    {selectedUser.is_blocked ? "Blocked" : "Active"}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <Button
                  variant={selectedUser.is_blocked ? "outline" : "destructive"}
                  className="gap-2"
                  onClick={() => {
                    toggleBlock.mutate({ userId: selectedUser.user_id, isBlocked: !selectedUser.is_blocked });
                    setSelectedUser(null);
                  }}
                >
                  {selectedUser.is_blocked ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  {selectedUser.is_blocked ? "Unblock User" : "Block User"}
                </Button>
                <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
