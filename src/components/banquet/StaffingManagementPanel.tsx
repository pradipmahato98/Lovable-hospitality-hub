import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Briefcase,
  UserPlus,
  MoreVertical,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { usePersistentPopup } from "@/hooks/usePersistentPopup";
import {
  useEventStaffAssignments,
  useCreateStaffAssignment,
  useDeleteStaffAssignment
} from "@/hooks/useBanquetData";
import { useStaffMembers } from "@/hooks/useStaffMembers";

interface BanquetEvent {
  id: string;
  event_name: string;
  client_name: string;
  event_date: string;
  venue: string;
  guest_count: number;
}

interface StaffingManagementPanelProps {
  events: BanquetEvent[];
}

const roles = [
  "Event Manager",
  "Head Chef",
  "Sous Chef",
  "Server",
  "Bartender",
  "Steward",
  "Security",
  "Technical Support",
];

export function StaffingManagementPanel({ events }: StaffingManagementPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

  const { isBlocking, handlePointerDownOutside, handleEscapeKeyDown } = usePersistentPopup();

  // Data fetching
  const { data: staffMembers = [] } = useStaffMembers();
  const { data: assignments = [], isLoading: assignmentsLoading } = useEventStaffAssignments(
    selectedEventId === "all" ? undefined : selectedEventId
  );

  const createAssignmentMutation = useCreateStaffAssignment();
  const deleteAssignmentMutation = useDeleteStaffAssignment();

  const [newAssignment, setNewAssignment] = useState({
    staff_id: "",
    role: "Server",
    start_time: "09:00",
    end_time: "17:00",
    notes: "",
  });

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a: any) => {
      const staffName = `${a.staff_member?.first_name || ""} ${a.staff_member?.last_name || ""}`.toLowerCase();
      const event = events.find(e => e.id === a.event_id);
      const eventName = event?.event_name.toLowerCase() || "";
      const matchesSearch = staffName.includes(searchQuery.toLowerCase()) ||
                          eventName.includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [assignments, searchQuery, events]);

  const handleCreateAssignment = async () => {
    if (selectedEventId === "all") {
      toast.error("Please select a specific event first");
      return;
    }
    if (!newAssignment.staff_id) {
      toast.error("Please select a staff member");
      return;
    }

    try {
      await createAssignmentMutation.mutateAsync({
        event_id: selectedEventId,
        staff_id: newAssignment.staff_id,
        staff_name: null,
        role: newAssignment.role,
        start_time: newAssignment.start_time,
        end_time: newAssignment.end_time,
        notes: newAssignment.notes || null,
      });
      setAssignmentDialogOpen(false);
      setNewAssignment({
        staff_id: "",
        role: "Server",
        start_time: "09:00",
        end_time: "17:00",
        notes: "",
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteAssignmentMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff or events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-[200px]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Events" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.event_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setAssignmentDialogOpen(true)}
          disabled={selectedEventId === "all"}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Assign Staff
        </Button>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Assignments
            {selectedEventId !== "all" && (
              <Badge variant="secondary" className="ml-2">
                {events.find(e => e.id === selectedEventId)?.event_name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {assignmentsLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading assignments...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {selectedEventId === "all" ? "No assignments found" : "No staff assigned to this event yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((a: any) => {
                  const event = events.find(e => e.id === a.event_id);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {a.staff_member?.first_name} {a.staff_member?.last_name}
                          </span>
                          <span className="text-xs text-muted-foreground uppercase">
                            {a.staff_member?.position}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{event?.event_name || "Unknown Event"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {a.start_time.slice(0, 5)} - {a.end_time.slice(0, 5)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className={`w-48 ${isBlocking ? "animate-shake border-destructive/50" : ""}`}
                            onPointerDownOutside={handlePointerDownOutside}
                            onEscapeKeyDown={handleEscapeKeyDown}
                          >
                            <div className="flex items-center justify-between px-2 py-1.5">
                              <DropdownMenuLabel className="p-0">Actions</DropdownMenuLabel>
                              <DropdownMenuItem className="p-0 h-6 w-6 flex items-center justify-center rounded-full focus:bg-accent focus:text-accent-foreground">
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              </DropdownMenuItem>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteAssignment(a.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Remove Assignment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Staff to Event</DialogTitle>
            <DialogDescription>
              {events.find(e => e.id === selectedEventId)?.event_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Staff Member</Label>
              <Select
                value={newAssignment.staff_id}
                onValueChange={(v) => setNewAssignment(p => ({ ...p, staff_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Search staff members..." />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role for this Event</Label>
              <Select
                value={newAssignment.role}
                onValueChange={(v) => setNewAssignment(p => ({ ...p, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newAssignment.start_time}
                  onChange={(e) => setNewAssignment(p => ({ ...p, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newAssignment.end_time}
                  onChange={(e) => setNewAssignment(p => ({ ...p, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                placeholder="Specific instructions..."
                value={newAssignment.notes}
                onChange={(e) => setNewAssignment(p => ({ ...p, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssignment}>Assign Staff</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
