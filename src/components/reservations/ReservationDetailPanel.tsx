import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, User, Bed, Calendar, CreditCard, Phone, Mail, FileText } from "lucide-react";
import { Reservation } from "@/hooks/useReservations";
import { formatAD, formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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
}

export function ReservationDetailPanel({ reservation, onClose }: Props) {
  const navigate = useNavigate();
  const balance = reservation.total_amount - (reservation.amount_paid || 0);

  return (
    <Card variant="elevated" className="sticky top-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">Reservation Details</CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-primary">{reservation.reservation_code}</p>
          <div className="flex justify-center gap-2 mt-2">
            <Badge variant="outline" className={statusColors[reservation.status] || statusColors.pending}>
              {reservation.status}
            </Badge>
            <Badge variant="outline" className={paymentStatusColors[reservation.payment_status || "pending"] || ""}>
              {reservation.payment_status || "pending"}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">
                {reservation.guest ? `${reservation.guest.first_name} ${reservation.guest.last_name}` : "Unknown"}
              </p>
              {reservation.guest?.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {reservation.guest.email}
                </p>
              )}
              {reservation.guest?.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
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
              <p className="text-xs text-muted-foreground">{reservation.room?.room_type}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(reservation.room?.price_per_night || 0)}/night</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm">{formatAD(reservation.check_in_date)} → {formatAD(reservation.check_out_date)}</p>
              <p className="text-xs text-muted-foreground">{reservation.adults} adult(s), {reservation.children || 0} child(ren)</p>
              {reservation.source && <p className="text-xs text-muted-foreground">Source: {reservation.source}</p>}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Payment</span>
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
              <p className="text-xs font-medium text-muted-foreground mb-1">Special Requests</p>
              <p className="text-sm">{reservation.special_requests}</p>
            </div>
          </>
        )}

        <Separator />

        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate(`/front-desk?reservationId=${reservation.id}`)}>
          <FileText className="h-4 w-4" />
          View Folio
        </Button>
      </CardContent>
    </Card>
  );
}
