import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, X } from "lucide-react";
import { useState } from "react";
import { POSTable } from "@/hooks/usePOS";

interface OpenTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: POSTable | null;
  onOpenTable: (guests: number) => void;
}

export function OpenTableDialog({ open, onOpenChange, table, onOpenTable }: OpenTableDialogProps) {
  const [guestCount, setGuestCount] = useState("2");

  if (!table) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guests = parseInt(guestCount) || 1;
    onOpenTable(Math.min(guests, table.capacity));
    setGuestCount("2");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-xl">Open Table {table.table_number}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Capacity: {table.capacity} guests
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="guests" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guests:
            </Label>
            <Input
              id="guests"
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              min={1}
              max={table.capacity}
              className="w-24"
            />
          </div>

          <Button type="submit" variant="gold" className="w-full">
            Open Table
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
