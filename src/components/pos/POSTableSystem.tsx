import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutGrid,
  ClipboardList,
  Receipt,
  Plus,
  Minus,
  Trash2,
  Users,
  Clock,
  Search,
  Coffee,
  Utensils,
  Wine,
  IceCream,
  ShoppingCart,
  Check,
  X,
  Zap,
  Star,
  GitMerge,
  Split,
  ArrowRightLeft,
  Pause,
  Play,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useQuickMenuSettings } from "@/hooks/useSettings";
import { useMenuItems } from "@/hooks/useMenuItems";
import {
  usePOSTables,
  useUpdatePOSTable,
  useCreatePOSTransaction,
  ensureActivePOSOrderForTable,
  getActivePOSOrderIdForTable,
  upsertPOSOrderItemsForOrder,
  updatePOSOrderStatusAndTotals,
  updatePOSOrderItemsStatusForOrder,
  movePOSOrderItemsToOrder,
  OrderItem,
  POSTable,
} from "@/hooks/usePOS";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SplitBillPanel } from "./SplitBillPanel";
import { useInventoryPOS } from "@/hooks/inventory";
import { supabase } from "@/integrations/supabase/client";
import { useGuestFolios } from "@/hooks/useGuestFolios";

interface TableInfo {
  id: string;
  number: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "billing" | "held";
  guests?: number;
  server?: string;
  startTime?: string;
  orders: OrderItem[];
}

const statusColors = {
  available: "bg-success/20 text-success border-success/30",
  occupied: "bg-primary/20 text-primary border-primary/30",
  reserved: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  billing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  held: "bg-muted text-muted-foreground border-muted",
};

const orderStatusColors = {
  pending: "bg-muted text-muted-foreground",
  preparing: "bg-amber-500/20 text-amber-400",
  ready: "bg-success/20 text-success",
  served: "bg-primary/20 text-primary",
  cancelled: "bg-destructive/20 text-destructive",
};

interface POSTableSystemProps {
  onCheckout: (total: number, items: OrderItem[]) => void;
  onTableSelect?: (table: TableInfo) => void;
}

export function POSTableSystem({ onCheckout, onTableSelect }: POSTableSystemProps) {
  const { data: dbMenuItems = [] } = useMenuItems();
  const menuItems = dbMenuItems.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category?.name || "Other",
    icon: item.category?.name === "Food" ? Utensils : item.category?.name === "Bar" ? Wine : Coffee
  }));

  // Use backend-backed hooks for real multi-device sync
  const {
    data: posTables,
    isLoading,
    refetch,
    realtimeStatus,
  } = usePOSTables();
  const updateTable = useUpdatePOSTable();
  const createTransaction = useCreatePOSTransaction();
  const { addFolioItem } = useGuestFolios();
  const { deductBulkInventoryForSale } = useInventoryPOS();

  // Transform POSTable to TableInfo format
  const tables: TableInfo[] = posTables.map((t) => ({
    id: t.id,
    number: t.table_number,
    capacity: t.capacity,
    status: t.status,
    guests: t.guests || undefined,
    server: t.server_name || undefined,
    startTime: t.start_time || undefined,
    orders: (t.current_order || []) as OrderItem[],
  }));

  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("tables");
  const [menuTab, setMenuTab] = useState<"quick" | "full">("quick");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState("2");

  // Toggle table selection for checkbox system
  const toggleTableSelection = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId)
        ? prev.filter((id) => id !== tableId)
        : [...prev, tableId]
    );
  };

  const clearTableSelection = () => {
    setSelectedTableIds([]);
  };

  // Fetch quick menu settings from database
  const { data: quickMenuSettings } = useQuickMenuSettings();
  const quickMenuIds = quickMenuSettings?.enabled_items || ["1", "4", "5", "6", "12", "13"];

  // Sync selectedTable with tables state when data changes
  useEffect(() => {
    if (selectedTable) {
      const updated = tables.find(t => t.id === selectedTable.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedTable)) {
        setSelectedTable(updated);
      }
    }
  }, [tables, selectedTable]);

  const categories = [...new Set(menuItems.map((item) => item.category))];
  const quickMenuItems = menuItems.filter(item => quickMenuIds.includes(item.id));

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTable = (table: TableInfo) => {
    setSelectedTable(table);
    if (onTableSelect && table.status !== "available") {
      onTableSelect(table);
    }
    if (table.status === "available") {
      setActiveTab("tables");
    } else {
      setActiveTab("order");
    }
  };

  const handleOpenTable = async () => {
    if (!selectedTable || !guestCount) return;

    const now = new Date().toISOString();

    try {
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          status: "occupied",
          guests: parseInt(guestCount),
          start_time: now,
          server_name: "Current User",
          current_order: [],
        },
      });

      // Ensure there is an active order record for this table
      await ensureActivePOSOrderForTable({
        tableId: selectedTable.id,
        tableNumber: selectedTable.number,
        guests: parseInt(guestCount),
        serverName: "Current User",
        startTime: now,
      });

      const updatedTable = {
        ...selectedTable,
        status: "occupied" as const,
        guests: parseInt(guestCount),
        startTime: now,
        server: "Current User",
      };
      setSelectedTable(updatedTable);
      toast.success(`Table ${selectedTable.number} opened with ${guestCount} guests`);
      if (onTableSelect) {
        onTableSelect(updatedTable as any);
      }
      setActiveTab("order");
    } catch (error) {
      console.error("Error opening table:", error);
      toast.error("Failed to open table");
    }
  };

  const handleAddItem = async (item: typeof menuItems[0]) => {
    if (!selectedTable || selectedTable.status === "available") {
      toast.error("Please open a table first");
      return;
    }

    const newOrder: OrderItem = {
      id: crypto.randomUUID(),
      name: item.name,
      price: item.price,
      quantity: 1,
      category: item.category,
      status: "pending",
    };

    const currentOrders = selectedTable.orders || [];
    const existing = currentOrders.find((o) => o.name === item.name && o.status === "pending");
    
    let updatedOrders: OrderItem[];
    if (existing) {
      updatedOrders = currentOrders.map((o) =>
        o.id === existing.id ? { ...o, quantity: o.quantity + 1 } : o
      );
    } else {
      updatedOrders = [...currentOrders, newOrder];
    }

    try {
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          current_order: updatedOrders,
        },
      });
      
      setSelectedTable({
        ...selectedTable,
        orders: updatedOrders,
      });
      
      toast.success(`${item.name} added to Table ${selectedTable.number}`);
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    }
  };

  const handleUpdateQuantity = async (orderId: string, delta: number) => {
    if (!selectedTable) return;
    
    const updatedOrders = selectedTable.orders
      .map((o) => (o.id === orderId ? { ...o, quantity: Math.max(0, o.quantity + delta) } : o))
      .filter((o) => o.quantity > 0);

    try {
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          current_order: updatedOrders,
        },
      });
      
      setSelectedTable({
        ...selectedTable,
        orders: updatedOrders,
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const handleRemoveItem = async (orderId: string) => {
    if (!selectedTable) return;
    
    const updatedOrders = selectedTable.orders.filter((o) => o.id !== orderId);

    try {
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          current_order: updatedOrders,
        },
      });
      
      setSelectedTable({
        ...selectedTable,
        orders: updatedOrders,
      });
      
      toast.success("Item removed");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const handleSendToKitchen = async () => {
    if (!selectedTable) return;

    const pendingOrders = selectedTable.orders.filter((o) => o.status === "pending");
    if (pendingOrders.length === 0) {
      toast.error("No pending items to send");
      return;
    }

    try {
      const orderId = await ensureActivePOSOrderForTable({
        tableId: selectedTable.id,
        tableNumber: selectedTable.number,
        guests: selectedTable.guests ?? null,
        serverName: selectedTable.server ?? null,
        startTime: selectedTable.startTime ?? null,
      });

      // Persist pending items into the backend order_items table.
      // (Kitchen Display reads from order_items to sync across devices.)
      await upsertPOSOrderItemsForOrder(orderId, pendingOrders, "pending");

      toast.success(`${pendingOrders.length} item(s) sent to kitchen`);
    } catch (error) {
      console.error("Error sending to kitchen:", error);
      toast.error("Failed to send to kitchen");
    }
  };

  const handleProceedToBilling = async () => {
    if (!selectedTable) return;

    try {
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          status: "billing",
        },
      });

      const orderId = await ensureActivePOSOrderForTable({
        tableId: selectedTable.id,
        tableNumber: selectedTable.number,
        guests: selectedTable.guests ?? null,
        serverName: selectedTable.server ?? null,
        startTime: selectedTable.startTime ?? null,
      });
      await updatePOSOrderStatusAndTotals({ orderId, status: "billing" });

      setSelectedTable({
        ...selectedTable,
        status: "billing",
      });

      setActiveTab("billing");
    } catch (error) {
      console.error("Error proceeding to billing:", error);
      toast.error("Failed to proceed to billing");
    }
  };

  const handleCheckout = async () => {
    if (!selectedTable) return;

    const subtotal = selectedTable.orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    try {
      // Save transaction to database
      await createTransaction.mutateAsync({
        table_number: selectedTable.number,
        customer_name: null,
        customer_address: null,
        company_id: null,
        company_name: null,
        vat_number: null,
        pan_number: null,
        subtotal,
        discount_amount: 0,
        tax_amount: tax,
        tip_amount: 0,
        total,
        payment_method: "cash",
        rrn_number: null,
        transaction_ref: null,
        card_last_four: null,
        card_type: null,
        room_number: null,
        items_count: selectedTable.orders.length,
        items: selectedTable.orders.map((o) => ({
          id: o.id,
          order_id: undefined,
          item_name: o.name,
          item_price: o.price,
          quantity: o.quantity,
          category: o.category,
          status: o.status,
          notes: o.notes || null,
        })),
      });

      // Mark the active backend order as paid + keep totals in sync
      const orderId = await getActivePOSOrderIdForTable(selectedTable.id);
      if (orderId) {
        await updatePOSOrderStatusAndTotals({
          orderId,
          status: "paid",
          subtotal,
          discount_amount: 0,
          tax_amount: tax,
          tip_amount: 0,
          total,
        });
        await updatePOSOrderItemsStatusForOrder(orderId, "served");
      }

      onCheckout(total, selectedTable.orders);

      // Post to Guest Folio if customer has an active folio
      const { data: activeFolio } = await supabase.from('guest_folios').select('id').eq('table_id', selectedTable.id).eq('status', 'open').maybeSingle();
      if (activeFolio) {
         await addFolioItem.mutateAsync({
           folio_id: activeFolio.id,
           item_type: 'charge',
           source: 'restaurant',
           description: `Table ${selectedTable.number} Bill`,
           amount: total,
         });
      }

      // Trigger inventory deduction
      // For real inventory link, the OrderItem name/id should match MenuItem name/id
      // Assuming OrderItem contains MenuItem ID or name that can be mapped
      await deductBulkInventoryForSale.mutateAsync({
        saleId: selectedTable.id, // Or transaction id if available
        items: selectedTable.orders.map(o => ({ menu_item_id: o.id, quantity: o.quantity }))
      });

      await handleCloseTable();
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("Failed to complete checkout");
    }
  };

  const handleCloseTable = async () => {
    if (!selectedTable) return;

    try {
      // Cancel any active backend order (if it exists) when closing without checkout.
      const orderId = await getActivePOSOrderIdForTable(selectedTable.id);
      if (orderId) {
        await updatePOSOrderStatusAndTotals({ orderId, status: "cancelled" });
      }

      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          status: "available",
          guests: null,
          server_name: null,
          start_time: null,
          merged_with: null,
          current_order: [],
        },
      });

      toast.success(`Table ${selectedTable.number} closed`);
      setSelectedTable(null);
      setActiveTab("tables");
    } catch (error) {
      console.error("Error closing table:", error);
      toast.error("Failed to close table");
    }
  };

  // ============= Table Actions: Transfer, Merge, Split, Hold =============
  const handleTransferTable = async (targetTableId: string) => {
    if (!selectedTable) return;

    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!targetTable) return;

    try {
      // Move orders to target table
      await updateTable.mutateAsync({
        id: targetTableId,
        updates: {
          status: "occupied",
          guests: selectedTable.guests,
          server_name: selectedTable.server,
          start_time: selectedTable.startTime || new Date().toISOString(),
          current_order: selectedTable.orders,
        },
      });

      // Clear source table
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          status: "available",
          guests: null,
          server_name: null,
          start_time: null,
          current_order: [],
        },
      });

      toast.success(`Order transferred to Table ${targetTable.number}`);
      setSelectedTable(null);
    } catch (error) {
      console.error("Error transferring table:", error);
      toast.error("Failed to transfer order");
    }
  };

  const handleMergeTables = async (targetTableId: string) => {
    if (!selectedTable) return;

    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!targetTable) return;

    try {
      // Merge orders into selected table and mark target as merged
      const mergedWith = [...(selectedTable.orders.length > 0 ? [targetTable.number] : [])];

      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          merged_with: mergedWith.length > 0 ? mergedWith : null,
          capacity: selectedTable.capacity + targetTable.capacity,
        },
      });

      // Mark target table as reserved (merged)
      await updateTable.mutateAsync({
        id: targetTableId,
        updates: {
          status: "reserved",
          merged_with: [selectedTable.number],
        },
      });

      toast.success(`Table ${targetTable.number} merged with Table ${selectedTable.number}`);
    } catch (error) {
      console.error("Error merging tables:", error);
      toast.error("Failed to merge tables");
    }
  };

  const handleSplitTable = async () => {
    if (!selectedTable || !selectedTable.orders.length) return;

    // Split the order in half (simple split for demo)
    const midPoint = Math.ceil(selectedTable.orders.length / 2);
    const firstHalf = selectedTable.orders.slice(0, midPoint);
    const secondHalf = selectedTable.orders.slice(midPoint);

    // Find an available table for the second half
    const availableTable = tables.find(
      (t) => t.id !== selectedTable.id && t.status === "available"
    );

    if (!availableTable) {
      toast.error("No available table to split to");
      return;
    }

    try {
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: { current_order: firstHalf },
      });

      await updateTable.mutateAsync({
        id: availableTable.id,
        updates: {
          status: "occupied",
          guests: 1,
          server_name: selectedTable.server,
          start_time: new Date().toISOString(),
          current_order: secondHalf,
        },
      });

      setSelectedTable({
        ...selectedTable,
        orders: firstHalf,
      });

      toast.success(`Order split to Table ${availableTable.number}`);
    } catch (error) {
      console.error("Error splitting table:", error);
      toast.error("Failed to split order");
    }
  };

  const handleHoldTable = async () => {
    if (!selectedTable) return;

    try {
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: { status: "held" },
      });

      setSelectedTable({ ...selectedTable, status: "held" });
      toast.success(`Table ${selectedTable.number} put on hold`);
    } catch (error) {
      console.error("Error holding table:", error);
      toast.error("Failed to hold table");
    }
  };

  const handleResumeTable = async () => {
    if (!selectedTable) return;

    try {
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: { status: "occupied" },
      });

      setSelectedTable({ ...selectedTable, status: "occupied" });
      toast.success(`Table ${selectedTable.number} resumed`);
    } catch (error) {
      console.error("Error resuming table:", error);
      toast.error("Failed to resume table");
    }
  };

  const getTableTotal = (table: TableInfo) => {
    return table.orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
  };

  const getElapsedTime = (startTime: string | undefined) => {
    if (!startTime) return "";
    const diff = Date.now() - new Date(startTime).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Available tables for transfer/merge
  const availableTables = tables.filter(
    (t) => t.id !== selectedTable?.id && t.status === "available"
  );

  // Dialog states for transfer/merge
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [targetTableId, setTargetTableId] = useState("");

  // Billing state - these hooks MUST be before any conditional return
  const [billingMode, setBillingMode] = useState<"normal" | "split">("normal");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [tipPercent, setTipPercent] = useState(0);
  const [guestName, setGuestName] = useState("");
  const [guestAddress, setGuestAddress] = useState("");

  // Billing calculations
  const getSubtotal = () => selectedTable ? getTableTotal(selectedTable) : 0;
  const getDiscount = () => {
    if (!discountValue) return 0;
    return discountType === "percent"
      ? getSubtotal() * (parseFloat(discountValue) / 100)
      : parseFloat(discountValue);
  };
  const getTaxAmount = () => (getSubtotal() - getDiscount()) * 0.1;
  const getTipAmount = () => (getSubtotal() - getDiscount()) * (tipPercent / 100);
  const getBillingTotal = () => getSubtotal() - getDiscount() + getTaxAmount() + getTipAmount();

  // Reset billing state when closing
  const resetBillingState = () => {
    setBillingMode("normal");
    setDiscountValue("");
    setTipPercent(0);
    setGuestName("");
    setGuestAddress("");
  };

  // Cancel billing - return to occupied status without clearing table
  const handleCancelBilling = async () => {
    if (!selectedTable) return;

    try {
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: { status: "occupied" },
      });

      setSelectedTable({ ...selectedTable, status: "occupied" });
      setActiveTab("order");
      resetBillingState();
      toast.success("Billing cancelled - table returned to order");
    } catch (error) {
      console.error("Error cancelling billing:", error);
      toast.error("Failed to cancel billing");
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading tables...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        {/* Action bar only - no duplicate tab triggers (parent POS page has the main tabs) */}

        {/* Tables Tab */}
        <TabsContent value="tables" className="flex-1 mt-0">
          {/* Table Action Bar - enabled based on checkbox selection */}
          <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-lg mb-4 items-center">
            {/* Selection count */}
            {selectedTableIds.length > 0 && (
              <Badge variant="outline" className="gap-1 mr-2">
                {selectedTableIds.length} selected
                <button
                  onClick={clearTableSelection}
                  className="ml-1 hover:bg-secondary rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {/* Transfer - enabled when tables selected and available tables exist */}
            <Button
              variant="outline"
              size="sm"
              className={`gap-2 transition-all ${
                selectedTableIds.length > 0 && availableTables.length > 0
                  ? "border-primary/50 text-primary hover:bg-primary/10"
                  : "opacity-50"
              }`}
              onClick={() => {
                if (selectedTableIds.length === 1) {
                  const table = tables.find(t => t.id === selectedTableIds[0]);
                  if (table) {
                    setSelectedTable(table);
                    setTransferDialogOpen(true);
                  }
                }
              }}
              disabled={selectedTableIds.length !== 1 || availableTables.length === 0}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transfer
            </Button>

            {/* Merge - enabled when multiple tables selected */}
            <Button
              variant="outline"
              size="sm"
              className={`gap-2 transition-all ${
                selectedTableIds.length >= 2
                  ? "border-primary/50 text-primary hover:bg-primary/10"
                  : "opacity-50"
              }`}
              onClick={() => {
                if (selectedTableIds.length >= 2) {
                  const firstTable = tables.find(t => t.id === selectedTableIds[0]);
                  if (firstTable) {
                    setSelectedTable(firstTable);
                    // Merge all selected tables
                    selectedTableIds.slice(1).forEach((id) => {
                      handleMergeTables(id);
                    });
                  }
                }
              }}
              disabled={selectedTableIds.length < 2}
            >
              <GitMerge className="h-4 w-4" />
              Merge
            </Button>

            {/* Split - enabled when single table selected with items */}
            <Button
              variant="outline"
              size="sm"
              className={`gap-2 transition-all ${
                selectedTableIds.length === 1 &&
                tables.find(t => t.id === selectedTableIds[0])?.orders?.length >= 2
                  ? "border-primary/50 text-primary hover:bg-primary/10"
                  : "opacity-50"
              }`}
              onClick={() => {
                if (selectedTableIds.length === 1) {
                  const table = tables.find(t => t.id === selectedTableIds[0]);
                  if (table) {
                    setSelectedTable(table);
                    handleSplitTable();
                  }
                }
              }}
              disabled={
                selectedTableIds.length !== 1 ||
                (tables.find(t => t.id === selectedTableIds[0])?.orders?.length ?? 0) < 2
              }
            >
              <Split className="h-4 w-4" />
              Split
            </Button>

            {/* Hold/Resume - enabled when single table selected */}
            {selectedTableIds.length === 1 &&
            tables.find(t => t.id === selectedTableIds[0])?.status === "held" ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 transition-all border-success/50 text-success hover:bg-success/10"
                onClick={() => {
                  const table = tables.find(t => t.id === selectedTableIds[0]);
                  if (table) {
                    setSelectedTable(table);
                    handleResumeTable();
                  }
                }}
              >
                <Play className="h-4 w-4" />
                Resume
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className={`gap-2 transition-all ${
                  selectedTableIds.length === 1
                    ? "border-amber-400/50 text-amber-400 hover:bg-amber-400/10"
                    : "opacity-50"
                }`}
                onClick={() => {
                  if (selectedTableIds.length === 1) {
                    const table = tables.find(t => t.id === selectedTableIds[0]);
                    if (table) {
                      setSelectedTable(table);
                      handleHoldTable();
                    }
                  }
                }}
                disabled={selectedTableIds.length !== 1}
              >
                <Pause className="h-4 w-4" />
                Hold
              </Button>
            )}

            {/* Realtime status */}
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              {realtimeStatus === "connected" ? (
                <Wifi className="h-4 w-4 text-success" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              {realtimeStatus === "connected" ? "Synced" : "Offline"}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => {
              const isChecked = selectedTableIds.includes(table.id);
              const isOccupied = table.status !== "available";

              return (
                <Card
                  key={table.id}
                  className={`cursor-pointer transition-all hover:shadow-lg relative ${
                    selectedTable?.id === table.id ? "ring-2 ring-primary" : ""
                  } ${isChecked ? "ring-2 ring-primary bg-primary/5" : ""}`}
                  onClick={() => handleSelectTable(table)}
                >
                  {/* Checkbox for selection - only show for occupied tables */}
                  {isOccupied && (
                    <div
                      className="absolute top-2 left-2 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleTableSelection(table.id)}
                        className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        aria-label={`Select table ${table.number}`}
                      />
                    </div>
                  )}

                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-2xl font-bold ${isOccupied ? "ml-6" : ""}`}>T{table.number}</span>
                      <Badge variant="outline" className={statusColors[table.status]}>
                        {table.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{table.guests || 0}/{table.capacity}</span>
                    </div>
                    {table.startTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        <span>{getElapsedTime(table.startTime)}</span>
                      </div>
                    )}
                    {table.orders.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <span className="text-sm font-medium text-primary">
                          ${getTableTotal(table).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Open Table Dialog */}
          {selectedTable?.status === "available" && (
            <Card className="mt-4 p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-semibold">Open Table {selectedTable.number}</h3>
                  <p className="text-sm text-muted-foreground">Capacity: {selectedTable.capacity} guests</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Guests:</span>
                    <Input
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="w-16"
                      min={1}
                      max={selectedTable.capacity}
                    />
                  </div>
                  <Button variant="default" onClick={handleOpenTable} disabled={updateTable.isPending}>
                    {updateTable.isPending ? "Opening..." : "Open Table"}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Order Tab */}
        <TabsContent value="order" className="flex-1 mt-0">
          {selectedTable && (
            <div className="space-y-4">
              {/* Table Actions Bar */}
              {selectedTable.status !== "available" && (
                <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-lg">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setTransferDialogOpen(true)} disabled={availableTables.length === 0}>
                    <ArrowRightLeft className="h-4 w-4" />
                    Transfer
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setMergeDialogOpen(true)} disabled={availableTables.length === 0}>
                    <GitMerge className="h-4 w-4" />
                    Merge
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleSplitTable} disabled={selectedTable.orders.length < 2 || availableTables.length === 0}>
                    <Split className="h-4 w-4" />
                    Split
                  </Button>
                  {selectedTable.status === "held" ? (
                    <Button variant="outline" size="sm" className="gap-2 text-success" onClick={handleResumeTable}>
                      <Play className="h-4 w-4" />
                      Resume
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-2 text-amber-400" onClick={handleHoldTable}>
                      <Pause className="h-4 w-4" />
                      Hold
                    </Button>
                  )}
                  <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                    {realtimeStatus === "connected" ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-destructive" />}
                    {realtimeStatus === "connected" ? "Synced" : "Offline"}
                  </div>
                </div>
              )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              {/* Menu */}
              <div className="lg:col-span-2 space-y-4">
                {/* Quick Menu / Full Menu Toggle */}
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant={menuTab === "quick" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setMenuTab("quick")}
                    className="gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Quick Menu
                  </Button>
                  <Button
                    variant={menuTab === "full" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setMenuTab("full")}
                    className="gap-2"
                  >
                    <Utensils className="h-4 w-4" />
                    Full Menu
                  </Button>
                </div>

                {menuTab === "quick" ? (
                  /* Quick Menu - Frequently ordered items */
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="h-5 w-5 text-amber-400" />
                      <h3 className="font-semibold">Frequently Ordered</h3>
                      <Badge variant="outline" className="text-xs">
                        {quickMenuItems.length} items
                      </Badge>
                    </div>
                    {quickMenuItems.length === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-muted-foreground">No quick menu items configured.</p>
                        <p className="text-sm text-muted-foreground mt-1">Configure in Settings → POS Quick Menu</p>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {quickMenuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Card
                              key={item.id}
                              className="cursor-pointer hover:border-primary/50 transition-colors border-amber-500/30"
                              onClick={() => handleAddItem(item)}
                            >
                              <CardContent className="p-3 text-center">
                                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                                  <Icon className="h-5 w-5 text-amber-400" />
                                </div>
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-primary font-semibold text-sm">${item.price.toFixed(2)}</p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Full Menu with search and categories */
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search menu..."
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
                        {categories.map((cat) => (
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Card
                            key={item.id}
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => handleAddItem(item)}
                          >
                            <CardContent className="p-3 text-center">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-primary font-semibold text-sm">${item.price.toFixed(2)}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Current Order */}
              <Card className="h-fit">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Table {selectedTable.number}
                    </h3>
                    <Badge variant="outline">{selectedTable.orders.length} items</Badge>
                  </div>

                  {selectedTable.orders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No items yet</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {selectedTable.orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{order.name}</p>
                              <Badge variant="outline" className={`text-xs ${orderStatusColors[order.status]}`}>
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              ${order.price.toFixed(2)} × {order.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleUpdateQuantity(order.id, -1)}
                              disabled={order.status !== "pending"}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">{order.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleUpdateQuantity(order.id, 1)}
                              disabled={order.status !== "pending"}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRemoveItem(order.id)}
                              disabled={order.status !== "pending"}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-border pt-4 mt-4 space-y-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-primary">${getTableTotal(selectedTable).toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Left Button: Cancel/Close Table */}
                      <Button
                        variant="outline"
                        className="gap-2 border-destructive/20 hover:bg-destructive/10 text-destructive"
                        onClick={handleCloseTable}
                        disabled={updateTable.isPending}
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>

                      {/* Right Button: Dynamic Order/Bill Button */}
                      {(() => {
                        const hasPending = selectedTable.orders.some(o => o.status === "pending");
                        const hasPlaced = selectedTable.orders.some(o => o.status !== "pending" && o.status !== "cancelled");

                        if (selectedTable.orders.length === 0) {
                          return (
                            <Button
                              variant="blue"
                              className="gap-2 opacity-50 cursor-not-allowed"
                              disabled
                            >
                              <Check className="h-4 w-4" />
                              Place Order
                            </Button>
                          );
                        }

                        if (hasPending && !hasPlaced) {
                          return (
                            <Button
                              variant="blue"
                              className="gap-2 shadow-lg shadow-blue-500/20"
                              onClick={handleSendToKitchen}
                              disabled={updateTable.isPending}
                            >
                              <Check className="h-4 w-4" />
                              Place Order
                            </Button>
                          );
                        }

                        if (hasPending && hasPlaced) {
                          return (
                            <Button
                              variant="blue"
                              className="gap-2 shadow-lg shadow-blue-500/20"
                              onClick={handleSendToKitchen}
                              disabled={updateTable.isPending}
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                              Update Order
                            </Button>
                          );
                        }

                        return (
                          <Button
                            variant="blue"
                            className="gap-2 shadow-lg shadow-blue-500/20"
                            onClick={handleProceedToBilling}
                            disabled={updateTable.isPending}
                          >
                            <Receipt className="h-4 w-4" />
                            Proceed to Bill
                          </Button>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          )}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="flex-1 mt-0">
          {selectedTable && selectedTable.status === "billing" && (
            billingMode === "split" ? (
              <SplitBillPanel
                items={selectedTable.orders}
                subtotal={getSubtotal()}
                tax={getTaxAmount()}
                total={getBillingTotal()}
                onComplete={async (payments) => {
                  toast.success(`Split payment completed: ${payments.length} payments processed`);
                  await handleCheckout();
                }}
                onCancel={() => setBillingMode("normal")}
              />
            ) : (
              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-6 space-y-6">
                  {/* Header */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">Table {selectedTable.number}</h2>
                    <p className="text-muted-foreground">Bill Summary</p>
                    {selectedTable.guests && (
                      <Badge variant="outline" className="mt-2">
                        <Users className="h-3 w-3 mr-1" />
                        {selectedTable.guests} guests
                      </Badge>
                    )}
                  </div>

                  {/* Guest Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-lg">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Guest Name</Label>
                      <Input
                        placeholder="Customer name (optional)"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Address</Label>
                      <Input
                        placeholder="Address (optional)"
                        value={guestAddress}
                        onChange={(e) => setGuestAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Order Items</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {selectedTable.orders.map((order) => (
                        <div key={order.id} className="flex justify-between text-sm p-2 bg-secondary/50 rounded">
                          <span>
                            {order.name} × {order.quantity}
                          </span>
                          <span className="font-mono">${(order.price * order.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="space-y-2">
                    <Label className="text-sm">Discount</Label>
                    <div className="flex gap-2">
                      <Select value={discountType} onValueChange={(v: "percent" | "fixed") => setDiscountType(v)}>
                        <SelectTrigger className="w-20">
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

                  {/* Tip */}
                  <div className="space-y-2">
                    <Label className="text-sm">Tip</Label>
                    <div className="flex gap-2">
                      {[0, 10, 15, 20].map((pct) => (
                        <Button
                          key={pct}
                          type="button"
                          variant={tipPercent === pct ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setTipPercent(pct)}
                        >
                          {pct}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    {getDiscount() > 0 && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Discount</span>
                        <span>-${getDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span>${getTaxAmount().toFixed(2)}</span>
                    </div>
                    {getTipAmount() > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tip ({tipPercent}%)</span>
                        <span>${getTipAmount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold border-t border-border pt-2">
                      <span>Total</span>
                      <span className="text-primary">${getBillingTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        onClick={handleCancelBilling} 
                        disabled={updateTable.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={handleCheckout} 
                        disabled={createTransaction.isPending || updateTable.isPending}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        {createTransaction.isPending ? "Processing..." : "Checkout"}
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => setBillingMode("split")}
                    >
                      <Split className="h-4 w-4" />
                      Split Bill
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>
      </Tabs>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Order
            </DialogTitle>
            <DialogDescription>
              Transfer order from Table {selectedTable?.number} to another table
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select destination table</Label>
              <Select value={targetTableId} onValueChange={setTargetTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select available table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.number} (Capacity: {table.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleTransferTable(targetTableId);
                  setTransferDialogOpen(false);
                  setTargetTableId("");
                }}
                disabled={!targetTableId}
              >
                Transfer Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Merge Tables
            </DialogTitle>
            <DialogDescription>
              Merge Table {selectedTable?.number} with another table
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select table to merge with</Label>
              <Select value={targetTableId} onValueChange={setTargetTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select available table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.number} (Capacity: {table.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleMergeTables(targetTableId);
                  setMergeDialogOpen(false);
                  setTargetTableId("");
                }}
                disabled={!targetTableId}
              >
                Merge Tables
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}