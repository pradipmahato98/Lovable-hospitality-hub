import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  description: string | null;
  is_available: boolean;
  display_order: number;
  category?: MenuCategory;
}

export const useMenuCategories = () => {
  return useQuery({
    queryKey: ["pos-menu-categories"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pos_menu_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as MenuCategory[];
    },
  });
};

export const useMenuItems = () => {
  return useQuery({
    queryKey: ["pos-menu-items"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pos_menu_items")
        .select("*, category:pos_menu_categories(id, name)")
        .eq("is_available", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as (MenuItem & { category: { id: string; name: string } | null })[];
    },
  });
};
