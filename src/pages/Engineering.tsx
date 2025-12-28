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
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  XCircle,
  Filter,
  Search,
} from "lucide-react";

interface MaintenanceRequest {
  id: string;
  room: string;
  issue: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assignedTo: string;
  createdAt: string;
  completedAt?: string;
}

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

const mockRequests: MaintenanceRequest[] = [
  {
    id: "MNT-001",
    room: "101",
    issue: "AC Not Working",
    description: "Air conditioning unit not cooling properly",
    priority: "high",
    status: "in_progress",
    assignedTo: "John Smith",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "MNT-002",
    room: "205",
    issue: "Leaky Faucet",
    description: "Bathroom sink faucet is dripping",
    priority: "medium",
    status: "pending",
    assignedTo: "",
    createdAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "MNT-003",
    room: "312",
    issue: "Light Fixture",
    description: "Bedroom light flickering intermittently",
    priority: "low",
    status: "completed",
    assignedTo: "Mike Johnson",
    createdAt: "2024-01-14T14:00:00Z",
    completedAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "MNT-004",
    room: "Lobby",
    issue: "Elevator Malfunction",
    description: "Elevator B stuck on 3rd floor",
    priority: "urgent",
    status: "in_progress",
    assignedTo: "External Vendor",
    createdAt: "2024-01-15T11:00:00Z",
  },
];

const Engineering = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>(mockRequests);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    room: "",
    issue: "",
    description: "",
    priority: "medium" as MaintenanceRequest["priority"],
  });

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const matchesSearch =
      req.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  const handleCreateRequest = () => {
    const newId = `MNT-${String(requests.length + 1).padStart(3, "0")}`;
    const request: MaintenanceRequest = {
      id: newId,
      ...newRequest,
      status: "pending",
      assignedTo: "",
      createdAt: new Date().toISOString(),
    };
    setRequests([request, ...requests]);
    setNewRequest({ room: "", issue: "", description: "", priority: "medium" });
    setIsDialogOpen(false);
  };

  const handleStatusChange = (id: string, newStatus: MaintenanceRequest["status"]) => {
    setRequests(
      requests.map((req) =>
        req.id === id
          ? {
              ...req,
              status: newStatus,
              completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
            }
          : req
      )
    );
  };

  return (
    <MainLayout title="Engineering" subtitle="Maintenance and repair management">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

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
                <Button>
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
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No maintenance requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => {
                    const StatusIcon = statusConfig[request.status].icon;
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">{request.id}</TableCell>
                        <TableCell>{request.room}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.issue}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {request.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityConfig[request.priority].color}>
                            {priorityConfig[request.priority].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[request.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[request.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {request.assignedTo || "Unassigned"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={request.status}
                            onValueChange={(value: MaintenanceRequest["status"]) =>
                              handleStatusChange(request.id, value)
                            }
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
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Engineering;
