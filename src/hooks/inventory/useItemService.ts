import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Database } from "@/integrations/supabase/types";

const db = supabase;

export function useItemService() {
  const queryClient = useQueryClient();

  const categories = useQuery({
    queryKey: ["item-categories"],
    queryFn: async () => {
      const { data, error } = await db.from("item_categories").select("*").order("category_name");
      if (error) throw error;
      return data;
    },
  });

  const units = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await db.from("units").select("*").order("unit_name");
      if (error) throw error;
      return data;
    },
  });

  const items = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await db.from("items").select(`*, category:item_categories(*), unit:units(*), supplier:suppliers(*)`).order("item_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const itemsChannel = db.channel("items-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => {
        queryClient.invalidateQueries({ queryKey: ["items"] });
      }).subscribe();

    const catsChannel = db.channel("categories-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "item_categories" }, () => {
        queryClient.invalidateQueries({ queryKey: ["item-categories"] });
      }).subscribe();

    return () => {
      db.removeChannel(itemsChannel);
      db.removeChannel(catsChannel);
    };
  }, [queryClient]);

  const createItem = useMutation({
    mutationFn: async (item: Database["public"]["Tables"]["items"]["Insert"]) => {
      const { data, error } = await db.from("items").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ item_id, ...updates }: Database["public"]["Tables"]["items"]["Update"] & { item_id: string }) => {
      const { data, error } = await db.from("items").update(updates).eq("item_id", item_id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  const createCategory = useMutation({
    mutationFn: async (cat: Database["public"]["Tables"]["item_categories"]["Insert"]) => {
      const { data, error } = await db.from("item_categories").insert(cat).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["item-categories"] }),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ category_id, ...updates }: Database["public"]["Tables"]["item_categories"]["Update"] & { category_id: string }) => {
      const { data, error } = await db.from("item_categories").update(updates).eq("category_id", category_id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["item-categories"] }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("item_categories").delete().eq("category_id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["item-categories"] }),
  });

  const createUoM = useMutation({
    mutationFn: async (uom: Database["public"]["Tables"]["units"]["Insert"]) => {
      const { data, error } = await db.from("units").insert(uom).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["units"] }),
  });

  const suppliers = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await db.from("suppliers").select("*").order("supplier_name");
      if (error) throw error;
      return data;
    },
  });

  return {
    items, categories, units, suppliers,
    createItem, updateItem,
    createCategory, updateCategory, deleteCategory,
    createUoM
  };
}
