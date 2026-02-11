import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Filter, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useIsManager } from "@/hooks/useUserRole";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const LogsReportTab = () => {
  const { profile } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isManager } = useIsManager();
  const [searchTerm, setSearchTerm] = useState("");
  const [staffFilter, setStaffFilter] = useState<string>(
    isAdmin || isManager ? "all" : profile?.user_id || "all"
  );

  const { data: logs, isLoading, error: logsError } = useQuery({
    queryKey: ["audit_logs", staffFilter],
    queryFn: async () => {
      // Fetch logs and profiles separately if join fails, but try join first
      let query = supabase
        .from("audit_log")
        .select(`
          id,
          action,
          entity_type,
          created_at,
          new_values,
          user_id
        `);

      if (staffFilter !== "all") {
        query = query.eq("user_id", staffFilter);
      }

      const { data: logsData, error: logsError } = await query
        .order("created_at", { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Get unique user IDs from logs
      const userIds = Array.from(new Set(logsData.map(l => l.user_id).filter(Boolean)));

      // Fetch profiles for these users
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);

      // Join in memory
      return logsData.map(log => ({
        ...log,
        profiles: profilesData?.find(p => p.user_id === log.user_id)
      }));
    },
    retry: 1,
  });

  const { data: staffMembers } = useQuery({
    queryKey: ["staff_members_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name");
      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = logs?.filter(log => {
    const actionMatch = log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const userName = `${log.profiles?.first_name || ""} ${log.profiles?.last_name || ""}`.toLowerCase();
    const userMatch = userName.includes(searchTerm.toLowerCase());
    return actionMatch || userMatch;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Activity Logs
            </CardTitle>
            <CardDescription>Monitor system-wide staff activities and changes.</CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {(isAdmin || isManager) && (
              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffMembers?.map((staff) => (
                    <SelectItem key={staff.user_id} value={staff.user_id}>
                      {staff.first_name} {staff.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-xs text-muted-foreground">Fetching activity logs...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logsError ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-destructive">
                    <div className="flex flex-col items-center gap-1">
                      <p>Failed to load logs</p>
                      <p className="text-xs opacity-70">{(logsError as any).message}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLogs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No activity logs found for the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>
                      {log.profiles?.first_name} {log.profiles?.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.entity_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(log.created_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground text-xs font-mono">
                      {log.new_values ? (
                        <span title={JSON.stringify(log.new_values, null, 2)}>
                          {JSON.stringify(log.new_values)}
                        </span>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
