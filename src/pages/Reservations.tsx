import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const reservations = [
  {
    id: "RES-001",
    guest: "Sarah Johnson",
    room: "Suite 401",
    checkIn: "2024-12-20",
    checkOut: "2024-12-24",
    status: "confirmed",
    total: "$1,560",
  },
  {
    id: "RES-002",
    guest: "Michael Chen",
    room: "Deluxe 302",
    checkIn: "2024-12-21",
    checkOut: "2024-12-23",
    status: "pending",
    total: "$480",
  },
  {
    id: "RES-003",
    guest: "Emma Wilson",
    room: "Standard 105",
    checkIn: "2024-12-22",
    checkOut: "2024-12-25",
    status: "confirmed",
    total: "$360",
  },
  {
    id: "RES-004",
    guest: "James Brown",
    room: "Suite 502",
    checkIn: "2024-12-23",
    checkOut: "2024-12-28",
    status: "checked-in",
    total: "$2,400",
  },
  {
    id: "RES-005",
    guest: "Lisa Anderson",
    room: "Deluxe 201",
    checkIn: "2024-12-24",
    checkOut: "2024-12-26",
    status: "confirmed",
    total: "$520",
  },
  {
    id: "RES-006",
    guest: "David Martinez",
    room: "Suite 301",
    checkIn: "2024-12-25",
    checkOut: "2024-12-30",
    status: "pending",
    total: "$1,950",
  },
];

const statusColors = {
  confirmed: "bg-success/20 text-success border-success/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  "checked-in": "bg-primary/20 text-primary border-primary/30",
  "checked-out": "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const Reservations = () => {
  return (
    <MainLayout title="Reservations" subtitle="Manage all bookings and reservations">
      <Card variant="elevated" className="animate-fade-in overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>All Reservations</CardTitle>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search reservations..." className="w-full sm:w-48 lg:w-64 pl-9 bg-secondary" />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button variant="gold" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Reservation</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="whitespace-nowrap">Reservation ID</TableHead>
                  <TableHead className="whitespace-nowrap">Guest</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">Room</TableHead>
                  <TableHead className="whitespace-nowrap hidden lg:table-cell">Check In</TableHead>
                  <TableHead className="whitespace-nowrap hidden lg:table-cell">Check Out</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="font-mono text-sm text-primary whitespace-nowrap">
                      {reservation.id}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{reservation.guest}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{reservation.room}</TableCell>
                    <TableCell className="hidden lg:table-cell">{reservation.checkIn}</TableCell>
                    <TableCell className="hidden lg:table-cell">{reservation.checkOut}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[reservation.status as keyof typeof statusColors]}
                      >
                        {reservation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold hidden sm:table-cell">{reservation.total}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Reservations;
