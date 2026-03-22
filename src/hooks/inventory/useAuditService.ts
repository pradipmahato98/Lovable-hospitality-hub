import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

const db = supabase;

export function useAuditService() {
  const queryClient = useQueryClient();

  const stockCounts = useQuery({
    queryKey: ["stock-counts"],
    queryFn: async () => {
      const { data, error } = await db.from("stock_counts").select(`*, store:stores(store_name), items:stock_count_items(*, item:items(*))`).order("count_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const logs = useQuery({
    queryKey: ["inventory-logs"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_logs").select(`*, user:profiles(first_name, last_name)`).order("timestamp", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createStockCount = useMutation({
    mutationFn: async ({ items, ...count }: Database["public"]["Tables"]["stock_counts"]["Insert"] & { items: Database["public"]["Tables"]["stock_count_items"]["Insert"][] }) => {
      const { data: sc, error: scErr } = await db.from("stock_counts").insert(count).select().single();
      if (scErr) throw scErr;

      const countItems = items.map(i => ({ ...i, count_id: sc.count_id }));
      const { error: itemErr } = await db.from("stock_count_items").insert(countItems);
      if (itemErr) throw itemErr;

      return sc;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock-counts"] }),
  });

  const reconcileStockCount = useMutation({
    mutationFn: async (count_id: string) => {
      const { data, error } = await db.from("stock_counts").update({ status: "reconciled" }).eq("count_id", count_id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock-counts"] }),
  });

  return { stockCounts, logs, createStockCount, reconcileStockCount };
}
