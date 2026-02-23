import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { User, Bed, Calendar, DollarSign, Clock } from "lucide-react";

interface ReservationDetailsDialogProps {
  reservation: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReservationDetailsDialog = ({ reservation, open, onOpenChange }: ReservationDetailsDialogProps) => {
  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Booking Details - {reservation.reservation_code}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {reservation.status === "rejected" && reservation.rejection_reason && (
            <div className="flex items-start gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/10">
              <div className="grid gap-1">
                <span className="text-xs font-bold text-destructive uppercase tracking-wider">Rejection Reason</span>
                <p className="text-sm italic">{reservation.rejection_reason}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="grid gap-1">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Guest Information</span>
              <span className="font-semibold text-lg">{reservation.guest?.first_name} {reservation.guest?.last_name}</span>
              <span className="text-sm text-muted-foreground">{reservation.guest?.email || "No email provided"}</span>
              <span className="text-sm text-muted-foreground">{reservation.guest?.phone || "No phone provided"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Bed className="h-5 w-5 text-amber-600" />
              </div>
              <div className="grid gap-1">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Room</span>
                <span className="font-semibold">{reservation.room?.room_number}</span>
                <span className="text-xs text-muted-foreground">{reservation.room?.room_type}</span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="grid gap-1">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</span>
                <Badge variant="outline" className="w-fit">{reservation.status}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="grid gap-1">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Stay Dates</span>
              <div className="flex items-center gap-2 font-semibold">
                <span>{format(new Date(reservation.check_in_date), "MMM dd, yyyy")}</span>
                <span className="text-muted-foreground">→</span>
                <span>{format(new Date(reservation.check_out_date), "MMM dd, yyyy")}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.ceil((new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) / (1000 * 3600 * 24))} nights
              </span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div className="grid gap-1">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Financial Summary</span>
              <div className="flex justify-between w-full gap-8">
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Total Amount</span>
                  <span className="font-bold text-lg">${reservation.total_amount.toFixed(2)}</span>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Amount Paid</span>
                  <span className="font-bold text-lg text-emerald-600">${(reservation.amount_paid || 0).toFixed(2)}</span>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Balance</span>
                  <span className="font-bold text-lg text-destructive">${(reservation.total_amount - (reservation.amount_paid || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
