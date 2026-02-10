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
import { supabase } from "@/integrations/supabase/client";
import { useHousekeepingTasks, useLostAndFound, useHousekeepingStats } from "@/hooks/useHousekeeping";
import { HousekeepingStats } from "@/components/housekeeping/HousekeepingStats";
import { RoomGrid } from "@/components/housekeeping/RoomGrid";
import { TaskTable } from "@/components/housekeeping/TaskTable";
import { LostFoundTable } from "@/components/housekeeping/LostFoundTable";

type RoomStatus = "clean" | "dirty" | "inspected" | "out_of_order" | "in_progress";

const Housekeeping = () => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFloor, setFilterFloor] = useState<string>("all");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [lostFoundDialogOpen, setLostFoundDialogOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const { data: rooms, isLoading: loadingRooms, refetch } = useQuery({
    queryKey: ["housekeeping-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").order("room_number");
      if (error) throw error;
      return data.map((room) => ({
        ...room,
        housekeeping_status: (room.status === "available" ? "clean" : room.status === "cleaning" ? "in_progress" : room.status) as RoomStatus,
        assigned_to: undefined, // These could be fetched from tasks if needed
        priority: "normal",
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

  const handleStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    const dbStatus = newStatus === "clean" ? "available" : newStatus === "in_progress" ? "cleaning" : newStatus;
    const { error } = await supabase.from("rooms").update({ status: dbStatus }).eq("id", roomId);
    if (error) {
      toast.error("Failed to update room status");
    } else {
      toast.success(`Room status updated to ${newStatus}`);
      refetch();
    }
  };

  const handleCreateTask = async () => {
    try {
      await createTask.mutateAsync({
        ...newTask,
        status: "pending",
        inspection_notes: null,
        inspection_score: null,
        scheduled_time: null,
        started_at: null,
        completed_at: null
      });
      toast.success("Task created successfully");
      setTaskDialogOpen(false);
      setNewTask({ room_id: "", task_type: "routine", priority: "normal", scheduled_date: today, notes: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error("Failed to create task: " + message);
    }
  };

  const handleCreateLostItem = async () => {
    try {
      await createLostItem.mutateAsync({
        ...newLostItem,
        found_date: today,
        status: "stored",
        guest_id: null,
        claimed_date: null,
        claimed_by: null,
        image_url: null
      });
      toast.success("Lost item recorded");
      setLostFoundDialogOpen(false);
      setNewLostItem({ item_description: "", found_location: "", found_by: "", category: "", storage_location: "", notes: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error("Failed to record item: " + message);
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
          <HousekeepingStats stats={roomStats} onFilterStatus={setFilterStatus} />

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

          {loadingRooms ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RoomGrid rooms={filteredRooms || []} onStatusChange={handleStatusChange} />
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
              <TaskTable
                tasks={tasks}
                onStatusChange={(id, status) => updateTaskStatus.mutate({ id, status })}
              />
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
              <LostFoundTable
                items={lostItems}
                onClaim={(id) => {
                  const claimedBy = prompt("Enter name of person claiming:");
                  if (claimedBy) claimItem.mutate({ id, claimedBy });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Housekeeping;
