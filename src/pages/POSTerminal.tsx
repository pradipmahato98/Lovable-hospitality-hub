import React, { useState } from "react";
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
  History as HistoryIcon,
  BarChart3,
  Grid3X3,
  ClipboardList,
  Clock,
  AlertTriangle,
  Check,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMenuItems, useMenuCategories } from "@/hooks/useMenuItems";
import { POSTableSystem } from "@/components/pos/POSTableSystem";
import { StaffClockPanel } from "@/components/pos/StaffClockPanel";
import { POSHeader } from "@/components/pos/POSHeader";
import { POSCombinedHistory } from "@/components/pos/POSCombinedHistory";
import { POSBillsTrack } from "@/components/pos/POSBillsTrack";
import {
  useUpdatePOSTable,
  usePOSTables,
  ensureActivePOSOrderForTable,
  upsertPOSOrderItemsForOrder,
  OrderItem
} from "@/hooks/usePOS";
import { usePaymentGateways, processPayment } from "@/hooks/usePaymentGateways";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";
import { useSearchParams } from "react-router-dom";
import { useInvoices } from "@/hooks/useBillingData";
import { useGuestFolios } from "@/hooks/useGuestFolios";
import { Checkbox } from "@/components/ui/checkbox";
import { useInventoryPOS } from "@/hooks/inventory/useInventoryPOSService";

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
  const updateTable = useUpdatePOSTable();
  const { data: dbMenuItems = [] } = useMenuItems();
  const { data: dbCategories = [] } = useMenuCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "tables";

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      prev.set("tab", value);
      return prev;
    });
  };
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isPlaced, setIsPlaced] = useState(false);
  const [placedCount, setPlacedCount] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [splitPayment, setSplitPayment] = useState(false);
  const [settlePreviousDue, setSettlePreviousDue] = useState(false);
  const [dueSettlementAmount, setDueSettlementAmount] = useState<string>("0");
  const [splitAmounts, setSplitAmounts] = useState<{ method: string; amount: string }[]>([
    { method: "cash", amount: "" },
    { method: "card", amount: "" },
  ]);
  const [roomChargeRoom, setRoomChargeRoom] = useState("");

  // Fetch rooms for room charge
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms-occupied-with-guest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, room_number, room_type, reservations(guest_id, guests(first_name, last_name))")
        .eq("status", "occupied")
        .order("room_number", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: allInvoices = [] } = useInvoices();
  const { data: gatewaysData } = usePaymentGateways();
  const { addFolioItem } = useGuestFolios();
  const availableGateways = gatewaysData?.gateways.filter(g => g.enabled) || [];
  const { deductBulkInventoryForSale } = useInventoryPOS();

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

  const handlePlaceOrder = async () => {
    if (!selectedTable || cart.length === 0) return;

    try {
      const orderItems: OrderItem[] = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        status: "pending"
      }));

      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          current_order: orderItems as any,
          status: "occupied"
        }
      });

      const orderId = await ensureActivePOSOrderForTable({
        tableId: selectedTable.id,
        tableNumber: selectedTable.number,
      });

      await upsertPOSOrderItemsForOrder(orderId, orderItems, "pending");

      setIsPlaced(true);
      setPlacedCount(cart.reduce((sum, i) => sum + i.quantity, 0));
      toast.success("Order placed successfully");
    } catch (error: any) {
      toast.error("Failed to place order: " + error.message);
    }
  };

  const isModified = cart.reduce((sum, i) => sum + i.quantity, 0) !== placedCount;

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
  const billTotal = afterDiscount + tax + tipAmount;
  const total = billTotal + (settlePreviousDue ? parseFloat(dueSettlementAmount) || 0 : 0);

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
          table_number: selectedTable?.number || "Counter",
          customer_name: paymentMethod === "room" ? `Guest in Room ${roomChargeRoom}` : (selectedTable ? `Table ${selectedTable.number}` : "Walk-in Guest"),
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

      // Automatically post to active guest folio if Room Charge
      if (paymentMethod === "room" && roomChargeRoom) {
         const room: any = rooms.find((r: any) => r.room_number === roomChargeRoom);
         const { data: folios } = await supabase.from('guest_folios').select('id', 'guest_id').eq('room_id', room?.id).eq('status', 'open').maybeSingle();

         if (folios) {
           await addFolioItem.mutateAsync({
             folio_id: folios.id,
             item_type: 'charge',
             source: 'restaurant',
             description: `POS Bill #${data.transaction_number}`,
             amount: billTotal,
             reference_id: data.id
           });

             // Sync spending back to guest profile
             const { data: guest } = await supabase.from('guests').select('total_spending').eq('id', folios.guest_id).single();
             await supabase.from('guests').update({
               total_spending: (guest?.total_spending || 0) + billTotal
             }).eq('id', folios.guest_id);

           // If settling previous due as part of this payment
           if (settlePreviousDue && parseFloat(dueSettlementAmount) > 0) {
              await addFolioItem.mutateAsync({
                folio_id: folios.id,
                item_type: 'payment',
                source: 'restaurant',
                description: `Settlement for Previous Due (POS #${data.transaction_number})`,
                amount: parseFloat(dueSettlementAmount),
                reference_id: data.id
              });
           }
         }
      }

      // Trigger inventory deduction
      await deductBulkInventoryForSale.mutateAsync({
        saleId: data.id,
        items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity }))
      });

      const methodLabel = selectedGateway ? gatewaysData?.gateways.find(g => g.id === selectedGateway)?.name :
                    paymentMethod === "room" ? `Room ${roomChargeRoom}` : paymentMethod;

      // If it was a table, clear the table
      if (selectedTable) {
        await updateTable.mutateAsync({
          id: selectedTable.id,
          updates: {
            status: "available",
            guests: null,
            server_name: null,
            start_time: null,
            current_order: []
          }
        });
      }

      toast.success(`Payment of NPR ${total.toFixed(2)} processed via ${methodLabel}`);

      setCart([]);
      setIsPlaced(false);
      setPlacedCount(0);
      setCheckoutOpen(false);
      setDiscountValue("");
      setTipPercent(0);
      setPaymentMethod("");
      setSelectedGateway("");
      setSplitPayment(false);
      setSettlePreviousDue(false);
      setDueSettlementAmount("0");
      setRoomChargeRoom("");
      handleTabChange("tables");
    } catch (error: any) {
      toast.error(`Failed to process payment: ${error.message}`);
    }
  };

  return (
    <MainLayout fixedHeight title="POS Terminal" subtitle="Process orders and handle table service">
      <div className="flex flex-col h-full overflow-hidden">
      <POSHeader />

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 px-4 sm:px-6 mt-4">
          <TabsList>
            <TabsTrigger value="tables" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="order" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Order
            </TabsTrigger>
          </TabsList>
        </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
        {/* Tables Tab - Table Selection System */}
        <TabsContent value="tables" className="mt-0 focus-visible:outline-none p-4 sm:p-6">
          <POSTableSystem
            onCheckout={(total, items) => {
              toast.success(`Checkout completed: NPR ${total.toFixed(2)} for ${items.length} items`);
            }}
            onTableSelect={(table) => {
              setSelectedTable(table);
              // Load table items into cart
              if (table.orders && table.orders.length > 0) {
                setCart(table.orders.map((o: any) => ({
                  id: o.id,
                  name: o.name,
                  price: o.price,
                  quantity: o.quantity,
                  category: o.category
                })));
                setIsPlaced(true);
                setPlacedCount(table.orders.reduce((sum: number, i: any) => sum + i.quantity, 0));
              } else {
                setCart([]);
                setIsPlaced(false);
                setPlacedCount(0);
              }
              handleTabChange("order");
            }}
          />
        </TabsContent>

        {/* Order Tab - Menu Items & Cart */}
        <TabsContent value="order" className="p-4 sm:p-6">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredItems.map((item: any) => {
              const Icon = item.icon || Coffee;
              return (
                <div
                  key={item.id}
                  className="group cursor-pointer bg-[#0a0e14] border border-slate-800 rounded-2xl p-6 text-center hover:border-blue-500/50 transition-all active:scale-95 shadow-lg"
                  onClick={() => addToCart(item)}
                >
                  <div className="h-16 w-16 rounded-full bg-[#161b22] border border-slate-800 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                    <Icon className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="font-bold text-white mb-1 truncate">{item.name}</p>
                  <p className="text-blue-500 font-mono font-bold text-sm">NPR {item.price}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <Card variant="elevated" className="h-fit sticky top-20 bg-[#0a0e14] border-[#1e293b]">
          <CardHeader>
            <div className="flex items-center justify-between">
               <CardTitle className="flex items-center gap-2 text-white">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                  {selectedTable ? `Table ${selectedTable.number}` : "Current Order"}
               </CardTitle>
               <Badge variant="outline" className="text-[10px] text-muted-foreground border-slate-800">
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
               </Badge>
            </div>
            {cart.length > 0 && (
               <CardDescription className="text-slate-400">
                  {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
               </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                 <p className="text-slate-400 text-lg font-medium">No items yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#161b22] border border-slate-800/50 group hover:border-blue-500/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">NPR {item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-[#0a0e14] rounded-lg border border-slate-800 p-0.5">
                           <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => updateQuantity(item.id, -1)}>
                             <Minus className="h-3 w-3" />
                           </Button>
                           <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                           <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => updateQuantity(item.id, 1)}>
                             <Plus className="h-3 w-3" />
                           </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/50 hover:text-red-400 hover:bg-red-400/10" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white font-mono">NPR {subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tax (10%)</span>
                    <span className="text-white font-mono">NPR {subtotal * 0.1}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-slate-800 pt-3">
                    <span className="text-white">Total</span>
                    <span className="text-blue-500 font-mono">NPR {subtotal * 1.1}</span>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
               <Button
                  variant="outline"
                  className="bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-all py-6 rounded-xl"
                  onClick={() => {
                    setCart([]);
                    setSelectedTable(null);
                    setIsPlaced(false);
                    setPlacedCount(0);
                    handleTabChange("tables");
                  }}
               >
                  Cancel
               </Button>
               {(() => {
                  const hasItems = cart.length > 0;
                  const currentTotalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

                  if (!hasItems) {
                    return (
                      <Button
                        variant="blue"
                        className="opacity-30 cursor-not-allowed py-6 rounded-xl font-bold"
                        disabled
                      >
                         <Check className="h-4 w-4 mr-2" />
                         Place Order
                      </Button>
                    );
                  }

                  if (!isPlaced) {
                    return (
                      <Button
                        variant="blue"
                        className="shadow-lg shadow-blue-500/20 py-6 rounded-xl font-bold"
                        onClick={handlePlaceOrder}
                      >
                         <Check className="h-4 w-4 mr-2" />
                         Place Order
                      </Button>
                    );
                  }

                  if (isModified) {
                    return (
                      <Button
                        variant="blue"
                        className="shadow-lg shadow-blue-500/20 py-6 rounded-xl font-bold"
                        onClick={handlePlaceOrder}
                      >
                         <ArrowRightLeft className="h-4 w-4 mr-2" />
                         Update Order
                      </Button>
                    );
                  }

                  return (
                    <Button
                      variant="blue"
                      className="shadow-lg shadow-blue-500/20 py-6 rounded-xl font-bold"
                      onClick={handleOpenCheckout}
                    >
                       <Receipt className="h-4 w-4 mr-2" />
                       Proceed to Bill
                    </Button>
                  );
               })()}
            </div>
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        </div>
      </Tabs>
      </div>
    </MainLayout>
  );
};

export default POSTerminal;
