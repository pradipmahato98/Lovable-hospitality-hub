import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, Users, Wifi, Tv, Coffee, Bath } from "lucide-react";
import { cn } from "@/lib/utils";

const rooms = [
  {
    id: 1,
    number: "401",
    type: "Presidential Suite",
    floor: 4,
    capacity: 4,
    price: 650,
    status: "available",
    amenities: ["wifi", "tv", "minibar", "jacuzzi"],
  },
  {
    id: 2,
    number: "302",
    type: "Deluxe Room",
    floor: 3,
    capacity: 2,
    price: 280,
    status: "occupied",
    amenities: ["wifi", "tv", "minibar"],
  },
  {
    id: 3,
    number: "105",
    type: "Standard Room",
    floor: 1,
    capacity: 2,
    price: 120,
    status: "cleaning",
    amenities: ["wifi", "tv"],
  },
  {
    id: 4,
    number: "502",
    type: "Executive Suite",
    floor: 5,
    capacity: 3,
    price: 480,
    status: "occupied",
    amenities: ["wifi", "tv", "minibar", "jacuzzi"],
  },
  {
    id: 5,
    number: "201",
    type: "Deluxe Room",
    floor: 2,
    capacity: 2,
    price: 280,
    status: "available",
    amenities: ["wifi", "tv", "minibar"],
  },
  {
    id: 6,
    number: "301",
    type: "Executive Suite",
    floor: 3,
    capacity: 3,
    price: 480,
    status: "maintenance",
    amenities: ["wifi", "tv", "minibar", "jacuzzi"],
  },
  {
    id: 7,
    number: "402",
    type: "Presidential Suite",
    floor: 4,
    capacity: 4,
    price: 650,
    status: "available",
    amenities: ["wifi", "tv", "minibar", "jacuzzi"],
  },
  {
    id: 8,
    number: "103",
    type: "Standard Room",
    floor: 1,
    capacity: 2,
    price: 120,
    status: "occupied",
    amenities: ["wifi", "tv"],
  },
];

const statusStyles = {
  available: "bg-success/20 text-success border-success/30",
  occupied: "bg-primary/20 text-primary border-primary/30",
  cleaning: "bg-warning/20 text-warning border-warning/30",
  maintenance: "bg-destructive/20 text-destructive border-destructive/30",
};

const amenityIcons = {
  wifi: Wifi,
  tv: Tv,
  minibar: Coffee,
  jacuzzi: Bath,
};

const Rooms = () => {
  return (
    <MainLayout title="Rooms" subtitle="Manage room inventory and availability">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search rooms..." className="w-64 pl-9 bg-secondary" />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
        <Button variant="gold" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Available", count: 3, color: "text-success" },
          { label: "Occupied", count: 3, color: "text-primary" },
          { label: "Cleaning", count: 1, color: "text-warning" },
          { label: "Maintenance", count: 1, color: "text-destructive" },
        ].map((stat) => (
          <Card key={stat.label} variant="glass" className="p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn("text-2xl font-bold font-display", stat.color)}>{stat.count}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rooms.map((room, index) => (
          <Card
            key={room.id}
            variant="elevated"
            className="animate-slide-up overflow-hidden hover:shadow-glow transition-all cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Room Header */}
            <div className="h-32 bg-gradient-card flex items-center justify-center relative">
              <span className="text-5xl font-display font-bold text-gradient-gold">{room.number}</span>
              <Badge
                variant="outline"
                className={cn("absolute top-3 right-3", statusStyles[room.status as keyof typeof statusStyles])}
              >
                {room.status}
              </Badge>
            </div>

            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-foreground">{room.type}</h3>
                <p className="text-sm text-muted-foreground">Floor {room.floor}</p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Up to {room.capacity}</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary">${room.price}</span>
                  <span className="text-xs text-muted-foreground">/night</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex gap-2 pt-3 border-t border-border">
                {room.amenities.map((amenity) => {
                  const Icon = amenityIcons[amenity as keyof typeof amenityIcons];
                  return (
                    <div
                      key={amenity}
                      className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center"
                      title={amenity}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
};

export default Rooms;
