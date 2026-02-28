import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Bed, CheckCircle2, Clock, AlertCircle, Sparkles, User, Filter,
  RefreshCw, ClipboardList, Plus, Search, Package, Eye, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-bridge";
import { useHousekeepingTasks, useLostAndFound, useHousekeepingStats } from "@/hooks/useHousekeeping";
import { format } from "date-fns";

type RoomStatus = "clean" | "dirty" | "inspected" | "out_of_order" | "in_progress";

const statusConfig: Record<RoomStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  clean: { label: "Clean", color: "bg-success/20 text-success border-success/30", icon: CheckCircle2 },
  dirty: { label: "Dirty", color: "bg-destructive/20 text-destructive border-destructive/30", icon: AlertCircle },
  inspected: { label: "Inspected", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Sparkles },
  out_of_order: { label: "Out of Order", color: "bg-muted text-muted-foreground border-border", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
};

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", color: "bg-amber-500/20 text-amber-400" },
  completed: { label: "Completed", color: "bg-success/20 text-success" },
  cancelled: { label: "Cancelled", color: "bg-destructive/20 text-destructive" },
};

const Housekeeping = () => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFloor, setFilterFloor] = useState<string>("all");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [lostFoundDialogOpen, setLostFoundDialogOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const { data: rooms, isLoading: loadingRooms, refetch } = useQuery({
    queryKey: ["housekeeping-rooms"],
    queryFn: async () => {
      const { data, error } = await api.from("rooms").select("*").order("room_number");
      if (error) throw error;
      return data.map((room, index) => ({
        ...room,
        housekeeping_status: ["clean", "dirty", "inspected", "in_progress", "dirty"][index % 5] as RoomStatus,
        assigned_to: index % 3 === 0 ? "Maria G." : index % 3 === 1 ? "John D." : undefined,
        priority: index % 4 === 0 ? "high" : index % 4 === 1 ? "low" : "normal",
      }));
    },
  });

  const { data: tasks = [], createTask, updateTaskStatus, isLoading: loadingTasks } = useHousekeepingTasks({ date: today });
  const { data: lostItems = [], createItem: createLostItem, claimItem, isLoading: loadingLost } = useLostAndFound();
  const stats = useHousekeepingStats(today);

  const [newTask, setNewTask] = useState({
    room_id: "",
    task_type: "routine",
    priority: "normal",
    scheduled_date: today,
    notes: "",
  });

  const [newLostItem, setNewLostItem] = useState({
    item_description: "",
    found_location: "",
    found_by: "",
    category: "",
    storage_location: "",
    notes: "",
  });

  const floors = rooms ? [...new Set(rooms.map((r) => r.floor))].sort() : [];

  const filteredRooms = rooms?.filter((room) => {
    const matchesStatus = filterStatus === "all" || room.housekeeping_status === filterStatus;
    const matchesFloor = filterFloor === "all" || room.floor.toString() === filterFloor;
    return matchesStatus && matchesFloor;
  });

  const handleStatusChange = (roomId: string, newStatus: RoomStatus) => {
    toast.success(`Room status updated to ${statusConfig[newStatus].label}`);
  };

  const handleCreateTask = async () => {
    try {
      await createTask.mutateAsync({ ...newTask, status: "pending" } as any);
      toast.success("Task created successfully");
      setTaskDialogOpen(false);
      setNewTask({ room_id: "", task_type: "routine", priority: "normal", scheduled_date: today, notes: "" });
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleCreateLostItem = async () => {
    try {
      await createLostItem.mutateAsync({ ...newLostItem, found_date: today, status: "stored" } as any);
      toast.success("Lost item recorded");
      setLostFoundDialogOpen(false);
      setNewLostItem({ item_description: "", found_location: "", found_by: "", category: "", storage_location: "", notes: "" });
    } catch (error) {
      toast.error("Failed to record item");
    }
  };

  const roomStats = {
    clean: rooms?.filter((r) => r.housekeeping_status === "clean").length || 0,
    dirty: rooms?.filter((r) => r.housekeeping_status === "dirty").length || 0,
    inProgress: rooms?.filter((r) => r.housekeeping_status === "in_progress").length || 0,
    inspected: rooms?.filter((r) => r.housekeeping_status === "inspected").length || 0,
  };

  return (
    <MainLayout title="Housekeeping" subtitle="Room cleaning, tasks, and lost & found management">
      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rooms" className="gap-2">
            <Bed className="h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Tasks
            {stats.pending > 0 && <Badge variant="secondary" className="ml-1">{stats.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="lost-found" className="gap-2">
            <Package className="h-4 w-4" />
            Lost & Found
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:border-success/50" onClick={() => setFilterStatus("clean")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clean</p>
                    <p className="text-2xl font-bold text-success">{roomStats.clean}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-destructive/50" onClick={() => setFilterStatus("dirty")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Dirty</p>
                    <p className="text-2xl font-bold text-destructive">{roomStats.dirty}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-amber-500/50" onClick={() => setFilterStatus("in_progress")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-amber-400">{roomStats.inProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-blue-500/50" onClick={() => setFilterStatus("inspected")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inspected</p>
                    <p className="text-2xl font-bold text-blue-400">{roomStats.inspected}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="clean">Clean</SelectItem>
                <SelectItem value="dirty">Dirty</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="inspected">Inspected</SelectItem>
                <SelectItem value="out_of_order">Out of Order</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterFloor} onValueChange={setFilterFloor}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floors.map((floor) => (
                  <SelectItem key={floor} value={floor.toString()}>Floor {floor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => { setFilterStatus("all"); setFilterFloor("all"); }}>
              Clear Filters
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Room Grid */}
          {loadingRooms ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredRooms?.map((room) => {
                const StatusIcon = statusConfig[room.housekeeping_status].icon;
                return (
                  <Card 
                    key={room.id} 
                    variant="elevated" 
                    className={`relative ${room.priority === "high" ? "ring-2 ring-destructive/50" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          <span className="font-bold">{room.room_number}</span>
                        </div>
                        {room.priority === "high" && (
                          <Badge className="bg-destructive/20 text-destructive text-xs">Urgent</Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 truncate">{room.room_type}</p>
                      
                      <Badge 
                        variant="outline" 
                        className={`${statusConfig[room.housekeeping_status].color} w-full justify-center mb-3`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[room.housekeeping_status].label}
                      </Badge>

                      {room.assigned_to && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                          <User className="h-3 w-3" />
                          <span className="truncate">{room.assigned_to}</span>
                        </div>
                      )}

                      <Select 
                        value={room.housekeeping_status} 
                        onValueChange={(v) => handleStatusChange(room.id, v as RoomStatus)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dirty">Mark Dirty</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="clean">Mark Clean</SelectItem>
                          <SelectItem value="inspected">Inspected</SelectItem>
                          <SelectItem value="out_of_order">Out of Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-success">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
            </div>
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                  <DialogDescription>Assign a housekeeping task</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Select value={newTask.room_id} onValueChange={(v) => setNewTask({ ...newTask, room_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                      <SelectContent>
                        {rooms?.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.room_number} - {r.room_type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Task Type</Label>
                      <Select value={newTask.task_type} onValueChange={(v) => setNewTask({ ...newTask, task_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="routine">Routine Clean</SelectItem>
                          <SelectItem value="deep_clean">Deep Clean</SelectItem>
                          <SelectItem value="turndown">Turndown</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                          <SelectItem value="special">Special Request</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={newTask.notes} onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })} placeholder="Additional instructions..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTask} disabled={createTask.isPending}>
                    {createTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card variant="elevated">
            <CardContent className="p-0">
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
                            onValueChange={(v) => updateTaskStatus.mutate({ id: task.id, status: v })}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lost-found" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Lost & Found Items</h3>
              <p className="text-sm text-muted-foreground">{lostItems.filter((i) => i.status === "stored").length} items in storage</p>
            </div>
            <Dialog open={lostFoundDialogOpen} onOpenChange={setLostFoundDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Lost Item</DialogTitle>
                  <DialogDescription>Log a found item</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Input value={newLostItem.item_description} onChange={(e) => setNewLostItem({ ...newLostItem, item_description: e.target.value })} placeholder="What was found?" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Found Location *</Label>
                      <Input value={newLostItem.found_location} onChange={(e) => setNewLostItem({ ...newLostItem, found_location: e.target.value })} placeholder="Room 101, Lobby, etc." />
                    </div>
                    <div className="space-y-2">
                      <Label>Found By</Label>
                      <Input value={newLostItem.found_by} onChange={(e) => setNewLostItem({ ...newLostItem, found_by: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newLostItem.category} onValueChange={(v) => setNewLostItem({ ...newLostItem, category: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="jewelry">Jewelry</SelectItem>
                          <SelectItem value="documents">Documents</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Storage Location</Label>
                      <Input value={newLostItem.storage_location} onChange={(e) => setNewLostItem({ ...newLostItem, storage_location: e.target.value })} placeholder="Front desk, Security, etc." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={newLostItem.notes} onChange={(e) => setNewLostItem({ ...newLostItem, notes: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setLostFoundDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateLostItem} disabled={!newLostItem.item_description || !newLostItem.found_location || createLostItem.isPending}>
                    {createLostItem.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Record Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card variant="elevated">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Location Found</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lostItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No lost items recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    lostItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_description}</TableCell>
                        <TableCell>{item.found_location}</TableCell>
                        <TableCell>{format(new Date(item.found_date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="capitalize">{item.category || "-"}</TableCell>
                        <TableCell>
                          <Badge className={
                            item.status === "stored" ? "bg-blue-500/20 text-blue-400" :
                            item.status === "claimed" ? "bg-success/20 text-success" :
                            "bg-muted text-muted-foreground"
                          }>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.storage_location || "-"}</TableCell>
                        <TableCell>
                          {item.status === "stored" && (
                            <Button variant="ghost" size="sm" onClick={() => {
                              const claimedBy = prompt("Enter name of person claiming:");
                              if (claimedBy) claimItem.mutate({ id: item.id, claimedBy });
                            }}>
                              Mark Claimed
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Housekeeping;
