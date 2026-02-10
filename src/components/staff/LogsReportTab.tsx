import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockLogs = [
  { id: 1, action: "User Login", user: "John Doe", details: "Logged in from 192.168.1.1", time: "2024-03-20 09:30 AM", status: "success" },
  { id: 2, action: "Update Reservation", user: "Sarah Smith", details: "Modified RS-12345", time: "2024-03-20 10:15 AM", status: "success" },
  { id: 3, action: "Delete Room", user: "Admin", details: "Removed Room 302", time: "2024-03-20 11:00 AM", status: "warning" },
  { id: 4, action: "Payment Processed", user: "John Doe", details: "Transaction $250.00", time: "2024-03-20 11:45 AM", status: "success" },
  { id: 5, action: "System Update", user: "System", details: "Night audit completed", time: "2024-03-20 12:00 AM", status: "info" },
];

export const LogsReportTab = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Activity Logs
            </CardTitle>
            <CardDescription>Monitor system-wide staff activities and changes.</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{log.details}</TableCell>
                  <TableCell className="text-muted-foreground">{log.time}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      log.status === "success" ? "border-success text-success bg-success/10" :
                      log.status === "warning" ? "border-amber-500 text-amber-500 bg-amber-500/10" :
                      "border-blue-500 text-blue-500 bg-blue-500/10"
                    }>
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
