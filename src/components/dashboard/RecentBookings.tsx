import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const bookings = [
  {
    id: 1,
    guest: "Sarah Johnson",
    room: "Suite 401",
    checkIn: "Dec 20",
    checkOut: "Dec 24",
    status: "confirmed",
  },
  {
    id: 2,
    guest: "Michael Chen",
    room: "Deluxe 302",
    checkIn: "Dec 21",
    checkOut: "Dec 23",
    status: "pending",
  },
  {
    id: 3,
    guest: "Emma Wilson",
    room: "Standard 105",
    checkIn: "Dec 22",
    checkOut: "Dec 25",
    status: "confirmed",
  },
  {
    id: 4,
    guest: "James Brown",
    room: "Suite 502",
    checkIn: "Dec 23",
    checkOut: "Dec 28",
    status: "checked-in",
  },
  {
    id: 5,
    guest: "Lisa Anderson",
    room: "Deluxe 201",
    checkIn: "Dec 24",
    checkOut: "Dec 26",
    status: "confirmed",
  },
];

const statusColors = {
  confirmed: "bg-success/20 text-success border-success/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  "checked-in": "bg-primary/20 text-primary border-primary/30",
};

export function RecentBookings() {
  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Bookings</CardTitle>
        <a href="/reservations" className="text-sm text-primary hover:underline">
          View all
        </a>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-gold text-primary-foreground text-sm font-semibold">
                    {booking.guest
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{booking.guest}</p>
                  <p className="text-xs text-muted-foreground">{booking.room}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {booking.checkIn} - {booking.checkOut}
                </p>
                <Badge
                  variant="outline"
                  className={statusColors[booking.status as keyof typeof statusColors]}
                >
                  {booking.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
