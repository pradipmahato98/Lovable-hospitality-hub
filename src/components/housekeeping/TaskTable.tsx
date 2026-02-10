import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HousekeepingTask } from "@/hooks/useHousekeeping";

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", color: "bg-amber-500/20 text-amber-400" },
  completed: { label: "Completed", color: "bg-success/20 text-success" },
  cancelled: { label: "Cancelled", color: "bg-destructive/20 text-destructive" },
};

interface TaskTableProps {
  tasks: HousekeepingTask[];
  onStatusChange: (id: string, status: string) => void;
}

export const TaskTable = ({ tasks, onStatusChange }: TaskTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Room</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Scheduled</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No tasks for today
            </TableCell>
          </TableRow>
        ) : (
          tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.room?.room_number || "-"}</TableCell>
              <TableCell className="capitalize">{task.task_type.replace("_", " ")}</TableCell>
              <TableCell>
                <Badge className={
                  task.priority === "urgent" ? "bg-destructive/20 text-destructive" :
                  task.priority === "high" ? "bg-amber-500/20 text-amber-400" :
                  "bg-muted text-muted-foreground"
                }>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={taskStatusConfig[task.status]?.color || ""}>
                  {taskStatusConfig[task.status]?.label || task.status}
                </Badge>
              </TableCell>
              <TableCell>{task.scheduled_time || "Any time"}</TableCell>
              <TableCell>
                <Select
                  value={task.status}
                  onValueChange={(v) => onStatusChange(task.id, v)}
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
          ))
        )}
      </TableBody>
    </Table>
  );
};
