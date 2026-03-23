import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { db } from "./utils";
import { InventoryCategory, InventoryUoM, InventoryUoMConversion } from "@/types/inventory";

export function useInventorySettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory-settings"],
    queryFn: async () => {
      const { data, error } = await db.from("inventory_settings").select("*");
      if (error) throw error;
      const settingsMap: Record<string, string> = {};
      data?.forEach((s) => settingsMap[s.setting_key] = s.setting_value);
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
    mutationFn: async (cat: { name: string; description?: string; parent_id?: string; sku_prefix?: string }) => {
      const { data, error } = await db.from("inventory_categories").insert(cat as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-categories"] }),
  });

  return { ...query, createCategory };
}

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

  const conversionsQuery = useQuery({
    queryKey: ["inventory-uom-conversions"],
    queryFn: async () => {
      const { data, error } = await db
        .from("inventory_uom_conversions")
        .select("*, from_uom:inventory_uoms!from_uom_id(name, abbreviation), to_uom:inventory_uoms!to_uom_id(name, abbreviation)");
      if (error) throw error;
      return data as InventoryUoMConversion[];
    },
  });

  return { ...query, conversions: conversionsQuery.data || [], isConversionsLoading: conversionsQuery.isLoading };
}
