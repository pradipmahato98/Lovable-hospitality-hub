import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Database } from "@/integrations/supabase/types";

const db = supabase;

export function useInventoryTransactionService() {
  const queryClient = useQueryClient();

  const movements = useQuery({
    queryKey: ["stock-movements"],
    queryFn: async () => {
      const { data, error } = await db.from("stock_movements").select(`*, item:items(item_name, item_code)`).order("movement_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const transfers = useQuery({
    queryKey: ["stock-transfers"],
    queryFn: async () => {
      const { data, error } = await db.from("stock_transfers").select(`*, items:stock_transfer_items(*, item:items(*)), from:stores!inventory_transfers_from_store_id_fkey(store_name), to:stores!inventory_transfers_to_store_id_fkey(store_name)`).order("transfer_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const movementsChannel = db.channel("movements-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_movements" }, () => {
        queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      }).subscribe();

    return () => {
      db.removeChannel(movementsChannel);
    };
  }, [queryClient]);

  const createMovement = useMutation({
    mutationFn: async (movement: Database["public"]["Tables"]["stock_movements"]["Insert"]) => {
      const { data, error } = await db.from("stock_movements").insert(movement).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock-movements"] }),
  });

  const updateMovement = useMutation({
    mutationFn: async ({ movement_id, ...updates }: Database["public"]["Tables"]["stock_movements"]["Update"] & { movement_id: string }) => {
      const { data: movement } = await db.from("stock_movements").select("*").eq("movement_id", movement_id).single();

      if (movement && updates.notes?.startsWith("APPROVED")) {
        const { data: item } = await db.from("items").select("current_stock").eq("item_id", movement.item_id).single();
        if (item) {
          const newStock = movement.movement_type === "out" ? item.current_stock - movement.quantity : item.current_stock + movement.quantity;
          await db.from("items").update({ current_stock: Math.max(0, newStock) }).eq("item_id", movement.item_id);

          if (movement.store_id) {
            const { data: existing } = await db.from('store_inventory').select('quantity').eq('item_id', movement.item_id).eq('store_id', movement.store_id).maybeSingle();
            const storeStock = movement.movement_type === "out" ? (existing?.quantity || 0) - movement.quantity : (existing?.quantity || 0) + movement.quantity;
            await db.from('store_inventory').upsert({
              item_id: movement.item_id,
              store_id: movement.store_id,
              quantity: Math.max(0, storeStock)
            }, { onConflict: 'item_id,store_id' });
          }
        }
      }

      const { data, error } = await db.from("stock_movements").update(updates).eq("movement_id", movement_id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const updateTransfer = useMutation({
    mutationFn: async ({ transfer_id, ...updates }: Database["public"]["Tables"]["stock_transfers"]["Update"] & { transfer_id: string }) => {
      const { data: transfer } = await db.from("stock_transfers").select("*, items:stock_transfer_items(*)").eq("transfer_id", transfer_id).single();

      if (transfer && updates.status === "completed") {
        for (const tItem of (transfer as any).items) {
          // Deduct from source store
          if (transfer.from_store) {
            const { data: fromInv } = await db.from('store_inventory').select('quantity').eq('item_id', tItem.item_id).eq('store_id', transfer.from_store).maybeSingle();
            await db.from('store_inventory').upsert({
              item_id: tItem.item_id,
              store_id: transfer.from_store,
              quantity: Math.max(0, (fromInv?.quantity || 0) - tItem.quantity)
            }, { onConflict: 'item_id,store_id' });
          }
          // Add to target store
          if (transfer.to_store) {
            const { data: toInv } = await db.from('store_inventory').select('quantity').eq('item_id', tItem.item_id).eq('store_id', transfer.to_store).maybeSingle();
            await db.from('store_inventory').upsert({
              item_id: tItem.item_id,
              store_id: transfer.to_store,
              quantity: (toInv?.quantity || 0) + tItem.quantity
            }, { onConflict: 'item_id,store_id' });
          }
        }
      }

      const { data, error } = await db.from("stock_transfers").update(updates).eq("transfer_id", transfer_id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["store-inventory"] });
    },
  });

  const deleteMovement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("stock_movements").delete().eq("movement_id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock-movements"] }),
  });

  const deductBulkInventoryForSale = useMutation({
    mutationFn: async ({ saleId, items: cartItems }: { saleId: string; items: { menu_item_id: string; quantity: number; name?: string }[] }) => {
      const { data: recipes } = await db.from("recipes").select("recipe_id, menu_item_id").in("menu_item_id", cartItems.map((i) => i.menu_item_id));
      if (!recipes || recipes.length === 0) return;

      for (const item of cartItems) {
        const recipe = recipes.find(r => r.menu_item_id === item.menu_item_id);
        if (recipe) {
          const { data: ingredients } = await db.from("recipe_ingredients").select("*").eq("recipe_id", recipe.recipe_id);
          if (ingredients) {
            for (const ing of ingredients) {
              const { data: invItem } = await db.from("items").select("current_stock, avg_cost, cost_price, item_name").eq("item_id", ing.item_id).single();
              if (!invItem) continue;

              const deductionQty = ing.quantity_required * item.quantity;
              await db.from("items").update({ current_stock: Math.max(0, (invItem.current_stock || 0) - deductionQty) }).eq("item_id", ing.item_id);

              await db.from("stock_movements").insert({
                item_id: ing.item_id,
                movement_type: "out",
                quantity: deductionQty,
                reference_type: "pos_sale",
                reference_id: saleId,
                notes: `POS Sale deduction: ${item.name || item.menu_item_id}`,
                movement_date: new Date().toISOString()
              });
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  return { movements, transfers, createMovement, updateMovement, updateTransfer, deleteMovement, deductBulkInventoryForSale };
}
