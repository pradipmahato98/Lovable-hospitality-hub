import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  ShieldCheck,
  Key,
  MoreVertical,
  UserPlus,
  Ban,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api-bridge";
import { useToast } from "@/hooks/use-toast";

const MOCK_USERS = [
  { id: "1", email: "admin@luxestay.com", role: "admin", status: "active", lastSignIn: "2 mins ago" },
  { id: "2", email: "manager@luxestay.com", role: "manager", status: "active", lastSignIn: "1 hour ago" },
  { id: "3", email: "staff@luxestay.com", role: "staff", status: "active", lastSignIn: "5 hours ago" },
  { id: "4", email: "guest_user@gmail.com", role: "guest", status: "blocked", lastSignIn: "2 days ago" },
];

export const AuthManager = () => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Try to fetch from profiles table via api bridge as fallback for Auth management
        const { data: profiles, error } = await (await api.from('profiles')).select('*');

        if (!error && profiles) {
          setUsers(profiles.map((u: any) => ({
            id: u.id,
            email: u.email,
            role: 'unknown', // Roles are in user_roles table
            status: u.is_blocked ? 'blocked' : 'active',
            lastSignIn: 'Live'
          })));
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Users</p>
                <p className="text-2xl font-bold">1,245</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-full">
                <ShieldCheck className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Active Sessions</p>
                <p className="text-2xl font-bold">84</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-full">
                <Key className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Failed Logins (24h)</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage your application users and their roles</CardDescription>
          </div>
          <Button className="gap-2" onClick={() => toast.info("User Invitation feature is coming soon.")}>
            <UserPlus className="h-4 w-4" /> Invite User
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'success' : 'destructive'} className="capitalize">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.lastSignIn}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <RefreshCw className="h-4 w-4" /> Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive">
                          <Ban className="h-4 w-4" /> Block User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
