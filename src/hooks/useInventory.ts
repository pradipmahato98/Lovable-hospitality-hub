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

export interface InventoryLocation {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  category_id: string | null;
  supplier_id: string | null;
  location_id: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number | null;
  reorder_point: number;
  cost_price: number;
  selling_price: number | null;
  department: string | null;
  is_active: boolean;
  last_restocked_at: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  is_perishable: boolean;
  created_at: string;
  category?: InventoryCategory;
  supplier?: Supplier;
  location?: InventoryLocation;
}

export interface InventoryTransfer {
  id: string;
  transfer_number: string;
  from_location_id: string;
  to_location_id: string;
  status: "pending" | "sent" | "completed" | "cancelled";
  requested_by: string | null;
  approved_by: string | null;
  shipped_at: string | null;
  received_at: string | null;
  notes: string | null;
  created_at: string;
  from_location?: InventoryLocation;
  to_location?: InventoryLocation;
  items?: InventoryTransferItem[];
}

export interface InventoryTransferItem {
  id: string;
  transfer_id: string;
  item_id: string;
  requested_quantity: number;
  sent_quantity: number | null;
  received_quantity: number | null;
  item?: InventoryItem;
}

export interface InventoryAudit {
  id: string;
  audit_number: string;
  location_id: string;
  status: "draft" | "in_progress" | "completed";
  conducted_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  location?: InventoryLocation;
  items?: InventoryAuditItem[];
}

export interface InventoryAuditItem {
  id: string;
  audit_id: string;
  item_id: string;
  theoretical_stock: number;
  physical_stock: number | null;
  variance: number | null;
  reason: string | null;
  item?: InventoryItem;
}

export interface InventoryRecipe {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  yield_quantity: number;
  yield_unit: string;
  is_active: boolean;
  created_at: string;
  ingredients?: InventoryRecipeIngredient[];
  total_cost?: number;
}

export interface InventoryRecipeIngredient {
  id: string;
  recipe_id: string;
  item_id: string;
  quantity: number;
  unit: string | null;
  item?: InventoryItem;
}

export interface InventoryWastage {
  id: string;
  item_id: string;
  quantity: number;
  reason: string;
  notes: string | null;
  created_at: string;
  item?: InventoryItem;
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

export interface InventoryRequisition {
  id: string;
  requisition_number: string;
  department: string;
  requested_by_id: string | null;
  requested_by_name: string | null;
  status: "pending" | "approved" | "rejected" | "completed";
  notes: string | null;
  created_at: string;
  items?: InventoryRequisitionItem[];
}

export interface InventoryRequisitionItem {
  id: string;
  requisition_id: string;
  item_id: string;
  quantity: number;
  item?: InventoryItem;
}

export interface StockMovement {
  id: string;
  item_id: string;
  movement_type: string;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  from_location_id: string | null;
  to_location_id: string | null;
  notes: string | null;
  department: string | null;
  created_by: string | null;
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
      const { data, error } = await db.from("inventory_categories").select("*").order("name");
      if (error) throw error;
      return data as InventoryCategory[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("inventory-categories-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_categories" }, () => {
        queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

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

// ============= Locations =============
export function useInventoryLocations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-locations"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_locations").select("*").order("name");
      if (error) throw error;
      return data as InventoryLocation[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("inventory-locations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_locations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["inventory-locations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createLocation = useMutation({
    mutationFn: async (location: Omit<InventoryLocation, "id" | "created_at">) => {
      const { data, error } = await db.from("inventory_locations").insert(location).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-locations"] }),
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryLocation> & { id: string }) => {
      const { data, error } = await db.from("inventory_locations").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-locations"] }),
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("inventory_locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-locations"] }),
  });

  return { ...query, createLocation, updateLocation, deleteLocation };
}

// ============= Suppliers =============
export function useSuppliers(filters?: { showInactive?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["suppliers", filters],
    queryFn: async () => {
      let q = db.from("suppliers").select("*").order("name");
      if (!filters?.showInactive) q = q.eq("is_active", true);
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
export function useInventoryItems(filters?: { category?: string; lowStock?: boolean; showInactive?: boolean; search?: string; location?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-items", filters],
    queryFn: async () => {
      let q = db.from("inventory_items").select(`*, category:inventory_categories(*), supplier:suppliers(*), location:inventory_locations(*)`).order("name");
      if (!filters?.showInactive) q = q.eq("is_active", true);
      if (filters?.category && filters.category !== "all") q = q.eq("category_id", filters.category);
      if (filters?.location && filters.location !== "all") q = q.eq("location_id", filters.location);
      if (filters?.search) q = q.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      let items = data as InventoryItem[];
      if (filters?.lowStock) items = items.filter((i) => i.current_stock <= i.reorder_point);
      return items;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("inventory-items-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, () => {
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createItem = useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id" | "created_at" | "category" | "supplier" | "location">) => {
      const { data, error } = await db.from("inventory_items").insert(item).select().single();
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

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await db.from("inventory_items").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
  });

  const adjustStock = useMutation({
    mutationFn: async ({ itemId, quantity, type, notes, department, locationId, batch_number, expiry_date }: { itemId: string; quantity: number; type: "in" | "out" | "adjustment"; notes?: string; department?: string; locationId?: string; batch_number?: string; expiry_date?: string }) => {
      const { data: item, error: fetchError } = await db.from("inventory_items").select("current_stock").eq("id", itemId).single();
      if (fetchError) throw fetchError;

      const newStock = type === "out" ? item.current_stock - quantity : type === "in" ? item.current_stock + quantity : quantity;

      const updates: any = { current_stock: newStock };
      if (type === "in") {
        updates.last_restocked_at = new Date().toISOString();
        if (batch_number) updates.batch_number = batch_number;
        if (expiry_date) updates.expiry_date = expiry_date;
      }

      const { error: updateError } = await db.from("inventory_items").update(updates).eq("id", itemId);
      if (updateError) throw updateError;

      const { error: moveError } = await db.from("stock_movements").insert({
        item_id: itemId,
        movement_type: type,
        quantity,
        notes,
        department,
        batch_number,
        expiry_date,
        to_location_id: type === "in" ? locationId : undefined,
        from_location_id: type === "out" ? locationId : undefined
      });
      if (moveError) throw moveError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  return { ...query, createItem, updateItem, deleteItem, adjustStock };
}

// ============= Purchase Orders =============
export function usePurchaseOrders(status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["purchase-orders", status],
    queryFn: async () => {
      let q = db.from("purchase_orders").select(`*, supplier:suppliers(*), items:purchase_order_items(*, item:inventory_items(*))`).order("created_at", { ascending: false });
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
      if (!po) throw new Error("Failed to create purchase order header");

      const poItems = items.map((i) => ({ ...i, purchase_order_id: po.id }));
      const { error: itemsError } = await db.from("purchase_order_items").insert(poItems);
      if (itemsError) throw itemsError;

      return po;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });

  const updatePurchaseOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: currentPO } = await db.from("purchase_orders").select("status").eq("id", id).single();
      if (currentPO?.status === "received" && status === "received") throw new Error("Order already received");

      const updates: Record<string, any> = { status };
      if (status === "received") updates.received_date = new Date().toISOString().split("T")[0];
      const { data, error } = await db.from("purchase_orders").update(updates).eq("id", id).select().single();
      if (error) throw error;

      if (status === "received") {
        const { data: items, error: itemsError } = await db.from("purchase_order_items").select("item_id, quantity").eq("purchase_order_id", id);
        if (itemsError) throw itemsError;

        for (const poItem of items || []) {
          const { data: invItem, error: invError } = await db.from("inventory_items").select("current_stock").eq("id", poItem.item_id).single();
          if (invError) throw invError;

          const newStock = (invItem?.current_stock || 0) + poItem.quantity;
          await db.from("inventory_items").update({ current_stock: newStock, last_restocked_at: new Date().toISOString() }).eq("id", poItem.item_id);
          await db.from("stock_movements").insert({
            item_id: poItem.item_id,
            movement_type: "in",
            quantity: poItem.quantity,
            reference_type: "purchase_order",
            reference_id: id,
            notes: `Received from PO`,
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

  return { ...query, createPurchaseOrder, updatePurchaseOrderStatus };
}

// ============= Requisitions =============
export function useInventoryRequisitions(status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-requisitions", status],
    queryFn: async () => {
      let q = db.from("inventory_requisitions").select(`*, items:inventory_requisition_items(*, item:inventory_items(*))`).order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data as InventoryRequisition[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("inventory-requisitions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_requisitions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["inventory-requisitions"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createRequisition = useMutation({
    mutationFn: async ({ items, ...req }: Omit<InventoryRequisition, "id" | "created_at" | "requisition_number"> & { items: { item_id: string; quantity: number }[] }) => {
      const requisitionNumber = `REQ-${generateSecureNumericString(10)}`;
      const { data: record, error: reqError } = await db.from("inventory_requisitions").insert({ ...req, requisition_number: requisitionNumber }).select().single();
      if (reqError) throw reqError;
      if (!record) throw new Error("Failed to create requisition header");

      const reqItems = items.map((i) => ({ ...i, requisition_id: record.id }));
      const { error: itemsError } = await db.from("inventory_requisition_items").insert(reqItems);
      if (itemsError) throw itemsError;

      return record;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-requisitions"] }),
  });

  const updateRequisitionStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return await db.from("inventory_requisitions").update({ status, notes }).eq("id", id).select().single();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-requisitions"] }),
  });

  const deleteRequisition = useMutation({
    mutationFn: async (id: string) => {
      await db.from("inventory_requisition_items").delete().eq("requisition_id", id);
      const { error } = await db.from("inventory_requisitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-requisitions"] }),
  });

  const convertToPO = useMutation({
    mutationFn: async (requisitionId: string) => {
      const { data: req, error: fetchError } = await db.from("inventory_requisitions").select("*, items:inventory_requisition_items(*, item:inventory_items(*))").eq("id", requisitionId).single();
      if (fetchError) throw fetchError;
      if (!req) throw new Error("Requisition not found");

      const supplierMap = new Map<string, any[]>();
      req.items.forEach((ri: any) => {
        const supplierId = ri.item?.supplier_id || "none";
        if (!supplierMap.has(supplierId)) supplierMap.set(supplierId, []);
        supplierMap.get(supplierId)?.push(ri);
      });

      for (const [supplierId, items] of supplierMap.entries()) {
        const subtotal = items.reduce((sum, i) => sum + (i.quantity * (i.item?.cost_price || 0)), 0);
        const { data: po, error: poError } = await db.from("purchase_orders").insert({
          order_number: `PO-REQ-${generateSecureNumericString(8)}`,
          supplier_id: supplierId === "none" ? null : supplierId,
          status: "draft",
          order_date: new Date().toISOString().split("T")[0],
          subtotal: subtotal,
          tax_amount: subtotal * 0.13,
          total: subtotal * 1.13,
          notes: `Auto-generated from Requisition ${req.requisition_number}`
        }).select().single();

        if (poError) throw poError;
        if (!po) throw new Error("Failed to create PO from requisition");

        const poItems = items.map((i) => ({ purchase_order_id: po.id, item_id: i.item_id, quantity: i.quantity, unit_price: i.item?.cost_price || 0 }));
        const { error: itemsError } = await db.from("purchase_order_items").insert(poItems);
        if (itemsError) throw itemsError;
      }

      const { error: finalError } = await db.from("inventory_requisitions").update({ status: "completed" }).eq("id", requisitionId);
      if (finalError) throw finalError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });

  return { ...query, createRequisition, updateRequisitionStatus, deleteRequisition, convertToPO };
}

// ============= Transfers =============
export function useInventoryTransfers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-transfers"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_transfers")
        .select(`*, from_location:inventory_locations!from_location_id(*), to_location:inventory_locations!to_location_id(*), items:inventory_transfer_items(*, item:inventory_items(*))`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InventoryTransfer[];
    },
  });

  useEffect(() => {
    const channel = supabase.channel("inventory-transfers-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_transfers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createTransfer = useMutation({
    mutationFn: async ({ items, ...transfer }: Omit<InventoryTransfer, "id" | "created_at" | "transfer_number"> & { items: { item_id: string; requested_quantity: number }[] }) => {
      const transferNumber = `TRF-${generateSecureNumericString(10)}`;
      const { data: record, error } = await db.from("inventory_transfers").insert({ ...transfer, transfer_number: transferNumber }).select().single();
      if (error) throw error;

      const transferItems = items.map(i => ({ ...i, transfer_id: record.id }));
      const { error: itemsError } = await db.from("inventory_transfer_items").insert(transferItems);
      if (itemsError) throw itemsError;

      return record;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] }),
  });

  const updateTransferStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InventoryTransfer["status"] }) => {
      const { data: transfer, error: fetchError } = await db.from("inventory_transfers")
        .select(`*, items:inventory_transfer_items(*)`)
        .eq("id", id).single();
      if (fetchError) throw fetchError;

      if (status === "completed" && transfer.status !== "completed") {
        for (const tItem of transfer.items) {
          // 1. Get Source Item Details
          const { data: sourceItem, error: sourceError } = await db.from("inventory_items").select("*").eq("id", tItem.item_id).single();
          if (sourceError || !sourceItem) continue;

          if (sourceItem.current_stock < tItem.requested_quantity) {
            console.warn(`Insufficient stock for item ${sourceItem.name} at source location`);
          }

          // 2. Deduct from Source
          const newSourceStock = (sourceItem.current_stock || 0) - tItem.requested_quantity;
          const { error: updateSourceError } = await db.from("inventory_items").update({ current_stock: newSourceStock }).eq("id", sourceItem.id);
          if (updateSourceError) throw updateSourceError;

          // 3. Log Outward Movement
          await db.from("stock_movements").insert({
            item_id: sourceItem.id,
            movement_type: "out",
            quantity: tItem.requested_quantity,
            from_location_id: transfer.from_location_id,
            to_location_id: transfer.to_location_id,
            notes: `Transfer ${transfer.transfer_number} - Outbound`,
            reference_type: "transfer",
            reference_id: transfer.id
          });

          // 4. Handle Destination
          // Check if same item exists at destination
          let destQuery = db.from("inventory_items").select("*").eq("location_id", transfer.to_location_id);
          if (sourceItem.sku) {
            destQuery = destQuery.eq("sku", sourceItem.sku);
          } else {
            destQuery = destQuery.eq("name", sourceItem.name);
          }

          const { data: destItems } = await destQuery;
          const destItem = destItems?.[0];

          if (destItem) {
            // Update existing destination item
            const newDestStock = (destItem.current_stock || 0) + tItem.requested_quantity;
            const { error: updateDestError } = await db.from("inventory_items").update({ current_stock: newDestStock }).eq("id", destItem.id);
            if (updateDestError) throw updateDestError;

            // Log Inward Movement for destination item
            await db.from("stock_movements").insert({
              item_id: destItem.id,
              movement_type: "in",
              quantity: tItem.requested_quantity,
              from_location_id: transfer.from_location_id,
              to_location_id: transfer.to_location_id,
              notes: `Transfer ${transfer.transfer_number} - Inbound`,
              reference_type: "transfer",
              reference_id: transfer.id
            });
          } else {
            // Create new item at destination
            const { data: newItem, error: createError } = await db.from("inventory_items").insert({
              name: sourceItem.name,
              sku: sourceItem.sku,
              barcode: sourceItem.barcode,
              image_url: sourceItem.image_url,
              category_id: sourceItem.category_id,
              supplier_id: sourceItem.supplier_id,
              location_id: transfer.to_location_id,
              unit: sourceItem.unit,
              current_stock: tItem.requested_quantity,
              min_stock: sourceItem.min_stock,
              reorder_point: sourceItem.reorder_point,
              cost_price: sourceItem.cost_price,
              department: sourceItem.department,
              is_active: true
            }).select().single();

            if (createError) throw createError;

            if (newItem) {
              await db.from("stock_movements").insert({
                item_id: newItem.id,
                movement_type: "in",
                quantity: tItem.requested_quantity,
                from_location_id: transfer.from_location_id,
                to_location_id: transfer.to_location_id,
                notes: `Transfer ${transfer.transfer_number} - Inbound (New Item created)`,
                reference_type: "transfer",
                reference_id: transfer.id
              });
            }
          }
        }
      }

      const updates: any = { status };
      if (status === "sent") updates.shipped_at = new Date().toISOString();
      if (status === "completed") updates.received_at = new Date().toISOString();

      const { data, error } = await db.from("inventory_transfers").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    },
  });

  return { ...query, createTransfer, updateTransferStatus };
}

// ============= Stock Audits =============
export function useInventoryAudits() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-audits"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_audits")
        .select(`*, location:inventory_locations(*), items:inventory_audit_items(*, item:inventory_items(*))`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InventoryAudit[];
    },
  });

  const createAudit = useMutation({
    mutationFn: async ({ location_id, item_ids }: { location_id: string; item_ids: string[] }) => {
      const auditNumber = `AUD-${generateSecureNumericString(10)}`;
      const { data: audit, error } = await db.from("inventory_audits").insert({
        audit_number: auditNumber,
        location_id,
        status: "in_progress"
      }).select().single();
      if (error) throw error;

      const auditItems = [];
      for (const itemId of item_ids) {
        const { data: item } = await db.from("inventory_items").select("current_stock").eq("id", itemId).single();
        auditItems.push({
          audit_id: audit.id,
          item_id: itemId,
          theoretical_stock: item?.current_stock || 0
        });
      }

      await db.from("inventory_audit_items").insert(auditItems);
      return audit;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-audits"] }),
  });

  const reconcileAudit = useMutation({
    mutationFn: async ({ audit_id, items }: { audit_id: string; items: { id: string; item_id: string; physical_stock: number; reason?: string }[] }) => {
      for (const item of items) {
        const { data: auditItem } = await db.from("inventory_audit_items").select("theoretical_stock").eq("id", item.id).single();
        const variance = item.physical_stock - (auditItem?.theoretical_stock || 0);

        await db.from("inventory_audit_items").update({
          physical_stock: item.physical_stock,
          variance,
          reason: item.reason
        }).eq("id", item.id);

        if (variance !== 0) {
          await db.from("inventory_items").update({ current_stock: item.physical_stock }).eq("id", item.item_id);
          await db.from("stock_movements").insert({
            item_id: item.item_id,
            movement_type: "adjustment",
            quantity: Math.abs(variance),
            notes: `Audit Reconcile: ${item.reason || "Stock Take Variance"}`,
            reference_type: "audit",
            reference_id: audit_id
          });
        }
      }

      await db.from("inventory_audits").update({
        status: "completed",
        completed_at: new Date().toISOString()
      }).eq("id", audit_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-audits"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    },
  });

  return { ...query, createAudit, reconcileAudit };
}

// ============= Recipes (BOM) =============
export function useInventoryRecipes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-recipes"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_recipes")
        .select(`*, ingredients:inventory_recipe_ingredients(*, item:inventory_items(*))`)
        .order("name");
      if (error) throw error;

      const recipes = data as InventoryRecipe[];
      return recipes.map(r => ({
        ...r,
        total_cost: r.ingredients?.reduce((sum, ing) => sum + (ing.quantity * (ing.item?.cost_price || 0)), 0) || 0
      }));
    },
  });

  const createRecipe = useMutation({
    mutationFn: async ({ ingredients, ...recipe }: Omit<InventoryRecipe, "id" | "created_at"> & { ingredients: { item_id: string; quantity: number; unit?: string }[] }) => {
      const { data: record, error } = await db.from("inventory_recipes").insert(recipe).select().single();
      if (error) throw error;

      const ingredientItems = ingredients.map(i => ({ ...i, recipe_id: record.id }));
      await db.from("inventory_recipe_ingredients").insert(ingredientItems);
      return record;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-recipes"] }),
  });

  const produceRecipe = useMutation({
    mutationFn: async ({ recipe_id, quantity }: { recipe_id: string; quantity: number }) => {
      const { data: recipe } = await db.from("inventory_recipes")
        .select(`*, ingredients:inventory_recipe_ingredients(*)`)
        .eq("id", recipe_id).single();

      const yieldMultiplier = quantity / (recipe.yield_quantity || 1);

      for (const ing of recipe.ingredients) {
        const totalNeeded = ing.quantity * yieldMultiplier;
        const { data: item } = await db.from("inventory_items").select("current_stock").eq("id", ing.item_id).single();
        await db.from("inventory_items").update({ current_stock: (item?.current_stock || 0) - totalNeeded }).eq("id", ing.item_id);

        await db.from("stock_movements").insert({
          item_id: ing.item_id,
          movement_type: "out",
          quantity: totalNeeded,
          notes: `Recipe Production: ${recipe.name}`,
          reference_type: "recipe",
          reference_id: recipe_id
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
  });

  return { ...query, createRecipe, produceRecipe };
}

// ============= Wastage =============
export function useInventoryWastage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-wastage"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_wastage").select(`*, item:inventory_items(*)`).order("created_at", { ascending: false });
      if (error) throw error;
      return data as InventoryWastage[];
    },
  });

  const recordWastage = useMutation({
    mutationFn: async ({ item_id, quantity, reason, notes }: Omit<InventoryWastage, "id" | "created_at">) => {
      const { data: item, error: fetchError } = await db.from("inventory_items").select("current_stock").eq("id", item_id).single();
      if (fetchError) throw fetchError;

      const newStock = (item?.current_stock || 0) - quantity;
      const { error: updateError } = await db.from("inventory_items").update({ current_stock: newStock }).eq("id", item_id);
      if (updateError) throw updateError;

      const { data, error } = await db.from("inventory_wastage").insert({ item_id, quantity, reason, notes }).select().single();
      if (error) throw error;

      await db.from("stock_movements").insert({
        item_id,
        movement_type: "out",
        quantity,
        notes: `Wastage: ${reason}`,
        reference_type: "wastage",
        reference_id: data.id
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-wastage"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  return { ...query, recordWastage };
}

// ============= Stats & Reports =============
export function useInventoryStats() {
  const { data: items } = useInventoryItems({ showInactive: false });
  return {
    totalItems: items?.length || 0,
    lowStock: items?.filter((i) => i.current_stock <= i.reorder_point).length || 0,
    totalValue: items?.reduce((sum, i) => sum + i.current_stock * i.cost_price, 0) || 0,
    categoryDistribution: items?.reduce((acc: Record<string, number>, item) => {
      const catName = item.category?.name || "Uncategorized";
      acc[catName] = (acc[catName] || 0) + (item.current_stock * item.cost_price);
      return acc;
    }, {}),
  };
}

export function useInventoryReportData() {
  const { data: items } = useInventoryItems({ showInactive: false });
  return useQuery({
    queryKey: ["inventory-report-data", items?.length],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: movements } = await db.from("stock_movements").select(`*, item:inventory_items(name, cost_price)`).gte("created_at", thirtyDaysAgo.toISOString()).order("created_at");
      const currentTotalValue = items?.reduce((sum, i) => sum + i.current_stock * i.cost_price, 0) || 0;
      const dailyMap = new Map();
      movements?.forEach((m: any) => {
        const date = m.created_at.split("T")[0];
        if (!dailyMap.has(date)) dailyMap.set(date, { in: 0, out: 0, valueChange: 0 });
        const day = dailyMap.get(date);
        const value = m.quantity * (m.item?.cost_price || 0);
        if (m.movement_type === "in") day.in += m.quantity;
        if (m.movement_type === "out") day.out += m.quantity;
        day.valueChange += (m.movement_type === "in" ? value : -value);
      });
      const result = [];
      const totalChange = movements?.reduce((sum, m: any) => sum + (m.movement_type === "in" ? m.quantity * (m.item?.cost_price || 0) : -m.quantity * (m.item?.cost_price || 0)), 0) || 0;
      let rollingValue = currentTotalValue - totalChange;
      for (let i = 30; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayMovements = dailyMap.get(dateStr) || { in: 0, out: 0, valueChange: 0 };
        rollingValue += dayMovements.valueChange;
        result.push({ date: dateStr.split("-").slice(1).join("/"), in: dayMovements.in, out: dayMovements.out, value: rollingValue });
      }
      return result;
    },
    enabled: items !== undefined
  });
}

export function useStockMovements(filters?: { itemId?: string; type?: string; department?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["stock-movements", filters],
    queryFn: async () => {
      let q = db.from("stock_movements").select(`*, item:inventory_items(name, sku)`).order("created_at", { ascending: false }).limit(100);
      if (filters?.itemId) q = q.eq("item_id", filters.itemId);
      if (filters?.type && filters.type !== "all") q = q.eq("movement_type", filters.type);
      if (filters?.department) q = q.eq("department", filters.department);
      const { data, error } = await q;
      if (error) throw error;
      return data as StockMovement[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("stock-movements-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_movements" }, () => {
        queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}
