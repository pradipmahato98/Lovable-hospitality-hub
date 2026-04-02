import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface WaitlistEntry {
  id: string;
  guest_name: string;
  phone: string | null;
  party_size: number;
  is_resident: boolean;
  room_number: string | null;
  status: "waiting" | "notified" | "seated" | "cancelled";
  created_at: string;
}

// Module-level state for demo persistence
let demoOrders: any[] = [];

export function usePOSTerminal() {
  const queryClient = useQueryClient();

  // --- Menu & Inventory ---
  const { data: menuItems = [], isLoading: isLoadingMenu } = useQuery({
    queryKey: ["pos-menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_menu_items")
        .select(`
          *,
          inventory:inventory_item_id (current_stock)
        `);

      // Fallback for demo
      if (!data || data.length === 0) {
        return [
          { id: "m1", item_name: "Ribeye Steak", item_price: 45.00, category: "Mains", current_stock: 12 },
          { id: "m2", item_name: "Salmon", item_price: 32.00, category: "Mains", current_stock: 8 },
          { id: "m3", item_name: "House Salad", item_price: 14.00, category: "Mains", current_stock: 0 },
          { id: "m4", item_name: "Red Wine", item_price: 12.00, category: "Drinks", current_stock: 24 },
          { id: "m5", item_name: "Chardonnay", item_price: 10.00, category: "Drinks", current_stock: 18 }
        ];
      }

      if (error) throw error;
      return data.map(item => ({
        ...item,
        current_stock: (item.inventory as any)?.current_stock ?? 999
      }));
    },
  });

  // --- Tables & Realtime ---
  const { data: tables = [], isLoading: isLoadingTables } = useQuery({
    queryKey: ["pos-tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_tables")
        .select("*")
        .order("table_number", { ascending: true });

      let tableList = data || [];

      // Fallback for demo/dev if table is empty
      if (tableList.length === 0) {
        tableList = Array.from({ length: 12 }, (_, i) => ({
          id: `demo-t-${i+1}`,
          table_number: `${i+1}`,
          capacity: i % 2 === 0 ? 4 : 2,
          status: 'available',
          start_time: null,
          guests: null,
          server_name: null
        }));
      }

      // Merge with demo occupancy status
      return tableList.map(table => {
        const activeDemoOrder = demoOrders.find(o => o.table_id === table.id && o.status !== "paid" && o.status !== "cancelled");
        if (activeDemoOrder) {
          return {
            ...table,
            status: "occupied",
            guests: activeDemoOrder.guests,
            server_name: activeDemoOrder.server_name,
            start_time: activeDemoOrder.start_time,
          };
        }
        return table;
      });
    },
  });

  // --- Active Orders ---
  const { data: activeOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["pos-active-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_orders")
        .select(`
          *,
          pos_order_items (*),
          guest:guest_id (first_name, last_name, allergies, vip_tier),
          reservation:reservation_id (room_id, meal_plan, status, rooms (room_number))
        `)
        .in("status", ["open", "billing"]);

      const realOrders = data || [];
      // Combine real orders with active demo session orders (only open/billing)
      const activeDemoOrders = demoOrders.filter(o => o.status === "open" || o.status === "billing");

      // Ensure each order has an items array to prevent crashes
      const allOrders = [...realOrders, ...activeDemoOrders].map(order => ({
        ...order,
        pos_order_items: order.pos_order_items || []
      }));

      return allOrders;
    },
  });

  // --- Waitlist ---
  const { data: waitlist = [], isLoading: isLoadingWaitlist } = useQuery({
    queryKey: ["pos-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_waitlist")
        .select("*")
        .eq("status", "waiting")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as WaitlistEntry[];
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("pos-terminal-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "pos_tables" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pos-tables"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pos_orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pos-active-orders"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pos_order_items" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pos-active-orders"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pos_waitlist" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pos-waitlist"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // --- Mutations ---

  const openTable = useMutation({
    mutationFn: async (params: {
      tableId: string;
      guests: number;
      serverName: string;
      guestId?: string;
      reservationId?: string;
    }) => {
      // Demo mode bypass
      if (params.tableId.startsWith('demo-')) {
        const newOrder = {
          id: `demo-order-${Date.now()}`,
          table_id: params.tableId,
          table_number: params.tableId.split('-').pop(),
          status: "open",
          guests: params.guests,
          total_covers: params.guests,
          server_name: params.serverName,
          start_time: new Date().toISOString(),
          guest_id: params.guestId,
          reservation_id: params.reservationId,
          pos_order_items: []
        };
        demoOrders.push(newOrder);
        return newOrder;
      }

      // 1. Update Table Status
      const { error: tableError } = await supabase
        .from("pos_tables")
        .update({
          status: "occupied",
          guests: params.guests,
          server_name: params.serverName,
          start_time: new Date().toISOString(),
        })
        .eq("id", params.tableId);
      if (tableError) throw tableError;

      // 2. Create Order
      const { data: tableData } = await supabase.from("pos_tables").select("table_number").eq("id", params.tableId).single();

      const { data: order, error: orderError } = await supabase
        .from("pos_orders")
        .insert({
          table_id: params.tableId,
          table_number: tableData?.table_number || "0",
          status: "open",
          guests: params.guests,
          total_covers: params.guests,
          server_name: params.serverName,
          guest_id: params.guestId,
          reservation_id: params.reservationId,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();
      if (orderError) throw orderError;

      return order;
    },
    onSuccess: (newOrder) => {
      // Optimistically update active orders
      queryClient.setQueryData(["pos-active-orders"], (old: any[] = []) => [...old, newOrder]);

      queryClient.invalidateQueries({ queryKey: ["pos-tables"] });
      queryClient.invalidateQueries({ queryKey: ["pos-active-orders"] });
      toast.success("Table opened successfully");
    },
  });

  const addOrderItem = useMutation({
    mutationFn: async (params: {
      orderId: string;
      itemName: string;
      itemPrice: number;
      category: string;
      quantity: number;
      seatNumber: number;
      modifiers?: any[];
      notes?: string;
    }) => {
      if (params.orderId.startsWith('demo-')) {
        const order = demoOrders.find(o => o.id === params.orderId);
        if (order) {
          const newItem = {
            id: `demo-item-${Date.now()}`,
            order_id: params.orderId,
            item_name: params.itemName,
            item_price: params.itemPrice,
            category: params.category,
            quantity: params.quantity,
            seat_number: params.seatNumber,
            modifiers: params.modifiers || [],
            notes: params.notes,
            status: "pending",
            created_at: new Date().toISOString()
          };
          order.pos_order_items.push(newItem);
          return newItem;
        }
        throw new Error("Demo order not found");
      }

      const { data, error } = await supabase
        .from("pos_order_items")
        .insert({
          id: crypto.randomUUID(),
          order_id: params.orderId,
          item_name: params.itemName,
          item_price: params.itemPrice,
          category: params.category,
          quantity: params.quantity,
          seat_number: params.seatNumber,
          modifiers: params.modifiers || [],
          notes: params.notes,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData(["pos-active-orders"], (old: any[] = []) => {
        return old.map(order => {
          if (order.id === newItem.order_id) {
            return {
              ...order,
              pos_order_items: [...(order.pos_order_items || []), newItem]
            };
          }
          return order;
        });
      });
      queryClient.invalidateQueries({ queryKey: ["pos-active-orders"] });
    },
  });

  const fireOrder = useMutation({
    mutationFn: async (params: { orderId: string; itemIds?: string[]; fireAt?: string; hold?: boolean }) => {
      if (params.orderId.startsWith('demo-')) {
        const order = demoOrders.find(o => o.id === params.orderId);
        if (order) {
          order.pos_order_items.forEach((item: any) => {
            if ((!params.itemIds || params.itemIds.includes(item.id)) && item.status === "pending") {
              item.status = params.hold ? "pending" : (params.fireAt ? "pending" : "preparing");
              item.fire_at = params.fireAt || null;
              item.hold_flag = params.hold || false;
            }
          });
        }
        return;
      }

      const query = supabase.from("pos_order_items").update({
        status: params.hold ? "pending" : (params.fireAt ? "pending" : "preparing"),
        fire_at: params.fireAt || null,
        hold_flag: params.hold || false,
      }).eq("order_id", params.orderId);

      if (params.itemIds && params.itemIds.length > 0) {
        query.in("id", params.itemIds);
      } else {
        query.eq("status", "pending");
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-active-orders"] });
      toast.success("Order status updated");
    },
  });

  const settleBill = useMutation({
    mutationFn: async (params: {
      orderId: string;
      tableId: string;
      paymentMethod: string;
      subtotal: number;
      tax: number;
      serviceCharge: number;
      amountPaid: number;
      isFinalPayment: boolean;
      signatureUrl?: string;
      roomNumber?: string;
    }) => {
      const txnNum = `TXN-${Date.now()}`;

      if (params.orderId.startsWith('demo-')) {
        const orderIndex = demoOrders.findIndex(o => o.id === params.orderId);
        if (orderIndex !== -1) {
          const order = demoOrders[orderIndex];
          order.total_paid = (order.total_paid || 0) + params.amountPaid;

          if (params.isFinalPayment) {
            order.status = "paid";
            // We keep it in demoOrders for a bit but it won't show as active
          } else {
            order.status = "billing";
          }
        }
        return { transactionNumber: txnNum };
      }

      // 1. Create Transaction
      const { data: order } = await supabase.from("pos_orders").select("*").eq("id", params.orderId).single();
      const { data: items } = await supabase.from("pos_order_items").select("*").eq("order_id", params.orderId);

      const { error: txnError } = await supabase.from("pos_transactions").insert({
        transaction_number: txnNum,
        table_number: order?.table_number || "0",
        subtotal: params.subtotal,
        tax_amount: params.tax,
        tip_amount: params.serviceCharge,
        total: params.amountPaid,
        payment_method: params.paymentMethod,
        room_number: params.roomNumber,
        signature_url: params.signatureUrl,
        items_count: items?.length || 0,
        items: items || [],
      });
      if (txnError) throw txnError;

      // 2. Update Order Balances
      if (params.isFinalPayment) {
        await supabase.from("pos_orders").update({ status: "paid", total_paid: (order?.total_paid || 0) + params.amountPaid }).eq("id", params.orderId);

        // 3. Reset Table
        await supabase.from("pos_tables").update({
          status: "available",
          guests: null,
          server_name: null,
          start_time: null,
        }).eq("id", params.tableId);
      } else {
        await supabase.from("pos_orders")
          .update({
            total_paid: (order?.total_paid || 0) + params.amountPaid,
            status: "billing" // Keep open but mark as in-progress
          })
          .eq("id", params.orderId);
      }

      return { transactionNumber: txnNum };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-tables"] });
      queryClient.invalidateQueries({ queryKey: ["pos-active-orders"] });
      toast.success("Bill settled successfully");
    },
  });

  const addToWaitlist = useMutation({
    mutationFn: async (entry: Omit<WaitlistEntry, "id" | "created_at">) => {
      const { data, error } = await supabase.from("pos_waitlist").insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-waitlist"] });
      toast.success("Added to waitlist");
    },
  });

  const voidItem = useMutation({
    mutationFn: async (params: { itemId: string; reason: string }) => {
      if (params.itemId.startsWith('demo-')) {
        demoOrders.forEach(order => {
          const item = order.pos_order_items.find((i: any) => i.id === params.itemId);
          if (item) {
            item.status = "cancelled";
            item.void_reason = params.reason;
            item.voided_at = new Date().toISOString();
          }
        });
        return;
      }

      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("pos_order_items")
        .update({
          status: "cancelled",
          void_reason: params.reason,
          voided_at: new Date().toISOString(),
          voided_by: userRes.user?.id
        })
        .eq("id", params.itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-active-orders"] });
      toast.success("Item voided and logged");
    },
  });

  const transferTable = useMutation({
    mutationFn: async (params: { fromTableId: string; toTableId: string; orderId: string }) => {
       // 1. Move Order
       const { data: toTable } = await supabase.from("pos_tables").select("table_number").eq("id", params.toTableId).single();
       await supabase.from("pos_orders").update({
         table_id: params.toTableId,
         table_number: toTable?.table_number || "0"
       }).eq("id", params.orderId);

       // 2. Update Table Statuses
       const { data: fromTable } = await supabase.from("pos_tables").select("*").eq("id", params.fromTableId).single();
       await supabase.from("pos_tables").update({
          status: "occupied",
          guests: fromTable?.guests,
          server_name: fromTable?.server_name,
          start_time: fromTable?.start_time,
       }).eq("id", params.toTableId);

       await supabase.from("pos_tables").update({
          status: "available",
          guests: null,
          server_name: null,
          start_time: null,
       }).eq("id", params.fromTableId);
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["pos-tables"] });
       queryClient.invalidateQueries({ queryKey: ["pos-active-orders"] });
       toast.success("Table transferred successfully");
    }
  });

  const mergeTables = useMutation({
    mutationFn: async (params: { sourceOrderId: string; targetOrderId: string; sourceTableId: string }) => {
       // 1. Move Items
       await supabase.from("pos_order_items").update({ order_id: params.targetOrderId }).eq("order_id", params.sourceOrderId);

       // 2. Close source order
       await supabase.from("pos_orders").update({ status: "cancelled" }).eq("id", params.sourceOrderId);

       // 3. Reset source table
       await supabase.from("pos_tables").update({ status: "available", guests: null, server_name: null, start_time: null }).eq("id", params.sourceTableId);
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["pos-tables"] });
       queryClient.invalidateQueries({ queryKey: ["pos-active-orders"] });
       toast.success("Tables merged successfully");
    }
  });

  // --- Logic Helpers ---

  const toggleTaxExempt = useMutation({
    mutationFn: async (params: { orderId: string; isTaxExempt: boolean }) => {
      if (params.orderId.startsWith('demo-')) {
        const order = demoOrders.find(o => o.id === params.orderId);
        if (order) {
          order.is_tax_exempt = params.isTaxExempt;
        }
        return;
      }

      const { error } = await supabase
        .from("pos_orders")
        .update({ is_tax_exempt: params.isTaxExempt })
        .eq("id", params.orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-active-orders"] });
      toast.success("Tax status updated");
    },
  });

  const sendWaitlistSMS = useMutation({
    mutationFn: async (params: { waitlistId: string; phone: string; message: string }) => {
      // Logic for actual SMS would call an edge function here
      const { error } = await supabase.from("pos_sms_logs").insert({
        waitlist_id: params.waitlistId,
        phone: params.phone,
        message: params.message,
      });
      if (error) throw error;

      await supabase
        .from("pos_waitlist")
        .update({ status: "notified", notified_at: new Date().toISOString() })
        .eq("id", params.waitlistId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-waitlist"] });
      toast.success("SMS notification sent");
    },
  });

  // --- Logic Helpers ---

  const calculateGratuity = (order: any) => {
    const covers = order.total_covers || 1;
    // Auto-gratuity for large parties (>= 6)
    if (covers >= 6) return 0.18; // 18%
    return 0.05; // Default 5%
  };

  const getKitchenLoad = () => {
    const preparingCount = activeOrders.reduce((acc, order) => {
      return acc + (order.pos_order_items?.filter((i: any) => i.status === "preparing").length || 0);
    }, 0);

    if (preparingCount > 20) return "red";
    if (preparingCount > 10) return "yellow";
    return "green";
  };

  const getWinePairing = (itemName: string) => {
    const pairings: Record<string, string> = {
      "Ribeye Steak": "Cabernet Sauvignon",
      "Salmon": "Chardonnay",
      "Pasta": "Chianti",
      "House Salad": "Sauvignon Blanc",
    };
    return pairings[itemName] || "Sommelier Selection";
  };

  return {
    tables,
    menuItems,
    activeOrders,
    waitlist,
    isLoading: isLoadingTables || isLoadingOrders || isLoadingWaitlist || isLoadingMenu,
    openTable,
    addOrderItem,
    fireOrder,
    settleBill,
    addToWaitlist,
    toggleTaxExempt,
    sendWaitlistSMS,
    getKitchenLoad,
    getWinePairing,
    calculateGratuity,
    voidItem,
    transferTable,
    mergeTables,
  };
}
