import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

const db = supabase;

export function useRecipeService() {
  const queryClient = useQueryClient();

  const recipes = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data, error } = await db.from("recipes").select(`*, ingredients:recipe_ingredients(*, item:items(*)), menu_item:pos_menu_items(name)`).order("recipe_name");
      if (error) throw error;
      return data;
    },
  });

  const createRecipe = useMutation({
    mutationFn: async ({ ingredients, ...recipe }: Database["public"]["Tables"]["recipes"]["Insert"] & { ingredients: Database["public"]["Tables"]["recipe_ingredients"]["Insert"][] }) => {
      const { data: rec, error: recErr } = await db.from("recipes").insert(recipe).select().single();
      if (recErr) throw recErr;

      const items = ingredients.map(i => ({ ...i, recipe_id: rec.recipe_id }));
      const { error: itemErr } = await db.from("recipe_ingredients").insert(items);
      if (itemErr) throw itemErr;

      return rec;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });

  const updateRecipe = useMutation({
    mutationFn: async ({ recipe_id, ingredients, ...updates }: Database["public"]["Tables"]["recipes"]["Update"] & { recipe_id: string; ingredients?: Database["public"]["Tables"]["recipe_ingredients"]["Insert"][] }) => {
      const { data: rec, error: recErr } = await db.from("recipes").update(updates).eq("recipe_id", recipe_id).select().single();
      if (recErr) throw recErr;

      if (ingredients) {
        await db.from("recipe_ingredients").delete().eq("recipe_id", recipe_id);
        const items = ingredients.map(i => ({ ...i, recipe_id }));
        await db.from("recipe_ingredients").insert(items);
      }

      return rec;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });

  return { recipes, createRecipe, updateRecipe };
}
