import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wifi, Tv, Coffee, Bath, Star, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";

export type Room = Tables<"rooms">;

export const roomStatusStyles = {
  available: "bg-success/20 text-success border-success/30",
  occupied: "bg-primary/20 text-primary border-primary/30",
  cleaning: "bg-warning/20 text-warning border-warning/30",
  maintenance: "bg-destructive/20 text-destructive border-destructive/30",
};

export const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  tv: Tv,
  minibar: Coffee,
  jacuzzi: Bath,
};

interface RoomCardProps {
  room: Room;
  index: number;
  isSelected: boolean;
  onClick: (room: Room) => void;
  guest?: { first_name: string; last_name: string; is_vip?: boolean } | null;
  loyaltyTier?: string | null;
}

export const RoomCard = memo(function RoomCard({ room, index, isSelected, onClick, guest, loyaltyTier }: RoomCardProps) {
  return (
    <Card
      variant="elevated"
      className={cn(
        "animate-slide-up overflow-hidden hover:shadow-glow transition-all cursor-pointer group",
        isSelected && "ring-2 ring-primary"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => onClick(room)}
    >
      {/* Room Header */}
      <div className="h-32 bg-gradient-card flex items-center justify-center relative">
        <span className="text-5xl font-display font-bold text-gradient-gold">
          {room.room_number}
        </span>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          <Badge
            variant="outline"
            className={cn(
              roomStatusStyles[room.status as keyof typeof roomStatusStyles] || roomStatusStyles.available
            )}
          >
            {room.status}
          </Badge>
          {guest?.is_vip && (
            <Badge className="bg-gold text-white text-[10px] h-5 px-1">
              <Star className="h-3 w-3 mr-1 fill-white" /> VIP
            </Badge>
          )}
          {loyaltyTier && (
            <Badge variant="outline" className="border-gold text-gold text-[10px] h-5 px-1 bg-background/50">
              <ShieldCheck className="h-3 w-3 mr-1" /> {loyaltyTier}
            </Badge>
          )}
        </div>
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
  );
});
