import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, User, CheckCircle2, AlertCircle, Sparkles, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RoomStatus = "clean" | "dirty" | "inspected" | "out_of_order" | "in_progress";

const statusConfig: Record<RoomStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  clean: { label: "Clean", color: "bg-success/20 text-success border-success/30", icon: CheckCircle2 },
  dirty: { label: "Dirty", color: "bg-destructive/20 text-destructive border-destructive/30", icon: AlertCircle },
  inspected: { label: "Inspected", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Sparkles },
  out_of_order: { label: "Out of Order", color: "bg-muted text-muted-foreground border-border", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
};

export interface HousekeepingRoom {
  id: string;
  room_number: string;
  room_type: string;
  housekeeping_status: RoomStatus;
  priority: string;
  assigned_to?: string;
}

interface RoomGridProps {
  rooms: HousekeepingRoom[];
  onStatusChange: (roomId: string, newStatus: RoomStatus) => void;
}

export const RoomGrid = ({ rooms, onStatusChange }: RoomGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {rooms?.map((room) => {
        const StatusIcon = statusConfig[room.housekeeping_status as RoomStatus].icon;
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
                className={`${statusConfig[room.housekeeping_status as RoomStatus].color} w-full justify-center mb-3`}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[room.housekeeping_status as RoomStatus].label}
              </Badge>

              {room.assigned_to && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <User className="h-3 w-3" />
                  <span className="truncate">{room.assigned_to}</span>
                </div>
              )}

              <Select
                value={room.housekeeping_status}
                onValueChange={(v) => onStatusChange(room.id, v as RoomStatus)}
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
  );
};
