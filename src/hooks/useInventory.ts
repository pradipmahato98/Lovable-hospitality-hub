import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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
  return useQuery({
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
}

// ============= Suppliers =============
export function useSuppliers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await db
        .from("suppliers")
        .select("*")
        .order("name");
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

  return { ...query, createSupplier, updateSupplier };
}

// ============= Inventory Items =============
export function useInventoryItems(filters?: { category?: string; lowStock?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-items", filters],
    queryFn: async () => {
      let q = db
        .from("inventory_items")
        .select(`*, category:inventory_categories(*), supplier:suppliers(*)`)
        .eq("is_active", true)
        .order("name");

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

  return { ...query, createItem, updateItem, adjustStock };
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
      const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
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
      const updates: Record<string, unknown> = { status };
      if (status === "received") updates.received_date = new Date().toISOString().split("T")[0];

      const { data, error } = await db.from("purchase_orders").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });

  return { ...query, createPurchaseOrder, updatePurchaseOrderStatus };
}

// ============= Stock Movements =============
export function useStockMovements(itemId?: string) {
  return useQuery({
    queryKey: ["stock-movements", itemId],
    queryFn: async () => {
      let q = db
        .from("stock_movements")
        .select(`*, item:inventory_items(name, sku)`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (itemId) q = q.eq("item_id", itemId);

      const { data, error } = await q;
      if (error) throw error;
      return data as StockMovement[];
    },
  });
}

// ============= Stats =============
export function useInventoryStats() {
  const { data: items } = useInventoryItems();

  const stats = {
    totalItems: items?.length || 0,
    lowStock: items?.filter((i) => i.current_stock <= i.reorder_point).length || 0,
    outOfStock: items?.filter((i) => i.current_stock === 0).length || 0,
    totalValue: items?.reduce((sum, i) => sum + i.current_stock * i.cost_price, 0) || 0,
  };

  return stats;
}
