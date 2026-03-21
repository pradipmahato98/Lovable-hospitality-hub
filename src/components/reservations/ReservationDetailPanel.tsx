import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, User, Bed, Calendar, CreditCard, Phone, Mail, FileText, Pencil, Printer, Trash2, LogIn } from "lucide-react";
import { Reservation, useReservations } from "@/hooks/useReservations";
import { formatAD, formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { differenceInDays, parseISO } from "date-fns";

const statusColors: Record<string, string> = {
  confirmed: "bg-success/20 text-success border-success/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  "checked-in": "bg-primary/20 text-primary border-primary/30",
  "checked-out": "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  "no-show": "bg-destructive/20 text-destructive border-destructive/30",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  partial: "bg-primary/20 text-primary border-primary/30",
  paid: "bg-success/20 text-success border-success/30",
  refunded: "bg-muted text-muted-foreground border-border",
};

interface Props {
  reservation: Reservation;
  onClose: () => void;
  onEdit?: () => void;
  onCheckIn?: () => void;
  onCancel?: () => void;
}

export function ReservationDetailPanel({ reservation, onClose, onEdit, onCheckIn, onCancel }: Props) {
  const navigate = useNavigate();
  const { cancelReservation } = useReservations();
  const balance = reservation.total_amount - (reservation.amount_paid || 0);
  const nights = differenceInDays(parseISO(reservation.check_out_date), parseISO(reservation.check_in_date));

  const handleCancel = async () => {
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
      try {
        await cancelReservation.mutateAsync(reservation.id);
        if (onCancel) onCancel();
        onClose();
      } catch (error) {
        console.error("Error cancelling reservation:", error);
      }
    }
  };

  return (
    <Card variant="elevated" className="sticky top-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">Reservation Details</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* First Section: ID, Status, Source, Primary Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-lg font-bold text-primary">{reservation.reservation_code}</p>
            <div className="flex gap-2">
              <Badge variant="outline" className={statusColors[reservation.status] || statusColors.pending}>
                {reservation.status}
              </Badge>
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-medium">
            Booking Source: <span className="text-foreground">{reservation.source || "Direct"}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {reservation.status === "confirmed" || reservation.status === "pending" ? (
              <Button size="sm" variant="blue" className="gap-2" onClick={onCheckIn}>
                <LogIn className="h-4 w-4" /> Check-in
              </Button>
            ) : null}
            {reservation.status !== "cancelled" && reservation.status !== "checked-out" && (
              <Button size="sm" variant="destructive" className="gap-2" onClick={handleCancel} disabled={cancelReservation.isPending}>
                <Trash2 className="h-4 w-4" /> Cancel
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/front-desk?reservationId=${reservation.id}`)}>
              <FileText className="h-4 w-4" /> View Folio
            </Button>
          </div>
        </div>

        <Separator />

        {/* Second Section: Guest, Room, Dates, Duration, Counts */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <User className="h-4 w-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Who booking for</p>
              <p className="font-bold text-sm">
                {reservation.guest ? `${reservation.guest.first_name} ${reservation.guest.last_name}` : "Unknown"}
              </p>
              {reservation.guest?.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                  <Phone className="h-3 w-3" /> {reservation.guest.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Bed className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">
                {reservation.room ? `Room ${reservation.room.room_number}` : "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">{reservation.room?.room_type} • {formatCurrency(reservation.room?.price_per_night || 0)}/night</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm">
                {formatAD(reservation.check_in_date)} → {formatAD(reservation.check_out_date)}
                <span className="ml-1.5 font-medium text-primary">({nights} {nights === 1 ? "night" : "nights"})</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-bold">
                {reservation.adults || 0} Adult(s), {reservation.children || 0} Child(ren)
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Third Section: Advance Payment */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Advance Payment</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Total:</span>
            <span className="text-right font-semibold">{formatCurrency(reservation.total_amount)}</span>
            <span className="text-muted-foreground">Paid:</span>
            <span className="text-right font-semibold text-success">{formatCurrency(reservation.amount_paid || 0)}</span>
            <span className="text-muted-foreground">Balance:</span>
            <span className={`text-right font-semibold ${balance > 0 ? "text-destructive" : "text-success"}`}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>

        {reservation.special_requests && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 font-semibold text-primary/80 uppercase tracking-wider">Special Requests</p>
              <p className="text-sm bg-secondary/30 p-2 rounded border border-border/50">{reservation.special_requests}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
