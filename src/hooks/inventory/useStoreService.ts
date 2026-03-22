import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Database } from "@/integrations/supabase/types";

const db = supabase;

export function useStoreService() {
  const queryClient = useQueryClient();

  const stores = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await db.from("stores").select("*").order("store_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const storesChannel = db.channel("stores-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stores" }, () => {
        queryClient.invalidateQueries({ queryKey: ["stores"] });
      }).subscribe();

    return () => {
      db.removeChannel(storesChannel);
    };
  }, [queryClient]);

  const createStore = useMutation({
    mutationFn: async (store: Database["public"]["Tables"]["stores"]["Insert"]) => {
      const { data, error } = await db.from("stores").insert(store).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores"] }),
  });

  const updateStore = useMutation({
    mutationFn: async ({ store_id, ...updates }: Database["public"]["Tables"]["stores"]["Update"] & { store_id: string }) => {
      const { data, error } = await db.from("stores").update(updates).eq("store_id", store_id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores"] }),
  });

  return { stores, createStore, updateStore };
}
