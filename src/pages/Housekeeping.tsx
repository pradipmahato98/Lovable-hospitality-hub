import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bed, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sparkles,
  User,
  Filter,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type RoomStatus = "clean" | "dirty" | "inspected" | "out_of_order" | "in_progress";

interface HousekeepingRoom {
  id: string;
  room_number: string;
  room_type: string;
  floor: number;
  status: string;
  housekeeping_status: RoomStatus;
  assigned_to?: string;
  priority: "low" | "normal" | "high";
}

const statusConfig: Record<RoomStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  clean: { label: "Clean", color: "bg-success/20 text-success border-success/30", icon: CheckCircle2 },
  dirty: { label: "Dirty", color: "bg-destructive/20 text-destructive border-destructive/30", icon: AlertCircle },
  inspected: { label: "Inspected", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Sparkles },
  out_of_order: { label: "Out of Order", color: "bg-muted text-muted-foreground border-border", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
};

const Housekeeping = () => {
  const [filterStatus, setFilterStatus] = useState<RoomStatus | "all">("all");
  const [filterFloor, setFilterFloor] = useState<string>("all");

  const { data: rooms, isLoading, refetch } = useQuery({
    queryKey: ["housekeeping-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number");
      
      if (error) throw error;

      // Add mock housekeeping data
      return data.map((room, index): HousekeepingRoom => ({
        ...room,
        housekeeping_status: ["clean", "dirty", "inspected", "in_progress", "dirty"][index % 5] as RoomStatus,
        assigned_to: index % 3 === 0 ? "Maria G." : index % 3 === 1 ? "John D." : undefined,
        priority: index % 4 === 0 ? "high" : index % 4 === 1 ? "low" : "normal",
      }));
    },
  });

  const floors = rooms ? [...new Set(rooms.map(r => r.floor))].sort() : [];

  const filteredRooms = rooms?.filter(room => {
    const matchesStatus = filterStatus === "all" || room.housekeeping_status === filterStatus;
    const matchesFloor = filterFloor === "all" || room.floor.toString() === filterFloor;
    return matchesStatus && matchesFloor;
  });

  const handleStatusChange = (roomId: string, newStatus: RoomStatus) => {
    toast.success(`Room status updated to ${statusConfig[newStatus].label}`);
  };

  const stats = {
    clean: rooms?.filter(r => r.housekeeping_status === "clean").length || 0,
    dirty: rooms?.filter(r => r.housekeeping_status === "dirty").length || 0,
    inProgress: rooms?.filter(r => r.housekeeping_status === "in_progress").length || 0,
    inspected: rooms?.filter(r => r.housekeeping_status === "inspected").length || 0,
  };

  return (
    <MainLayout title="Housekeeping" subtitle="Room cleaning and maintenance status">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:border-success/50" onClick={() => setFilterStatus("clean")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clean</p>
                <p className="text-2xl font-bold text-success">{stats.clean}</p>
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
                <p className="text-2xl font-bold text-destructive">{stats.dirty}</p>
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
                <p className="text-2xl font-bold text-amber-400">{stats.inProgress}</p>
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
                <p className="text-2xl font-bold text-blue-400">{stats.inspected}</p>
              </div>
              <Sparkles className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as RoomStatus | "all")}>
            <SelectTrigger className="w-36">
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
        </div>
        <Select value={filterFloor} onValueChange={setFilterFloor}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Floor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Floors</SelectItem>
            {floors.map(floor => (
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
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
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
    </MainLayout>
  );
};

export default Housekeeping;
