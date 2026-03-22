import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Database } from "@/integrations/supabase/types";

const db = supabase;

export function useWastageService() {
  const queryClient = useQueryClient();

  const wastage = useQuery({
    queryKey: ["inventory-wastage"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_wastage").select(`*, item:items(item_name, cost_price, avg_cost)`).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createWastage = useMutation({
    mutationFn: async (w: Database["public"]["Tables"]["inventory_wastage"]["Insert"]) => {
      const { data, error } = await db.from("inventory_wastage").insert(w).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-wastage"] }),
  });

  return { wastage, createWastage };
}
