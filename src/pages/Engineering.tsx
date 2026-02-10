import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Wrench, 
  Plus, 
  Filter,
  Search,
  Bed,
  Users,
  FileText,
  DoorOpen
} from "lucide-react";
import { ModuleQuickActions, QuickAction } from "@/components/shared";
import { EngineeringStats } from "@/components/engineering/EngineeringStats";
import { MaintenanceTable } from "@/components/engineering/MaintenanceTable";
import { useMaintenance, MaintenanceRequest } from "@/hooks/useMaintenance";

const Engineering = () => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    room: "",
    issue: "",
    description: "",
    priority: "medium" as MaintenanceRequest["priority"],
  });

  const { data: requests = [], isLoading, createRequest, updateRequestStatus } = useMaintenance({ status: filterStatus });

  const filteredRequests = requests.filter((req) => {
    const location = req.room?.room_number || req.location || "";
    const matchesSearch =
      location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  const handleCreateRequest = async () => {
    try {
      await createRequest.mutateAsync({
        location: newRequest.room, // Simplified for now
        issue: newRequest.issue,
        description: newRequest.description,
        priority: newRequest.priority,
        status: "pending",
      });
      toast.success("Maintenance request created");
      setNewRequest({ room: "", issue: "", description: "", priority: "medium" });
      setIsDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error("Failed to create request: " + message);
    }
  };

  const handleStatusChange = (id: string, newStatus: MaintenanceRequest["status"]) => {
    updateRequestStatus.mutate({ id, status: newStatus });
  };

  const quickActions: QuickAction[] = [
    { icon: Bed, label: "View Rooms", to: "/rooms", color: "text-blue-400" },
    { icon: DoorOpen, label: "Housekeeping", to: "/housekeeping", color: "text-cyan-400" },
    { icon: Users, label: "Assign Staff", to: "/staff", color: "text-purple-400" },
    { icon: FileText, label: "Generate Report", to: "/reports", color: "text-primary" },
  ];

  return (
    <MainLayout title="Engineering" subtitle="Maintenance and repair management">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          <EngineeringStats stats={stats} />

          {/* Main Content */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Requests
              </CardTitle>
              <CardDescription>
                Track and manage repair and maintenance work orders
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Maintenance Request</DialogTitle>
                  <DialogDescription>
                    Submit a new repair or maintenance work order
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="room">Room / Location</Label>
                    <Input
                      id="room"
                      placeholder="e.g., 101, Lobby, Pool Area"
                      value={newRequest.room}
                      onChange={(e) => setNewRequest({ ...newRequest, room: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue">Issue</Label>
                    <Input
                      id="issue"
                      placeholder="Brief description of the problem"
                      value={newRequest.issue}
                      onChange={(e) => setNewRequest({ ...newRequest, issue: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Details</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide more details about the issue..."
                      value={newRequest.description}
                      onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newRequest.priority}
                      onValueChange={(value: MaintenanceRequest["priority"]) =>
                        setNewRequest({ ...newRequest, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRequest} disabled={!newRequest.room || !newRequest.issue}>
                    Create Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by room, issue, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <MaintenanceTable
            requests={filteredRequests}
            onStatusChange={(id, status) => handleStatusChange(id, status as MaintenanceRequest["status"])}
          />
        </CardContent>
      </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <ModuleQuickActions actions={quickActions} variant="list" />
        </div>
      </div>
    </MainLayout>
  );
};

export default Engineering;
