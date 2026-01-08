import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Wifi, Tv, Coffee, Bath, Grid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRooms } from "@/hooks/useRooms";
import { DataTable, Column } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/skeletons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Tables } from "@/integrations/supabase/types";

type Room = Tables<"rooms">;

const statusStyles = {
  available: "bg-success/20 text-success border-success/30",
  occupied: "bg-primary/20 text-primary border-primary/30",
  cleaning: "bg-warning/20 text-warning border-warning/30",
  maintenance: "bg-destructive/20 text-destructive border-destructive/30",
};

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  tv: Tv,
  minibar: Coffee,
  jacuzzi: Bath,
};

const Rooms = () => {
  const { data: rooms = [], isLoading } = useRooms();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const stats = useMemo(() => {
    return {
      available: rooms.filter((r) => r.status === "available").length,
      occupied: rooms.filter((r) => r.status === "occupied").length,
      cleaning: rooms.filter((r) => r.status === "cleaning").length,
      maintenance: rooms.filter((r) => r.status === "maintenance").length,
    };
  }, [rooms]);

  const columns: Column<Room>[] = [
    {
      key: "room_number",
      header: "Room",
      render: (room) => (
        <span className="font-mono font-bold text-primary">{room.room_number}</span>
      ),
    },
    {
      key: "room_type",
      header: "Type",
      render: (room) => <span>{room.room_type}</span>,
    },
    {
      key: "floor",
      header: "Floor",
      render: (room) => <span>Floor {room.floor}</span>,
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (room) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{room.capacity}</span>
        </div>
      ),
    },
    {
      key: "price_per_night",
      header: "Price/Night",
      render: (room) => (
        <span className="font-semibold text-primary">${room.price_per_night}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (room) => (
        <Badge
          variant="outline"
          className={statusStyles[room.status as keyof typeof statusStyles] || statusStyles.available}
        >
          {room.status}
        </Badge>
      ),
    },
    {
      key: "amenities",
      header: "Amenities",
      sortable: false,
      searchable: false,
      render: (room) => (
        <div className="flex gap-1">
          {(room.amenities || []).slice(0, 4).map((amenity) => {
            const Icon = amenityIcons[amenity.toLowerCase()];
            return Icon ? (
              <div
                key={amenity}
                className="h-6 w-6 rounded bg-secondary flex items-center justify-center"
                title={amenity}
              >
                <Icon className="h-3 w-3 text-muted-foreground" />
              </div>
            ) : null;
          })}
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Rooms" subtitle="Manage room inventory and availability">
      <ErrorBoundary>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="gold" size="sm" className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Room
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "Available", count: stats.available, color: "text-success" },
            { label: "Occupied", count: stats.occupied, color: "text-primary" },
            { label: "Cleaning", count: stats.cleaning, color: "text-warning" },
            { label: "Maintenance", count: stats.maintenance, color: "text-destructive" },
          ].map((stat) => (
            <Card key={stat.label} variant="glass" className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn("text-xl sm:text-2xl font-bold font-display", stat.color)}>
                {isLoading ? "-" : stat.count}
              </p>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <TableSkeleton columns={7} rows={5} />
        ) : viewMode === "table" ? (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>All Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={rooms}
                columns={columns}
                keyExtractor={(room) => room.id}
                searchPlaceholder="Search rooms..."
                emptyMessage="No rooms found."
                pageSize={10}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {rooms.map((room, index) => (
              <Card
                key={room.id}
                variant="elevated"
                className="animate-slide-up overflow-hidden hover:shadow-glow transition-all cursor-pointer group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Room Header */}
                <div className="h-32 bg-gradient-card flex items-center justify-center relative">
                  <span className="text-5xl font-display font-bold text-gradient-gold">
                    {room.room_number}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "absolute top-3 right-3",
                      statusStyles[room.status as keyof typeof statusStyles] || statusStyles.available
                    )}
                  >
                    {room.status}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-foreground">{room.room_type}</h3>
                    <p className="text-sm text-muted-foreground">Floor {room.floor}</p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Up to {room.capacity}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-primary">${room.price_per_night}</span>
                      <span className="text-xs text-muted-foreground">/night</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex gap-2 pt-3 border-t border-border">
                    {(room.amenities || []).map((amenity) => {
                      const Icon = amenityIcons[amenity.toLowerCase()];
                      return Icon ? (
                        <div
                          key={amenity}
                          className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center"
                          title={amenity}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
            {rooms.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No rooms found
              </div>
            )}
          </div>
        )}
      </ErrorBoundary>
    </MainLayout>
  );
};

export default Rooms;
