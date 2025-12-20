import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const rooms = [
  { number: "101", status: "occupied", floor: 1 },
  { number: "102", status: "available", floor: 1 },
  { number: "103", status: "cleaning", floor: 1 },
  { number: "104", status: "occupied", floor: 1 },
  { number: "105", status: "available", floor: 1 },
  { number: "201", status: "occupied", floor: 2 },
  { number: "202", status: "maintenance", floor: 2 },
  { number: "203", status: "available", floor: 2 },
  { number: "204", status: "occupied", floor: 2 },
  { number: "205", status: "cleaning", floor: 2 },
  { number: "301", status: "available", floor: 3 },
  { number: "302", status: "occupied", floor: 3 },
  { number: "303", status: "available", floor: 3 },
  { number: "304", status: "occupied", floor: 3 },
  { number: "305", status: "available", floor: 3 },
];

const statusStyles = {
  occupied: "bg-primary/20 border-primary/40 text-primary",
  available: "bg-success/20 border-success/40 text-success",
  cleaning: "bg-warning/20 border-warning/40 text-warning",
  maintenance: "bg-destructive/20 border-destructive/40 text-destructive",
};

export function RoomStatusGrid() {
  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Room Status</CardTitle>
        <a href="/rooms" className="text-sm text-primary hover:underline">
          Manage rooms
        </a>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {rooms.map((room) => (
            <div
              key={room.number}
              className={cn(
                "flex items-center justify-center h-12 rounded-lg border-2 font-medium text-sm transition-all hover:scale-105 cursor-pointer",
                statusStyles[room.status as keyof typeof statusStyles]
              )}
            >
              {room.number}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
          {Object.entries(statusStyles).map(([status, style]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", style.replace("text-", "bg-").split(" ")[0])} />
              <span className="text-xs text-muted-foreground capitalize">{status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
