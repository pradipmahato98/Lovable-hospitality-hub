import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Split,
  Users,
  Receipt,
  Calculator,
  Check,
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface SplitBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OrderItem[];
  tableNumber: string;
  onSplitComplete: (splits: { items: OrderItem[]; total: number; paymentMethod: string }[]) => void;
}

export function SplitBillDialog({
  open,
  onOpenChange,
  items,
  tableNumber,
  onSplitComplete,
}: SplitBillDialogProps) {
  const [splitType, setSplitType] = useState<"equal" | "items" | "custom">("equal");
  const [numGuests, setNumGuests] = useState("2");
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({
    guest1: [],
    guest2: [],
  });
  const [customAmounts, setCustomAmounts] = useState<string[]>(["", ""]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = total * 0.1;
  const grandTotal = total + tax;

  const numGuestsInt = parseInt(numGuests) || 2;
  const equalSplit = grandTotal / numGuestsInt;

  const toggleItemForGuest = (guestKey: string, itemId: string) => {
    setSelectedItems(prev => {
      const current = prev[guestKey] || [];
      const updated = current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId];
      return { ...prev, [guestKey]: updated };
    });
  };

  const getGuestTotal = (guestKey: string) => {
    const guestItems = selectedItems[guestKey] || [];
    const itemTotal = items
      .filter(item => guestItems.includes(item.id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
    return itemTotal * 1.1; // Add tax
  };

  const handleSplit = () => {
    if (splitType === "equal") {
      const splits = Array.from({ length: numGuestsInt }, (_, i) => ({
        items: items.map(item => ({ ...item, quantity: Math.ceil(item.quantity / numGuestsInt) })),
        total: equalSplit,
        paymentMethod: "pending",
      }));
      onSplitComplete(splits);
    } else if (splitType === "items") {
      const splits = Object.keys(selectedItems).map(guestKey => {
        const guestItems = items.filter(item => selectedItems[guestKey]?.includes(item.id));
        return {
          items: guestItems,
          total: getGuestTotal(guestKey),
          paymentMethod: "pending",
        };
      });
      onSplitComplete(splits);
    } else {
      const splits = customAmounts.map((amount, i) => ({
        items: i === 0 ? items : [],
        total: parseFloat(amount) || 0,
        paymentMethod: "pending",
      }));
      onSplitComplete(splits);
    }
    onOpenChange(false);
  };

  const handleNumGuestsChange = (value: string) => {
    const num = parseInt(value) || 2;
    setNumGuests(value);
    
    // Update selectedItems and customAmounts for new guest count
    const newSelected: Record<string, string[]> = {};
    const newAmounts: string[] = [];
    for (let i = 0; i < num; i++) {
      newSelected[`guest${i + 1}`] = selectedItems[`guest${i + 1}`] || [];
      newAmounts.push(customAmounts[i] || "");
    }
    setSelectedItems(newSelected);
    setCustomAmounts(newAmounts);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Bill - Table {tableNumber}
          </DialogTitle>
          <DialogDescription>
            Total: ${grandTotal.toFixed(2)} (includes 10% tax)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Split Type Selection */}
          <div className="space-y-2">
            <Label>Split Method</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={splitType === "equal" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSplitType("equal")}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Equal
              </Button>
              <Button
                variant={splitType === "items" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSplitType("items")}
                className="gap-2"
              >
                <Receipt className="h-4 w-4" />
                By Items
              </Button>
              <Button
                variant={splitType === "custom" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSplitType("custom")}
                className="gap-2"
              >
                <Calculator className="h-4 w-4" />
                Custom
              </Button>
            </div>
          </div>

          {/* Number of Guests */}
          <div className="space-y-2">
            <Label>Number of Guests</Label>
            <Select value={numGuests} onValueChange={handleNumGuestsChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} guests
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Equal Split Preview */}
          {splitType === "equal" && (
            <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
              <p className="text-sm text-muted-foreground">Each guest pays:</p>
              <p className="text-2xl font-bold text-primary">${equalSplit.toFixed(2)}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.from({ length: numGuestsInt }, (_, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    Guest {i + 1}: ${equalSplit.toFixed(2)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Split by Items */}
          {splitType === "items" && (
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {Array.from({ length: numGuestsInt }, (_, guestIndex) => (
                <div key={guestIndex} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Guest {guestIndex + 1}</h4>
                    <Badge variant="outline" className="text-primary">
                      ${getGuestTotal(`guest${guestIndex + 1}`).toFixed(2)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {items.map(item => {
                      const guestKey = `guest${guestIndex + 1}`;
                      const isSelected = selectedItems[guestKey]?.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                          onClick={() => toggleItemForGuest(guestKey, item.id)}
                        >
                          <Checkbox checked={isSelected} />
                          <span className="flex-1">{item.name} x{item.quantity}</span>
                          <span className="text-muted-foreground">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom Amounts */}
          {splitType === "custom" && (
            <div className="space-y-3">
              {customAmounts.map((amount, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Label className="w-20">Guest {i + 1}</Label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        const newAmounts = [...customAmounts];
                        newAmounts[i] = e.target.value;
                        setCustomAmounts(newAmounts);
                      }}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">Total entered:</span>
                <span className={`font-medium ${
                  Math.abs(customAmounts.reduce((sum, a) => sum + (parseFloat(a) || 0), 0) - grandTotal) < 0.01
                    ? "text-success"
                    : "text-destructive"
                }`}>
                  ${customAmounts.reduce((sum, a) => sum + (parseFloat(a) || 0), 0).toFixed(2)}
                  {Math.abs(customAmounts.reduce((sum, a) => sum + (parseFloat(a) || 0), 0) - grandTotal) < 0.01 && (
                    <Check className="inline h-4 w-4 ml-1" />
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSplit}>
              <Split className="h-4 w-4 mr-2" />
              Split Bill
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
