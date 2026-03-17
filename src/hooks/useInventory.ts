import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

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
  supplier_code: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  payment_terms: string | null;
  rating: number | null;
  is_approved: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface InventoryUoM {
  id: string;
  name: string;
  abbreviation: string | null;
  created_at: string;
}

export interface InventoryStore {
  id: string;
  code: string;
  name: string;
  location: string | null;
  store_manager_id: string | null;
  store_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category_id: string | null;
  supplier_id: string | null;
  uom_id: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number | null;
  reorder_point: number;
  cost_price: number;
  avg_cost: number;
  last_purchase_cost: number;
  selling_price: number | null;
  location: string | null;
  department: string | null;
  item_type: string;
  shelf_life: string | null;
  storage_instructions: string | null;
  tax_applicability: any[];
  image_url: string | null;
  is_active: boolean;
  last_restocked_at: string | null;
  created_at: string;
  category?: InventoryCategory;
  supplier?: Supplier;
  uom?: InventoryUoM;
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
  batch_number?: string;
  expiry_date?: string;
  damaged_quantity?: number;
  quality_status?: string;
  item?: InventoryItem;
}

export interface StockMovement {
  id: string;
  item_id: string;
  store_id: string | null;
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

export interface InventoryTransfer {
  id: string;
  transfer_number: string;
  item_id: string;
  quantity: number;
  from_location: string;
  to_location: string;
  transferred_by: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  item?: { name: string; sku: string | null; unit: string };
}

export interface InventoryWastage {
  id: string;
  item_id: string;
  quantity: number;
  wastage_type: string;
  reason: string | null;
  reported_by: string | null;
  approved_by: string | null;
  cost_impact: number;
  status: string;
  created_at: string;
  item?: { name: string; sku: string | null; unit: string; cost_price: number };
}

export interface InventoryRequisition {
  id: string;
  requisition_number: string;
  department: string;
  requested_by: string;
  required_date: string | null;
  priority: string;
  status: string;
  notes: string | null;
  created_at: string;
  items?: any[];
}

export interface InventoryRecipe {
  id: string;
  name: string;
  menu_item_id: string | null;
  description: string | null;
  portion_size: string | null;
  yield_percentage: number;
  is_active: boolean;
  created_at: string;
  items?: any[];
}

export interface InventoryStockIssue {
  id: string;
  requisition_id: string | null;
  issue_number: string;
  department: string;
  issued_to: string | null;
  issued_by: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  items?: any[];
}

// ============= Settings =============
export function useInventorySettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-settings"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_settings").select("*");
      if (error) throw error;
      const settingsMap: Record<string, string> = {};
      data.forEach((s: any) => settingsMap[s.setting_key] = s.setting_value);
      return settingsMap;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      for (const [key, value] of Object.entries(updates)) {
        await db.from("inventory_settings").upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-settings"] }),
  });

  return { ...query, updateSettings };
}

// ============= Categories =============
export function useInventoryCategories() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_categories").select("*").order("name");
      if (error) throw error;
      return data as InventoryCategory[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (cat: { name: string; description?: string; parent_id?: string }) => {
      const { data, error } = await db.from("inventory_categories").insert(cat).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-categories"] }),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; parent_id?: string | null }) => {
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
export function useSuppliers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await db.from("suppliers").select("*").order("name");
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
    mutationFn: async (supplier: Partial<Supplier>) => {
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

// ============= UoMs =============
export function useInventoryUoMs() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-uoms"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_uoms").select("*").order("name");
      if (error) throw error;
      return data as InventoryUoM[];
    },
  });

  const createUoM = useMutation({
    mutationFn: async (uom: { name: string; abbreviation?: string }) => {
      const { data, error } = await db.from("inventory_uoms").insert(uom).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-uoms"] }),
  });

  return { ...query, createUoM };
}

// ============= Stores =============
export function useInventoryStores() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-stores"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_stores").select("*").order("name");
      if (error) throw error;
      return data as InventoryStore[];
    },
  });

  const createStore = useMutation({
    mutationFn: async (store: Omit<InventoryStore, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await db.from("inventory_stores").insert(store).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-stores"] }),
  });

  const updateStore = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryStore> & { id: string }) => {
      const { data, error } = await db.from("inventory_stores").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-stores"] }),
  });

  return { ...query, createStore, updateStore };
}

// ============= Inventory Items =============
export function useInventoryItems(filters?: { category?: string; lowStock?: boolean; storeId?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-items", filters],
    queryFn: async () => {
      let q = db
        .from("inventory_items")
        .select(`*, category:inventory_categories(*), supplier:suppliers(*), uom:inventory_uoms(*)`)
        .eq("is_active", true)
        .order("name");

      if (filters?.category) q = q.eq("category_id", filters.category);

      const { data, error } = await q;
      if (error) throw error;

      let items = data as InventoryItem[];
      if (filters?.lowStock) items = items.filter((i) => i.current_stock <= i.reorder_point);
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
    mutationFn: async (item: Partial<InventoryItem>) => {
      const { category, supplier, uom, ...clean } = item as any;
      const { data, error } = await db.from("inventory_items").insert(clean).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { category, supplier, uom, ...clean } = updates as any;
      const { data, error) = await db.from("inventory_items").update(clean).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
  });

  const deactivateItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("inventory_items").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
  });

  const adjustStock = useMutation({
    mutationFn: async ({ itemId, storeId, quantity, type, notes }: { itemId: string; storeId?: string; quantity: number; type: "in" | "out" | "adjustment"; notes?: string }) => {
      const { data: item, error: fetchError } = await db.from("inventory_items").select("current_stock").eq("id", itemId).single();
      if (fetchError) throw fetchError;

      const newStock = type === "out" ? item.current_stock - quantity : item.current_stock + quantity;
      const updates: Record<string, unknown> = { current_stock: Math.max(0, newStock) };
      if (type === "in") updates.last_restocked_at = new Date().toISOString();

      const { error: updateError } = await db.from("inventory_items").update(updates).eq("id", itemId);
      if (updateError) throw updateError;

      const { error: movementError } = await db.from("stock_movements").insert({
        item_id: itemId,
        store_id: storeId,
        movement_type: type,
        quantity,
        notes
      });
      if (movementError) throw movementError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  return { ...query, createItem, updateItem, deactivateItem, adjustStock };
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
    mutationFn: async ({ items, ...order }: any) => {
      const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
      const { data: po, error: poError } = await db.from("purchase_orders").insert({ ...order, order_number: orderNumber }).select().single();
      if (poError) throw poError;

      const poItems = items.map((i: any) => ({ ...i, purchase_order_id: po.id }));
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

  const receivePurchaseOrder = useMutation({
    mutationFn: async ({ poId, receivedItems }: { poId: string; receivedItems: any[] }) => {
      for (const ri of receivedItems) {
        const { error: poItemErr } = await db.from("purchase_order_items").update({
          received_quantity: ri.receivedQty,
          batch_number: ri.batchNumber,
          expiry_date: ri.expiryDate,
          damaged_quantity: ri.damagedQty,
          quality_status: ri.qualityStatus
        }).eq("id", ri.poItemId);

        if (poItemErr) throw poItemErr;

        if (ri.receivedQty > 0) {
          const { data: item, error: fetchErr } = await db.from("inventory_items").select("current_stock, cost_price").eq("id", ri.itemId).single();
          if (fetchErr) throw fetchErr;

          const { data: poItem } = await db.from("purchase_order_items").select("unit_price").eq("id", ri.poItemId).single();

          await db.from("inventory_items").update({
            current_stock: item.current_stock + ri.receivedQty,
            last_restocked_at: new Date().toISOString(),
            last_purchase_cost: poItem?.unit_price || item.cost_price,
            avg_cost: (item.cost_price + (poItem?.unit_price || item.cost_price)) / 2
          }).eq("id", ri.itemId);

          await db.from("stock_movements").insert({
            item_id: ri.itemId,
            movement_type: "in",
            quantity: ri.receivedQty,
            reference_type: "purchase_order",
            reference_id: poId,
            notes: `Received from PO (Batch: ${ri.batchNumber || 'N/A'})`,
          });
        }
      }

      const { data: poItems } = await db.from("purchase_order_items").select("quantity, received_quantity").eq("purchase_order_id", poId);
      const allReceived = poItems?.every((pi: any) => (pi.received_quantity || 0) >= pi.quantity);
      const anyReceived = poItems?.some((pi: any) => (pi.received_quantity || 0) > 0);

      const newStatus = allReceived ? "received" : anyReceived ? "partially_received" : "sent";
      const updates: Record<string, unknown> = { status: newStatus };
      if (allReceived) updates.received_date = new Date().toISOString().split("T")[0];

      await db.from("purchase_orders").update(updates).eq("id", poId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  return { ...query, createPurchaseOrder, updatePurchaseOrderStatus, receivePurchaseOrder };
}

// ============= Stock Movements =============
export function useStockMovements(itemId?: string) {
  return useQuery({
    queryKey: ["stock-movements", itemId],
    queryFn: async () => {
      let q = db
        .from("stock_movements")
        .select(`*, item:inventory_items(name, sku, department, cost_price)`)
        .order("created_at", { ascending: false })
        .limit(500);
      if (itemId) q = q.eq("item_id", itemId);
      const { data, error } = await q;
      if (error) throw error;
      return data as StockMovement[];
    },
  });
}

// ============= Requisitions =============
export function useInventoryRequisitions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-requisitions"],
    queryFn: async () => {
      const { data, error } = await db
        .from("inventory_requisitions")
        .select(`*, items:inventory_requisition_items(*, item:inventory_items(*))`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InventoryRequisition[];
    },
  });

  const createRequisition = useMutation({
    mutationFn: async ({ items, ...req }: any) => {
      const reqNumber = `REQ-${Date.now().toString(36).toUpperCase()}`;
      const { data: requisition, error: reqError } = await db.from("inventory_requisitions").insert({ ...req, requisition_number: reqNumber }).select().single();
      if (reqError) throw reqError;

      const reqItems = items.map((i: any) => ({ ...i, requisition_id: requisition.id }));
      const { error: itemsError } = await db.from("inventory_requisition_items").insert(reqItems);
      if (itemsError) throw itemsError;
      return requisition;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-requisitions"] }),
  });

  const updateRequisitionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data, error } = await db.from("inventory_requisitions").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-requisitions"] }),
  });

  return { ...query, createRequisition, updateRequisitionStatus };
}

// ============= Stock Issues =============
export function useInventoryIssues() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-issues"],
    queryFn: async () => {
      const { data, error } = await db
        .from("inventory_stock_issues")
        .select(`*, items:inventory_stock_issue_items(*, item:inventory_items(*))`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InventoryStockIssue[];
    },
  });

  const createIssue = useMutation({
    mutationFn: async ({ items, requisition_id, ...issue }: any) => {
      const issueNumber = `SIV-${Date.now().toString(36).toUpperCase()}`;

      const { data: sIssue, error: issueErr } = await db.from("inventory_stock_issues").insert({
        ...issue,
        requisition_id,
        issue_number: issueNumber
      }).select().single();
      if (issueErr) throw issueErr;

      for (const item of items) {
        await db.from("inventory_stock_issue_items").insert({
          stock_issue_id: sIssue.id,
          item_id: item.item_id,
          quantity: item.quantity,
          batch_number: item.batch_number
        });

        const { data: invItem } = await db.from("inventory_items").select("current_stock").eq("id", item.item_id).single();
        await db.from("inventory_items").update({
          current_stock: Math.max(0, (invItem?.current_stock || 0) - item.quantity)
        }).eq("id", item.item_id);

        await db.from("stock_movements").insert({
          item_id: item.item_id,
          movement_type: "out",
          quantity: item.quantity,
          reference_type: "stock_issue",
          reference_id: sIssue.id,
          notes: `Stock issue to ${issue.department}`,
        });
      }

      if (requisition_id) {
        await db.from("inventory_requisitions").update({ status: "fully_ordered" }).eq("id", requisition_id);
      }

      return sIssue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-issues"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    },
  });

  return { ...query, createIssue };
}

// ============= Recipes =============
export function useInventoryRecipes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-recipes"],
    queryFn: async () => {
      const { data, error } = await db
        .from("inventory_recipes")
        .select(`*, items:inventory_recipe_items(*, item:inventory_items(*), uom:inventory_uoms(*))`)
        .order("name");
      if (error) throw error;
      return data as InventoryRecipe[];
    },
  });

  const createRecipe = useMutation({
    mutationFn: async ({ items, ...recipe }: any) => {
      const { data: rec, error: recError } = await db.from("inventory_recipes").insert(recipe).select().single();
      if (recError) throw recError;

      const recItems = items.map((i: any) => ({ ...i, recipe_id: rec.id }));
      const { error: itemsError } = await db.from("inventory_recipe_items").insert(recItems);
      if (itemsError) throw itemsError;
      return rec;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-recipes"] }),
  });

  return { ...query, createRecipe };
}

// ============= Production =============
export function useInventoryProduction() {
  const queryClient = useQueryClient();

  const produceBatch = useMutation({
    mutationFn: async ({ recipeId, quantity, producedBy, notes }: { recipeId: string, quantity: number, producedBy: string, notes?: string }) => {
      const { data: log, error: logErr } = await db.from("inventory_production_logs").insert({
        recipe_id: recipeId,
        quantity_produced: quantity,
        produced_by: producedBy,
        notes
      }).select().single();
      if (logErr) throw logErr;

      const { data: recipeItems } = await db.from("inventory_recipe_items").select("*").eq("recipe_id", recipeId);

      if (recipeItems) {
        for (const rItem of recipeItems) {
          const deductionQty = rItem.quantity * quantity;

          const { data: invItem } = await db.from("inventory_items").select("current_stock").eq("id", rItem.item_id).single();
          await db.from("inventory_items").update({
            current_stock: Math.max(0, (invItem?.current_stock || 0) - deductionQty)
          }).eq("id", rItem.item_id);

          await db.from("stock_movements").insert({
            item_id: rItem.item_id,
            movement_type: "out",
            quantity: deductionQty,
            reference_type: "production",
            reference_id: log.id,
            notes: `Production consumption for Recipe ID ${recipeId}`,
          });
        }
      }

      return log;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  return { produceBatch };
}

// ============= Transfers =============
export function useInventoryTransfers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-transfers"],
    queryFn: async () => {
      const { data, error } = await db
        .from("inventory_transfers")
        .select(`*, item:inventory_items(name, sku, unit)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InventoryTransfer[];
    },
  });

  const createTransfer = useMutation({
    mutationFn: async (transfer: any) => {
      const transferNumber = `TRF-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await db.from("inventory_transfers").insert({ ...transfer, transfer_number: transferNumber, status: "pending" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] }),
  });

  const completeTransfer = useMutation({
    mutationFn: async (id: string) => {
      const { data: transfer, error: fetchErr } = await db.from("inventory_transfers").select("*").eq("id", id).single();
      if (fetchErr) throw fetchErr;

      await db.from("stock_movements").insert({
        item_id: transfer.item_id,
        movement_type: "adjustment",
        quantity: transfer.quantity,
        from_location: transfer.from_location,
        to_location: transfer.to_location,
        notes: `Transfer ${transfer.transfer_number}: ${transfer.from_location} → ${transfer.to_location}`,
      });

      const { error } = await db.from("inventory_transfers").update({ status: "completed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  return { ...query, createTransfer, completeTransfer };
}

// ============= Wastage =============
export function useInventoryWastage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-wastage"],
    queryFn: async () => {
      const { data, error } = await db
        .from("inventory_wastage")
        .select(`*, item:inventory_items(name, sku, unit, cost_price)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InventoryWastage[];
    },
  });

  const reportWastage = useMutation({
    mutationFn: async (wastage: any) => {
      const { data, error } = await db.from("inventory_wastage").insert(wastage).select().single();
      if (error) throw error;

      const { data: item, error: fetchErr } = await db.from("inventory_items").select("current_stock").eq("id", wastage.item_id).single();
      if (fetchErr) throw fetchErr;

      await db.from("inventory_items").update({ current_stock: Math.max(0, item.current_stock - wastage.quantity) }).eq("id", wastage.item_id);
      await db.from("stock_movements").insert({
        item_id: wastage.item_id,
        movement_type: "out",
        quantity: wastage.quantity,
        notes: `Wastage: ${wastage.wastage_type} - ${wastage.reason || "No reason"}`,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-wastage"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  return { ...query, reportWastage };
}

// ============= Stats =============
export function useInventoryStats() {
  const { data: items } = useInventoryItems();

  return {
    totalItems: items?.length || 0,
    lowStock: items?.filter((i) => i.current_stock <= i.reorder_point).length || 0,
    outOfStock: items?.filter((i) => i.current_stock === 0).length || 0,
    totalValue: items?.reduce((sum, i) => sum + i.current_stock * i.cost_price, 0) || 0,
  };
}
