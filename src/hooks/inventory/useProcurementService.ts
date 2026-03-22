import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Database } from "@/integrations/supabase/types";

const db = supabase;

export function useProcurementService() {
  const queryClient = useQueryClient();

  const requisitions = useQuery({
    queryKey: ["purchase-requisitions"],
    queryFn: async () => {
      const { data, error } = await db.from("purchase_requisitions").select(`*, items:purchase_requisition_items(*, item:items(*))`).order("request_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const orders = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await db.from("purchase_orders").select(`*, supplier:suppliers(*), items:purchase_order_items(*, item:items(*))`).order("order_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const grns = useQuery({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const { data, error } = await db.from("goods_receipts").select(`*, supplier:suppliers(*), items:goods_receipt_items(*, item:items(*))`).order("received_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const suppliers = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await db.from("suppliers").select("*").order("supplier_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const poChannel = db.channel("po-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      }).subscribe();

    return () => {
      db.removeChannel(poChannel);
    };
  }, [queryClient]);

  const createOrder = useMutation({
    mutationFn: async ({ items, ...order }: Database["public"]["Tables"]["purchase_orders"]["Insert"] & { items: Database["public"]["Tables"]["purchase_order_items"]["Insert"][] }) => {
      const { data: po, error: poErr } = await db.from("purchase_orders").insert(order).select().single();
      if (poErr) throw poErr;

      const orderItems = items.map(i => ({ ...i, po_id: po.po_id }));
      const { error: itemErr } = await db.from("purchase_order_items").insert(orderItems);
      if (itemErr) throw itemErr;

      return po;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });

  const updateOrder = useMutation({
    mutationFn: async ({ po_id, ...updates }: Database["public"]["Tables"]["purchase_orders"]["Update"] & { po_id: string }) => {
      const { data, error } = await db.from("purchase_orders").update(updates).eq("po_id", po_id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });

  const createRequisition = useMutation({
    mutationFn: async (req: Database["public"]["Tables"]["purchase_requisitions"]["Insert"] & { items: Database["public"]["Tables"]["purchase_requisition_items"]["Insert"][] }) => {
      const { items, ...rest } = req;
      const { data: requisition, error: reqErr } = await db.from("purchase_requisitions").insert(rest).select().single();
      if (reqErr) throw reqErr;

      const reqItems = items.map(i => ({ ...i, requisition_id: requisition.requisition_id }));
      const { error: itemErr } = await db.from("purchase_requisition_items").insert(reqItems);
      if (itemErr) throw itemErr;

      return requisition;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] }),
  });

  const updateRequisition = useMutation({
    mutationFn: async ({ requisition_id, ...updates }: Database["public"]["Tables"]["purchase_requisitions"]["Update"] & { requisition_id: string }) => {
      const { data, error } = await db.from("purchase_requisitions").update(updates).eq("requisition_id", requisition_id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] }),
  });

  const receiveOrder = useMutation({
    mutationFn: async ({ po_id, items, received_date, received_by }: { po_id: string; items: { id: string; received_quantity: number; batch_number?: string; expiry_date?: string }[]; received_date: string; received_by?: string }) => {
      // 1. Create GRN
      const grnNumber = `GRN-${Date.now()}`;
      const { data: grn, error: grnErr } = await db.from("goods_receipts").insert({
        po_id,
        grn_number: grnNumber,
        received_date,
        received_by
      }).select().single();
      if (grnErr) throw grnErr;

      // 2. Update PO items and Create GRN items
      for (const item of items) {
        await db.from("purchase_order_items").update({ received_quantity: item.received_quantity }).eq("id", item.id);

        const { data: poItem } = await db.from("purchase_order_items").select("item_id").eq("id", item.id).single();
        if (poItem) {
          await db.from("goods_receipt_items").insert({
            grn_id: grn.grn_id,
            item_id: poItem.item_id,
            received_quantity: item.received_quantity,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date
          });

          // 3. Update stock_movements
          await db.from("stock_movements").insert({
            item_id: poItem.item_id,
            movement_type: "in",
            quantity: item.received_quantity,
            reference_id: grn.grn_id,
            reference_type: "grn",
            notes: `Received via ${grnNumber}`
          });
        }
      }

      // 4. Update PO status
      await db.from("purchase_orders").update({ status: "received", received_date }).eq("po_id", po_id);

      return grn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  return { requisitions, orders, grns, suppliers, createOrder, updateOrder, receiveOrder, updateRequisition, createRequisition };
}
