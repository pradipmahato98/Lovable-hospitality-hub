import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Clock, CheckCircle2, XCircle } from "lucide-react";
import { MaintenanceRequest } from "@/hooks/useMaintenance";

const priorityConfig = {
  low: { label: "Low", color: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", color: "bg-blue-500/20 text-blue-400" },
  high: { label: "High", color: "bg-amber-500/20 text-amber-400" },
  urgent: { label: "Urgent", color: "bg-destructive/20 text-destructive" },
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-500/20 text-blue-400", icon: Wrench },
  completed: { label: "Completed", color: "bg-success/20 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/20 text-destructive", icon: XCircle },
};

interface MaintenanceTableProps {
  requests: MaintenanceRequest[];
  onStatusChange: (id: string, status: string) => void;
}

export const MaintenanceTable = ({ requests, onStatusChange }: MaintenanceTableProps) => {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No maintenance requests found
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => {
              const StatusIcon = statusConfig[request.status as keyof typeof statusConfig].icon;
              return (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-sm">{request.id.split('-')[0]}</TableCell>
                  <TableCell>{request.room?.room_number || request.location || "N/A"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.issue}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {request.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityConfig[request.priority as keyof typeof priorityConfig].color}>
                      {priorityConfig[request.priority as keyof typeof priorityConfig].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[request.status as keyof typeof statusConfig].color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[request.status as keyof typeof statusConfig].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.assignedTo || "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={request.status}
                      onValueChange={(value) => onStatusChange(request.id, value)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
  );
};
