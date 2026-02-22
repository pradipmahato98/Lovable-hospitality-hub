import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  Users,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Mail,
  Fingerprint,
  MoreVertical
} from "lucide-react";
import { UserWithRole, AppRole, roleConfig, useBlockUser } from "@/hooks/useUsersWithRoles";
import { RoleBadge, MultiRoleBadge } from "./RoleBadge";
import { TableSkeleton } from "@/components/skeletons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

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
  const blockUser = useBlockUser();

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
                User Control Center
              </CardTitle>
              <CardDescription>
                Comprehensive management for user accounts and access
              </CardDescription>
              <Badge variant="outline" className="mt-2 text-[10px] font-bold uppercase tracking-wider">User Control</Badge>
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
          <TableSkeleton columns={5} rows={5} />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((userItem) => (
                    <TableRow key={userItem.id} className={userItem.is_blocked ? "bg-destructive/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${userItem.is_blocked ? 'bg-destructive/20' : 'bg-primary/20'}`}>
                            <span className={`text-sm font-semibold ${userItem.is_blocked ? 'text-destructive' : 'text-primary'}`}>
                              {(userItem.first_name?.[0] || "") + (userItem.last_name?.[0] || "") || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {userItem.first_name || ""} {userItem.last_name || ""}
                              {!userItem.first_name && !userItem.last_name && "Unnamed User"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {userItem.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {userItem.is_blocked ? (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldAlert className="h-3 w-3" /> Blocked
                          </Badge>
                        ) : (
                          <Badge className="bg-success/20 text-success border-success/30 gap-1">
                            <ShieldCheck className="h-3 w-3" /> Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RoleBadge role={userItem.role} />
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
                          <SelectTrigger className="w-32 h-8">
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
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSelectedUser(userItem)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={userItem.is_blocked ? "text-success" : "text-destructive"}
                              onClick={() => blockUser.mutate({ userId: userItem.user_id, is_blocked: !userItem.is_blocked })}
                            >
                              {userItem.is_blocked ? (
                                <><ShieldCheck className="mr-2 h-4 w-4" /> Unblock User</>
                              ) : (
                                <><ShieldAlert className="mr-2 h-4 w-4" /> Block User</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Full profile information for {selectedUser?.first_name} {selectedUser?.last_name}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-6 p-4 rounded-xl bg-secondary/30">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                  {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.first_name} {selectedUser.last_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleBadge role={selectedUser.role} />
                    {selectedUser.is_blocked && <Badge variant="destructive">Blocked</Badge>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email Address
                  </p>
                  <p className="text-sm font-medium">{selectedUser.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Member Since
                  </p>
                  <p className="text-sm font-medium">{format(new Date(selectedUser.created_at), "PPP")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Fingerprint className="h-3 w-3" /> Internal ID
                  </p>
                  <p className="text-xs font-mono">{selectedUser.user_id}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-warning" /> Security Context
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Account Status:</span>
                    <span className={selectedUser.is_blocked ? "text-destructive font-bold" : "text-success font-bold"}>
                      {selectedUser.is_blocked ? "Deactivated" : "Verified"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Multiple Roles:</span>
                    <span>{selectedUser.hasMultipleRoles ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
