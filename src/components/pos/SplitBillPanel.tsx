import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CreditCard,
  Banknote,
  Wallet,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  status: string;
}

interface SplitPayment {
  id: string;
  method: string;
  amount: number;
  items: string[]; // item IDs assigned to this split
  guestName?: string;
}

interface SplitBillPanelProps {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  onComplete: (payments: SplitPayment[]) => void;
  onCancel: () => void;
}

const paymentMethods = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "digital", label: "Digital Wallet", icon: Wallet },
];

export function SplitBillPanel({
  items,
  subtotal,
  tax,
  total,
  onComplete,
  onCancel,
}: SplitBillPanelProps) {
  const [splitType, setSplitType] = useState<"equal" | "items">("equal");
  const [numberOfSplits, setNumberOfSplits] = useState(2);
  const [payments, setPayments] = useState<SplitPayment[]>([
    { id: "1", method: "cash", amount: 0, items: [], guestName: "Guest 1" },
    { id: "2", method: "card", amount: 0, items: [], guestName: "Guest 2" },
  ]);
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, string>>({});

  // Calculate equal split amounts
  const equalSplitAmount = useMemo(() => {
    return total / numberOfSplits;
  }, [total, numberOfSplits]);

  // Calculate totals for item-based splits
  const itemSplitTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    payments.forEach((p) => {
      const itemsSubtotal = p.items.reduce((sum, itemId) => {
        const item = items.find((i) => i.id === itemId);
        return sum + (item ? item.price * item.quantity : 0);
      }, 0);
      // Add proportional tax
      const proportionalTax = subtotal > 0 ? (itemsSubtotal / subtotal) * tax : 0;
      totals[p.id] = itemsSubtotal + proportionalTax;
    });
    return totals;
  }, [payments, items, subtotal, tax]);

  // Check if all items are assigned (for item-based split)
  const allItemsAssigned = useMemo(() => {
    const assignedItemIds = new Set(payments.flatMap((p) => p.items));
    return items.every((item) => assignedItemIds.has(item.id));
  }, [payments, items]);

  // Check if payments are valid
  const isPaymentValid = useMemo(() => {
    if (splitType === "equal") {
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      return Math.abs(totalPaid - total) < 0.01;
    } else {
      return allItemsAssigned;
    }
  }, [splitType, payments, total, allItemsAssigned]);

  // Handle equal split setup
  const handleEqualSplitChange = (count: number) => {
    setNumberOfSplits(count);
    const newPayments: SplitPayment[] = [];
    for (let i = 0; i < count; i++) {
      newPayments.push({
        id: String(i + 1),
        method: "cash",
        amount: total / count,
        items: [],
        guestName: `Guest ${i + 1}`,
      });
    }
    setPayments(newPayments);
  };

  // Add a new payment split
  const addPaymentSplit = () => {
    const newId = String(payments.length + 1);
    setPayments([
      ...payments,
      {
        id: newId,
        method: "cash",
        amount: 0,
        items: [],
        guestName: `Guest ${payments.length + 1}`,
      },
    ]);
  };

  // Remove a payment split
  const removePaymentSplit = (id: string) => {
    if (payments.length <= 2) {
      toast.error("Minimum 2 splits required");
      return;
    }
    setPayments(payments.filter((p) => p.id !== id));
  };

  // Update payment details
  const updatePayment = (id: string, updates: Partial<SplitPayment>) => {
    setPayments(
      payments.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  // Toggle item assignment to a payment
  const toggleItemAssignment = (itemId: string, paymentId: string) => {
    setPayments(
      payments.map((p) => {
        if (p.id === paymentId) {
          const hasItem = p.items.includes(itemId);
          return {
            ...p,
            items: hasItem
              ? p.items.filter((i) => i !== itemId)
              : [...p.items, itemId],
          };
        } else {
          // Remove from other payments
          return {
            ...p,
            items: p.items.filter((i) => i !== itemId),
          };
        }
      })
    );
    setSelectedItemsMap((prev) => ({
      ...prev,
      [itemId]: paymentId,
    }));
  };

  // Handle complete
  const handleComplete = () => {
    if (splitType === "equal") {
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaid - total) > 0.01) {
        toast.error(`Split amounts must equal $${total.toFixed(2)}`);
        return;
      }
    } else if (!allItemsAssigned) {
      toast.error("Please assign all items to a payment");
      return;
    }

    const finalPayments = splitType === "equal"
      ? payments
      : payments.map((p) => ({ ...p, amount: itemSplitTotals[p.id] || 0 }));

    onComplete(finalPayments);
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Split className="h-5 w-5" />
          Split Bill
        </CardTitle>
        <CardDescription>
          Divide the bill between multiple guests or payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Split Type Selection */}
        <Tabs value={splitType} onValueChange={(v) => setSplitType(v as "equal" | "items")}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="equal" className="gap-2">
              <Users className="h-4 w-4" />
              Equal Split
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <Receipt className="h-4 w-4" />
              By Items
            </TabsTrigger>
          </TabsList>

          {/* Equal Split */}
          <TabsContent value="equal" className="space-y-4 mt-4">
            <div className="flex items-center gap-4">
              <Label>Number of Guests:</Label>
              <Select
                value={String(numberOfSplits)}
                onValueChange={(v) => handleEqualSplitChange(parseInt(v))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">
                Each pays: <span className="font-semibold text-foreground">${equalSplitAmount.toFixed(2)}</span>
              </span>
            </div>

            <div className="space-y-3">
              {payments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="p-3 rounded-lg bg-secondary/50 flex items-center gap-4"
                >
                  <div className="flex-1">
                    <Input
                      placeholder={`Guest ${index + 1}`}
                      value={payment.guestName}
                      onChange={(e) =>
                        updatePayment(payment.id, { guestName: e.target.value })
                      }
                      className="mb-2"
                    />
                    <div className="flex items-center gap-2">
                      <Select
                        value={payment.method}
                        onValueChange={(v) => updatePayment(payment.id, { method: v })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={payment.amount.toFixed(2)}
                        onChange={(e) =>
                          updatePayment(payment.id, { amount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-24"
                      />
                    </div>
                  </div>
                  {payments.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removePaymentSplit(payment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addPaymentSplit} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add Payment
            </Button>

            <div className="p-3 rounded-lg bg-muted/50 flex justify-between">
              <span>Total Split:</span>
              <span
                className={`font-semibold ${
                  Math.abs(payments.reduce((s, p) => s + p.amount, 0) - total) < 0.01
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                ${payments.reduce((s, p) => s + p.amount, 0).toFixed(2)} / ${total.toFixed(2)}
              </span>
            </div>
          </TabsContent>

          {/* Item-based Split */}
          <TabsContent value="items" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={addPaymentSplit} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Guest
              </Button>
              <span className="text-sm text-muted-foreground">
                Assign items to each guest by clicking
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-medium">Order Items</h4>
                {items.map((item) => {
                  const assignedTo = selectedItemsMap[item.id];
                  const assignedPayment = payments.find((p) => p.items.includes(item.id));

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        assignedPayment
                          ? "bg-success/10 border-success/30"
                          : "bg-secondary/50 border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {payments.map((payment) => (
                          <Button
                            key={payment.id}
                            variant={payment.items.includes(item.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleItemAssignment(item.id, payment.id)}
                          >
                            {payment.guestName || `Guest ${payment.id}`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Guest Summaries */}
              <div className="space-y-3">
                <h4 className="font-medium">Guest Totals</h4>
                {payments.map((payment, index) => (
                  <div key={payment.id} className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between mb-2">
                      <Input
                        placeholder={`Guest ${index + 1}`}
                        value={payment.guestName}
                        onChange={(e) =>
                          updatePayment(payment.id, { guestName: e.target.value })
                        }
                        className="max-w-[150px]"
                      />
                      {payments.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-8 w-8"
                          onClick={() => removePaymentSplit(payment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="text-sm space-y-1 mb-2">
                      {payment.items.length === 0 ? (
                        <p className="text-muted-foreground">No items assigned</p>
                      ) : (
                        payment.items.map((itemId) => {
                          const item = items.find((i) => i.id === itemId);
                          if (!item) return null;
                          return (
                            <div key={itemId} className="flex justify-between">
                              <span>{item.name} x{item.quantity}</span>
                              <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <Select
                        value={payment.method}
                        onValueChange={(v) => updatePayment(payment.id, { method: v })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="font-semibold text-primary">
                        ${(itemSplitTotals[payment.id] || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}

                {!allItemsAssigned && (
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-400">
                    {items.length - Object.keys(selectedItemsMap).length} items unassigned
                  </Badge>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Order Summary */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t border-border pt-2">
            <span>Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="blue"
            onClick={handleComplete}
            disabled={!isPaymentValid}
            className="flex-1 gap-2"
          >
            <Check className="h-4 w-4" />
            Complete Split Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
