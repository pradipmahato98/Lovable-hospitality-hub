import { useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  Wrench, Plus, AlertTriangle, Clock, CheckCircle2, XCircle,
  Filter, Search, Bed, Users, FileText, DoorOpen, Loader2
} from "lucide-react";
import { ModuleQuickActions, QuickAction } from "@/components/shared";
import { useMaintenanceRequests, MaintenanceRequest } from "@/hooks/useMaintenanceRequests";
import { Skeleton } from "@/components/ui/skeleton";

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

const Engineering = () => {
  const { data: requests = [], isLoading, createRequest, updateStatus } = useMaintenanceRequests();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    room: "",
    issue: "",
    description: "",
    priority: "medium",
  });

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const matchesSearch =
      req.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.request_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  const handleCreateRequest = () => {
    createRequest.mutate(newRequest, {
      onSuccess: () => {
        setNewRequest({ room: "", issue: "", description: "", priority: "medium" });
        setIsDialogOpen(false);
      },
    });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus.mutate({ id, status: newStatus });
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
        <div className="xl:col-span-3 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Requests", value: stats.total, icon: Wrench, color: "text-muted-foreground" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500" },
              { label: "In Progress", value: stats.inProgress, icon: AlertTriangle, color: "text-blue-500" },
              { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-success" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color}`}>
                        {isLoading ? <Skeleton className="h-8 w-10" /> : s.value}
                      </p>
                    </div>
                    <s.icon className={`h-8 w-8 ${s.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Table */}
          <Card variant="elevated">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Maintenance Requests
                  </CardTitle>
                  <CardDescription>Track and manage repair and maintenance work orders</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />New Request</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Maintenance Request</DialogTitle>
                      <DialogDescription>Submit a new repair or maintenance work order</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="room">Room / Location</Label>
                        <Input id="room" placeholder="e.g., 101, Lobby, Pool Area" value={newRequest.room}
                          onChange={(e) => setNewRequest({ ...newRequest, room: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="issue">Issue</Label>
                        <Input id="issue" placeholder="Brief description of the problem" value={newRequest.issue}
                          onChange={(e) => setNewRequest({ ...newRequest, issue: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Details</Label>
                        <Textarea id="description" placeholder="Provide more details..." value={newRequest.description}
                          onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={newRequest.priority} onValueChange={(v) => setNewRequest({ ...newRequest, priority: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateRequest} disabled={!newRequest.room || !newRequest.issue || createRequest.isPending}>
                        {createRequest.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Create Request"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by room, issue, or ID..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter" />
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
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
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
                            No maintenance requests found. Click "New Request" to create one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRequests.map((request) => {
                          const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
                          const priority = priorityConfig[request.priority as keyof typeof priorityConfig] || priorityConfig.medium;
                          const StatusIcon = status.icon;
                          return (
                            <TableRow key={request.id}>
                              <TableCell className="font-mono text-sm">{request.request_number}</TableCell>
                              <TableCell>{request.room}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{request.issue}</p>
                                  {request.description && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{request.description}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell><Badge className={priority.color}>{priority.label}</Badge></TableCell>
                              <TableCell>
                                <Badge className={status.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />{status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{request.assigned_to || "Unassigned"}</TableCell>
                              <TableCell>
                                <Select value={request.status} onValueChange={(v) => handleStatusChange(request.id, v)}>
                                  <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
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
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <ModuleQuickActions actions={quickActions} variant="list" />
        </div>
      </div>
    </MainLayout>
  );
};

const EngineeringPage = () => (
  <ErrorBoundary>
    <Engineering />
  </ErrorBoundary>
);

export default EngineeringPage;
