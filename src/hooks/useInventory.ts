import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { generateSecureNumericString } from "@/utils/security";

// ============= Types =============
export interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  payment_terms: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category_id: string | null;
  supplier_id: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number | null;
  reorder_point: number;
  cost_price: number;
  selling_price: number | null;
  location: string | null;
  department: string | null;
  is_active: boolean;
  last_restocked_at: string | null;
  created_at: string;
  category?: InventoryCategory;
  supplier?: Supplier;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string | null;
  status: string;
  order_date: string;
  expected_delivery: string | null;
  received_date: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  received_quantity: number;
  item?: InventoryItem;
}

export interface StockMovement {
  id: string;
  item_id: string;
  movement_type: string;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  from_location: string | null;
  to_location: string | null;
  notes: string | null;
  created_at: string;
  item?: InventoryItem;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ============= Categories =============
export function useInventoryCategories() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: async () => {
      const { data, error } = await db
        .from("inventory_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as InventoryCategory[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (category: Omit<InventoryCategory, "id" | "created_at">) => {
      const { data, error } = await db.from("inventory_categories").insert(category).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-categories"] }),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryCategory> & { id: string }) => {
      const { data, error } = await db.from("inventory_categories").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-categories"] }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("inventory_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-categories"] }),
  });

  return { ...query, createCategory, updateCategory, deleteCategory };
}

// ============= Suppliers =============
export function useSuppliers(filters?: { showInactive?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["suppliers", filters],
    queryFn: async () => {
      let q = db
        .from("suppliers")
        .select("*")
        .order("name");

      if (!filters?.showInactive) {
        q = q.eq("is_active", true);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Supplier[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("suppliers-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "suppliers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createSupplier = useMutation({
    mutationFn: async (supplier: Omit<Supplier, "id" | "created_at">) => {
      const { data, error } = await db.from("suppliers").insert(supplier).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await db.from("suppliers").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  return { ...query, createSupplier, updateSupplier, deleteSupplier };
}

// ============= Inventory Items =============
export function useInventoryItems(filters?: { category?: string; lowStock?: boolean; showInactive?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-items", filters],
    queryFn: async () => {
      let q = db
        .from("inventory_items")
        .select(`*, category:inventory_categories(*), supplier:suppliers(*)`)
        .order("name");

      if (!filters?.showInactive) {
        q = q.eq("is_active", true);
      }

      if (filters?.category) {
        q = q.eq("category_id", filters.category);
      }

      const { data, error } = await q;
      if (error) throw error;

      let items = data as InventoryItem[];
      if (filters?.lowStock) {
        items = items.filter((i) => i.current_stock <= i.reorder_point);
      }
      return items;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("inventory-items-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, () => {
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createItem = useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id" | "created_at" | "category" | "supplier">) => {
      const { data, error } = await db.from("inventory_items").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await db.from("inventory_items").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("inventory_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
  });

  const adjustStock = useMutation({
    mutationFn: async ({ itemId, quantity, type, notes }: { itemId: string; quantity: number; type: "in" | "out" | "adjustment"; notes?: string }) => {
      // Get current stock
      const { data: item, error: fetchError } = await db.from("inventory_items").select("current_stock").eq("id", itemId).single();
      if (fetchError) throw fetchError;

      const newStock = type === "out" ? item.current_stock - quantity : item.current_stock + quantity;

      // Update stock
      const { error: updateError } = await db.from("inventory_items").update({ current_stock: newStock, last_restocked_at: type === "in" ? new Date().toISOString() : undefined }).eq("id", itemId);
      if (updateError) throw updateError;

      // Record movement
      const { error: movementError } = await db.from("stock_movements").insert({
        item_id: itemId,
        movement_type: type,
        quantity,
        notes,
      });
      if (movementError) throw movementError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  const bulkAdjustStock = useMutation({
    mutationFn: async (adjustments: { itemId: string; quantity: number; type: "in" | "out" | "adjustment"; notes?: string }[]) => {
      for (const adj of adjustments) {
        // Get current stock
        const { data: item, error: fetchError } = await db.from("inventory_items").select("current_stock").eq("id", adj.itemId).single();
        if (fetchError) throw fetchError;

        const newStock = adj.type === "out" ? item.current_stock - adj.quantity :
                        adj.type === "in" ? item.current_stock + adj.quantity : adj.quantity;

        // Update stock
        await db.from("inventory_items").update({
          current_stock: newStock,
          last_restocked_at: adj.type === "in" ? new Date().toISOString() : undefined
        }).eq("id", adj.itemId);

        // Record movement
        await db.from("stock_movements").insert({
          item_id: adj.itemId,
          movement_type: adj.type,
          quantity: adj.quantity,
          notes: adj.notes,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  return { ...query, createItem, updateItem, deleteItem, adjustStock, bulkAdjustStock };
}

// ============= Purchase Orders =============
export function usePurchaseOrders(status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["purchase-orders", status],
    queryFn: async () => {
      let q = db
        .from("purchase_orders")
        .select(`*, supplier:suppliers(*), items:purchase_order_items(*, item:inventory_items(*))`)
        .order("created_at", { ascending: false });

      if (status) q = q.eq("status", status);

      const { data, error } = await q;
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("purchase-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createPurchaseOrder = useMutation({
    mutationFn: async ({ items, ...order }: Omit<PurchaseOrder, "id" | "created_at" | "order_number" | "supplier"> & { items: { item_id: string; quantity: number; unit_price: number }[] }) => {
      const orderNumber = `PO-${generateSecureNumericString(10)}`;
      const { data: po, error: poError } = await db.from("purchase_orders").insert({ ...order, order_number: orderNumber }).select().single();
      if (poError) throw poError;

      const poItems = items.map((i) => ({ ...i, purchase_order_id: po.id }));
      const { error: itemsError } = await db.from("purchase_order_items").insert(poItems);
      if (itemsError) throw itemsError;

      return po;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });

  const updatePurchaseOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // 1. Get current status to prevent double-receiving
      const { data: currentOrder, error: fetchError } = await db
        .from("purchase_orders")
        .select("status, order_number")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      if (currentOrder.status === "received" && status === "received") {
        throw new Error("Order already received");
      }

      const updates: Record<string, unknown> = { status };
      if (status === "received") {
        updates.received_date = new Date().toISOString().split("T")[0];
      }

      // 2. Update order status
      const { data, error } = await db.from("purchase_orders").update(updates).eq("id", id).select().single();
      if (error) throw error;

      // 3. If received, update stock
      if (status === "received") {
        const { data: items, error: itemsError } = await db
          .from("purchase_order_items")
          .select("item_id, quantity")
          .eq("purchase_order_id", id);

        if (itemsError) throw itemsError;

        for (const poItem of items) {
          // Get current stock
          const { data: invItem, error: invError } = await db
            .from("inventory_items")
            .select("current_stock")
            .eq("id", poItem.item_id)
            .single();

          if (invError) throw invError;

          // Update stock
          const newStock = (invItem?.current_stock || 0) + poItem.quantity;
          await db.from("inventory_items")
            .update({
              current_stock: newStock,
              last_restocked_at: new Date().toISOString()
            })
            .eq("id", poItem.item_id);

          // Record movement
          await db.from("stock_movements").insert({
            item_id: poItem.item_id,
            movement_type: "in",
            quantity: poItem.quantity,
            reference_type: "purchase_order",
            reference_id: id,
            notes: `Received from Purchase Order ${currentOrder.order_number}`,
          });
        }
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  const deletePurchaseOrder = useMutation({
    mutationFn: async (id: string) => {
      // Delete items first
      await db.from("purchase_order_items").delete().eq("purchase_order_id", id);
      const { error } = await db.from("purchase_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });

  return { ...query, createPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder };
}

// ============= Stock Movements =============
export function useStockMovements(filters?: { itemId?: string; type?: string }) {
  return useQuery({
    queryKey: ["stock-movements", filters],
    queryFn: async () => {
      let q = db
        .from("stock_movements")
        .select(`*, item:inventory_items(name, sku)`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.itemId) q = q.eq("item_id", filters.itemId);
      if (filters?.type && filters.type !== "all") q = q.eq("movement_type", filters.type);

      const { data, error } = await q;
      if (error) throw error;
      return data as StockMovement[];
    },
  });
}

// ============= Stats & Reports =============
export function useInventoryStats() {
  const { data: items } = useInventoryItems({ showInactive: false });

  const stats = {
    totalItems: items?.length || 0,
    lowStock: items?.filter((i) => i.current_stock <= i.reorder_point).length || 0,
    outOfStock: items?.filter((i) => i.current_stock === 0).length || 0,
    totalValue: items?.reduce((sum, i) => sum + i.current_stock * i.cost_price, 0) || 0,
    categoryDistribution: items?.reduce((acc: Record<string, number>, item) => {
      const catName = item.category?.name || "Uncategorized";
      acc[catName] = (acc[catName] || 0) + (item.current_stock * item.cost_price);
      return acc;
    }, {}),
  };

  return stats;
}

export function useInventoryReportData() {
  const { data: items } = useInventoryItems({ showInactive: false });

  return useQuery({
    queryKey: ["inventory-report-data", items?.length],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: movements, error } = await db
        .from("stock_movements")
        .select(`*, item:inventory_items(name, cost_price)`)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at");

      if (error) throw error;

      // Calculate current total value
      const currentTotalValue = items?.reduce((sum, i) => sum + i.current_stock * i.cost_price, 0) || 0;

      // Create a map of daily movements
      const dailyMap = new Map();
      movements?.forEach((m: any) => {
        const date = m.created_at.split("T")[0];
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { in: 0, out: 0, valueChange: 0 });
        }
        const day = dailyMap.get(date);
        const value = m.quantity * (m.item?.cost_price || 0);
        if (m.movement_type === "in") day.in += m.quantity;
        if (m.movement_type === "out") day.out += m.quantity;
        day.valueChange += (m.movement_type === "in" ? value : -value);
      });

      // Generate last 30 days
      const result = [];
      const totalChangeInLast30Days = movements?.reduce((sum, m: any) => {
        const value = m.quantity * (m.item?.cost_price || 0);
        return sum + (m.movement_type === "in" ? value : -value);
      }, 0) || 0;

      let rollingValue = currentTotalValue - totalChangeInLast30Days;

      for (let i = 30; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayMovements = dailyMap.get(dateStr) || { in: 0, out: 0, valueChange: 0 };

        rollingValue += dayMovements.valueChange;

        // Ensure format is imported or use a simple slice
        const label = dateStr.split("-").slice(1).join("/"); // MM/DD

        result.push({
          date: label,
          fullDate: dateStr,
          in: dayMovements.in,
          out: dayMovements.out,
          value: rollingValue
        });
      }

      return result;
    },
    enabled: items !== undefined
  });
}
