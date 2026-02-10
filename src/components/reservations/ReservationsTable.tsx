import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, LogIn, LogOut } from "lucide-react";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/skeletons";
import { Reservation } from "@/hooks/useReservations";

const statusColors: Record<string, string> = {
  confirmed: "bg-success/20 text-success border-success/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  "checked-in": "bg-primary/20 text-primary border-primary/30",
  "checked-out": "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

interface ReservationsTableProps {
  reservations: Reservation[];
  isLoading: boolean;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
}

export const ReservationsTable = ({ reservations, isLoading, onCheckIn, onCheckOut }: ReservationsTableProps) => {
  if (isLoading) {
    return <TableSkeleton columns={7} rows={5} />;
  }

  return (
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
          {reservations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                No reservations found
              </TableCell>
            </TableRow>
          ) : (
            reservations.map((reservation) => (
              <TableRow key={reservation.id} className="border-border hover:bg-secondary/50">
                <TableCell className="font-mono text-sm text-primary whitespace-nowrap">
                  {reservation.reservation_code}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {reservation.guest ? `${reservation.guest.first_name} ${reservation.guest.last_name}` : "Unknown"}
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">
                  {reservation.room ? `${reservation.room.room_number} - ${reservation.room.room_type}` : "N/A"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {format(new Date(reservation.check_in_date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {format(new Date(reservation.check_out_date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[reservation.status] || statusColors.pending}>
                    {reservation.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold hidden sm:table-cell">
                  ${reservation.total_amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(reservation.status === "confirmed" || reservation.status === "pending") && (
                        <DropdownMenuItem onClick={() => onCheckIn(reservation.id)}>
                          <LogIn className="h-4 w-4 mr-2" />Check In
                        </DropdownMenuItem>
                      )}
                      {reservation.status === "checked-in" && (
                        <DropdownMenuItem onClick={() => onCheckOut(reservation.id)}>
                          <LogOut className="h-4 w-4 mr-2" />Check Out
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
