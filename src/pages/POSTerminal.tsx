import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Search,
  Coffee,
  Utensils,
  Wine,
  IceCream,
  Receipt,
  Percent,
  Split,
  Wallet,
  Building2,
  X,
  Grid3X3,
  ClipboardList,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMenuItems, useMenuCategories } from "@/hooks/useMenuItems";
import { POSTableSystem, StaffClockPanel, POSHeader } from "@/components/pos";
import { usePaymentGateways, processPayment } from "@/hooks/usePaymentGateways";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const categoryIcons: Record<string, any> = {
  "Beverages": Coffee,
  "Food": Utensils,
  "Bar": Wine,
  "Desserts": IceCream,
};

const POSTerminal = () => {
  const navigate = useNavigate();
  useAdminRealtime();
  const { data: dbMenuItems = [] } = useMenuItems();
  const { data: dbCategories = [] } = useMenuCategories();
  const [activeTab, setActiveTab] = useState("tables");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [splitPayment, setSplitPayment] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState<{ method: string; amount: string }[]>([
    { method: "cash", amount: "" },
    { method: "card", amount: "" },
  ]);
  const [roomChargeRoom, setRoomChargeRoom] = useState("");

  // Fetch rooms for room charge
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms-occupied"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, room_number, room_type")
        .eq("status", "occupied")
        .order("room_number", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: gatewaysData } = usePaymentGateways();
  const availableGateways = gatewaysData?.gateways.filter(g => g.enabled) || [];

  const menuItems = dbMenuItems.map((item: any) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category?.name || "Other",
    icon: categoryIcons[item.category?.name] || Coffee,
  }));

  const categories = [...new Set(menuItems.map((item: any) => item.category as string))];

  const filteredItems = menuItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate discount
  const discountAmount = discountValue
    ? discountType === "percent"
      ? subtotal * (parseFloat(discountValue) / 100)
      : parseFloat(discountValue)
    : 0;

  const afterDiscount = subtotal - discountAmount;
  const tipAmount = afterDiscount * (tipPercent / 100);
  const tax = afterDiscount * 0.1;
  const total = afterDiscount + tax + tipAmount;

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    if (splitPayment) {
      const splitTotal = splitAmounts.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
      if (Math.abs(splitTotal - total) > 0.01) {
        toast.error(`Split amounts must equal ${formatCurrency(total)}`);
        return;
      }
    } else if (paymentMethod === "room" && !roomChargeRoom) {
      toast.error("Please select a room");
      return;
    } else if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      if (paymentMethod === "wallet" && selectedGateway) {
        const result = await processPayment(selectedGateway, total, "USD", `POS-${Date.now()}`);
        if (!result.success) {
          toast.error(`Payment failed: ${result.error}`);
          return;
        }
      }

      // Insert transaction into database
      const { data, error } = await (supabase as any)
        .from("pos_transactions")
        .insert({
          transaction_number: `POS-${Date.now()}`,
          table_number: "Counter", // Placeholder for walk-in
          customer_name: paymentMethod === "room" ? `Guest in Room ${roomChargeRoom}` : "Walk-in Guest",
          subtotal: subtotal,
          discount_amount: discountAmount,
          tax_amount: tax,
          tip_amount: tipAmount,
          total: total,
          payment_method: splitPayment ? "split" : (selectedGateway || paymentMethod),
          items_count: cart.reduce((sum, i) => sum + i.quantity, 0),
          items: cart,
          room_number: paymentMethod === "room" ? roomChargeRoom : null,
        })
        .select()
        .single();

      if (error) throw error;

      const methodLabel = selectedGateway ? gatewaysData?.gateways.find(g => g.id === selectedGateway)?.name :
                    paymentMethod === "room" ? `Room ${roomChargeRoom}` : paymentMethod;
      toast.success(`Payment of ${formatCurrency(total)} processed via ${methodLabel}`);

      setCart([]);
      setCheckoutOpen(false);
      setDiscountValue("");
      setTipPercent(0);
      setPaymentMethod("");
      setSelectedGateway("");
      setSplitPayment(false);
      setRoomChargeRoom("");
      setActiveTab("tables");
    } catch (error: any) {
      toast.error(`Failed to process payment: ${error.message}`);
    }
  };

  return (
    <MainLayout title="POS Terminal" subtitle="Process orders and handle table service">
      <POSHeader />

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="tables" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="order" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Order
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <Receipt className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="clock" className="gap-2">
              <Clock className="h-4 w-4" />
              Clock In/Out
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tables Tab - Table Selection System */}
        <TabsContent value="tables">
          <POSTableSystem onCheckout={(total, items) => {
            toast.success(`Checkout completed: ${formatCurrency(total)} for ${items.length} items`);
          }} />
        </TabsContent>

         {/* Clock In/Out Tab */}
         <TabsContent value="clock">
           <StaffClockPanel />
         </TabsContent>

        {/* Order Tab - Menu Items & Cart */}
        <TabsContent value="order">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Categories */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={activeCategory === null ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(null)}
              >
                All
              </Button>
              {categories.map((cat: string) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredItems.map((item: any) => {
              const Icon = item.icon || Coffee;
              return (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-primary font-semibold">{formatCurrency(item.price)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <Card variant="elevated" className="h-fit sticky top-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Current Order
            </CardTitle>
            <CardDescription>
              {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span>${(subtotal * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-border pt-2">
                    <span>Total</span>
                    <span className="text-primary">${(subtotal * 1.1).toFixed(2)}</span>
                  </div>
                </div>

                <Button variant="gold" className="w-full gap-2" onClick={handleOpenCheckout}>
                  <Receipt className="h-4 w-4" />
                  Checkout
                </Button>
              </>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        {/* Billing Tab - Checkout */}
        <TabsContent value="billing">
          <Card variant="elevated" className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Complete Payment
              </CardTitle>
              <CardDescription>Review order and select payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items in cart</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("order")}>
                    Go to Order
                  </Button>
                </div>
              ) : (
                <>
                  {/* Order Summary */}
                  <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                    <h4 className="font-medium">Order Summary</h4>
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-success">
                          <span>Discount</span>
                          <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Tax (10%)</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      {tipAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Tip ({tipPercent}%)</span>
                          <span>${tipAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg border-t border-border pt-2">
                        <span>Total</span>
                        <span className="text-primary">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Discount
                    </Label>
                    <div className="flex gap-2">
                      <Select value={discountType} onValueChange={(v: "percent" | "fixed") => setDiscountType(v)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">%</SelectItem>
                          <SelectItem value="fixed">$</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder={discountType === "percent" ? "0" : "0.00"}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="space-y-2">
                    <Label>Tip</Label>
                    <div className="flex gap-2">
                      {[0, 10, 15, 20].map((p) => (
                        <Button
                          key={p}
                          variant={tipPercent === p ? "secondary" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setTipPercent(p)}
                        >
                          {p === 0 ? "None" : `${p}%`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Split Payment Toggle */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={splitPayment ? "secondary" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={() => setSplitPayment(!splitPayment)}
                    >
                      <Split className="h-4 w-4" />
                      Split Payment
                    </Button>
                  </div>

                  {/* Payment Method */}
                  {!splitPayment ? (
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={paymentMethod === "cash" ? "secondary" : "outline"}
                          className="gap-2"
                          onClick={() => setPaymentMethod("cash")}
                        >
                          <Banknote className="h-4 w-4" />
                          Cash
                        </Button>
                        <Button
                          variant={paymentMethod === "card" ? "secondary" : "outline"}
                          className="gap-2"
                          onClick={() => setPaymentMethod("card")}
                        >
                          <CreditCard className="h-4 w-4" />
                          Card
                        </Button>
                        <Button
                          variant={paymentMethod === "wallet" ? "secondary" : "outline"}
                          className="gap-2"
                          onClick={() => {
                            setPaymentMethod("wallet");
                            if (availableGateways.length === 1) setSelectedGateway(availableGateways[0].id);
                          }}
                        >
                          <Wallet className="h-4 w-4" />
                          Digital Wallet
                        </Button>
                        <Button
                          variant={paymentMethod === "room" ? "secondary" : "outline"}
                          className="gap-2"
                          onClick={() => setPaymentMethod("room")}
                        >
                          <Building2 className="h-4 w-4" />
                          Room Charge
                        </Button>
                      </div>

                      {paymentMethod === "wallet" && availableGateways.length > 0 && (
                        <div className="space-y-2 mt-2">
                          <Label className="text-xs">Select Provider</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {availableGateways.map((gateway) => (
                              <Button
                                key={gateway.id}
                                variant={selectedGateway === gateway.id ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setSelectedGateway(gateway.id)}
                                className="h-8 text-xs"
                              >
                                {gateway.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {paymentMethod === "room" && (
                        <Select value={roomChargeRoom} onValueChange={setRoomChargeRoom}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select occupied room" />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No occupied rooms
                              </SelectItem>
                            ) : (
                              rooms.map((room) => (
                                <SelectItem key={room.id} value={room.room_number}>
                                  Room {room.room_number} ({room.room_type})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label>Split Amounts</Label>
                      {splitAmounts.map((split, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Select
                            value={split.method}
                            onValueChange={(v) => {
                              const updated = [...splitAmounts];
                              updated[index].method = v;
                              setSplitAmounts(updated);
                            }}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="wallet">Wallet</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={split.amount}
                            onChange={(e) => {
                              const updated = [...splitAmounts];
                              updated[index].amount = e.target.value;
                              setSplitAmounts(updated);
                            }}
                            className="flex-1"
                          />
                          {splitAmounts.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSplitAmounts(splitAmounts.filter((_, i) => i !== index))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setSplitAmounts([...splitAmounts, { method: "cash", amount: "" }])}
                      >
                        <Plus className="h-4 w-4" />
                        Add Split
                      </Button>
                    </div>
                  )}

                  <Button variant="gold" className="w-full" onClick={handleCheckout}>
                    Complete Payment - ${total.toFixed(2)}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default POSTerminal;
