import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reservation, useUpdateReservation } from "@/hooks/useReservations";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar, User, Home, CreditCard, AlertCircle, XCircle, CheckCircle } from "lucide-react";

interface ReservationDetailsDialogProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReservationDetailsDialog({ reservation, open, onOpenChange }: ReservationDetailsDialogProps) {
  const [actionType, setActionType] = useState<"reject" | "cancel" | null>(null);
  const [reason, setReason] = useState("");
  const updateReservation = useUpdateReservation();

  if (!reservation) return null;

  const handleAction = async () => {
    if (!reason) {
      toast.error(`Please provide a reason for ${actionType === "reject" ? "rejection" : "cancellation"}`);
      return;
    }

    try {
      await updateReservation.mutateAsync({
        id: reservation.id,
        status: actionType === "reject" ? "rejected" : "cancelled",
        rejection_reason: reason,
      });
      toast.success(`Reservation ${actionType === "reject" ? "rejected" : "cancelled"} successfully`);
      onOpenChange(false);
      setActionType(null);
      setReason("");
    } catch (error) {
      toast.error("Failed to update reservation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Reservation Details
          </DialogTitle>
          <DialogDescription>
            Code: <span className="font-mono font-bold text-primary">{reservation.reservation_code}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-2">
                <User className="h-3 w-3" /> Guest
              </Label>
              <p className="font-medium">{reservation.guest?.first_name} {reservation.guest?.last_name}</p>
            </div>
            <div className="space-y-1 text-right">
              <Label className="text-muted-foreground flex items-center gap-2 justify-end">
                Status <AlertCircle className="h-3 w-3" />
              </Label>
              <Badge variant="outline" className="capitalize">{reservation.status}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Home className="h-3 w-3" /> Room
              </Label>
              <p className="font-medium">{reservation.room?.room_number || "N/A"} ({reservation.room?.room_type || "N/A"})</p>
            </div>
            <div className="space-y-1 text-right">
              <Label className="text-muted-foreground flex items-center gap-2 justify-end">
                <CreditCard className="h-3 w-3" /> Total
              </Label>
              <p className="font-bold text-lg text-primary">${reservation.total_amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-secondary/20 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check-in:</span>
              <span className="font-medium">{format(new Date(reservation.check_in_date), "PPP")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check-out:</span>
              <span className="font-medium">{format(new Date(reservation.check_out_date), "PPP")}</span>
            </div>
          </div>

          {reservation.rejection_reason && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <p className="font-bold text-destructive mb-1">Reason for Rejection/Cancellation:</p>
              <p className="text-muted-foreground italic">"{reservation.rejection_reason}"</p>
            </div>
          )}

          {actionType ? (
            <div className="space-y-4 p-4 border rounded-lg border-destructive/30 bg-destructive/5 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label htmlFor="reason" className="font-bold capitalize">Reason for {actionType} *</Label>
                <Textarea
                  id="reason"
                  placeholder={`Provide a reason for ${actionType}...`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setActionType(null)}>Cancel</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!reason || updateReservation.isPending}
                  onClick={handleAction}
                >
                  {updateReservation.isPending ? "Processing..." : `Confirm ${actionType}`}
                </Button>
              </div>
            </div>
          ) : (
            reservation.status !== 'rejected' && reservation.status !== 'cancelled' && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 border-destructive/20 gap-2"
                  onClick={() => setActionType("reject")}
                >
                  <XCircle className="h-4 w-4" /> Reject Booking
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setActionType("cancel")}
                >
                  <XCircle className="h-4 w-4" /> Cancel Booking
                </Button>
              </div>
            )
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
