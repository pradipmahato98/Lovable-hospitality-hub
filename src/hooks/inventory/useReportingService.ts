import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase;

export function useReportingService() {
  const stockOnHand = useQuery({
    queryKey: ["report-stock-on-hand"],
    queryFn: async () => {
      const { data, error } = await db.from("items").select(`item_id, item_name, item_code, current_stock, cost_price, avg_cost, category:item_categories(category_name)`);
      if (error) throw error;
      return data;
    },
  });

  const storeWiseStock = useQuery({
    queryKey: ["report-store-wise-stock"],
    queryFn: async () => {
      const { data, error } = await db.from("store_inventory").select(`*, item:items(item_name), store:stores(store_name)`);
      if (error) throw error;
      return data;
    },
  });

  const movementReport = useQuery({
    queryKey: ["report-movement"],
    queryFn: async () => {
      const { data, error } = await db.from("stock_movements").select(`*, item:items(item_name, department)`);
      if (error) throw error;
      return data;
    },
  });

  const inventoryStats = useQuery({
    queryKey: ["inventory-stats"],
    queryFn: async () => {
      const { data: items } = await db.from("items").select("current_stock, cost_price, avg_cost, reorder_point, last_restocked_at, created_at");
      const { data: movements } = await db.from("stock_movements").select("quantity, movement_type");
      const { data: stockCounts } = await db.from("stock_counts").select("*, items:stock_count_items(variance)");

      const totalItems = items?.length || 0;
      const lowStock = items?.filter((i) => i.current_stock <= (i.reorder_point || 0)).length || 0;
      const outOfStock = items?.filter((i) => i.current_stock === 0).length || 0;
      const totalValue = items?.reduce((sum, i) => sum + (i.current_stock * (i.avg_cost || i.cost_price || 0)), 0) || 0;

      const variance = stockCounts?.[0]?.items?.reduce((sum: number, i: any) => sum + Math.abs(i.variance), 0) || 0;

      const now = new Date();
      const totalDays = items?.reduce((sum, i) => {
        const date = i.last_restocked_at ? new Date(i.last_restocked_at) : new Date(i.created_at);
        return sum + (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) || 0;
      const avgAgingDays = totalItems > 0 ? Math.round(totalDays / totalItems) : 0;

      return {
        totalItems,
        lowStock,
        outOfStock,
        totalValue,
        stockVariance: variance,
        avgAgingDays,
        demandForecast: "+0.0%",
        reorderSuggestions: []
      };
    }
  });

  return { stockOnHand, storeWiseStock, movementReport, inventoryStats };
}
