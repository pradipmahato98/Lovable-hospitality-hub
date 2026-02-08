import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  event_type: string;
  action_type: string;
  conditions: any;
  action_config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAutomations = () => {
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ["automation_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching automation rules:", error);
        return [];
      }
      return data as AutomationRule[];
    },
  });

  const createRule = useMutation({
    mutationFn: async (rule: Omit<AutomationRule, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("automation_rules" as any)
        .insert([rule])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_rules"] });
      toast.success("Automation rule created");
    },
    onError: (error) => {
      toast.error("Failed to create rule: " + error.message);
    },
  });

  const updateRule = useMutation({
    mutationFn: async (rule: Partial<AutomationRule> & { id: string }) => {
      const { data, error } = await supabase
        .from("automation_rules" as any)
        .update(rule)
        .eq("id", rule.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_rules"] });
      toast.success("Automation rule updated");
    },
    onError: (error) => {
      toast.error("Failed to update rule: " + error.message);
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automation_rules" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_rules"] });
      toast.success("Automation rule deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete rule: " + error.message);
    },
  });

  return {
    rules,
    isLoading,
    createRule,
    updateRule,
    deleteRule,
  };
};

export const useAllRoutingRules = () => {
  return useQuery({
    queryKey: ["routing_rules", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routing_rules" as any)
        .select(`
          *,
          folio:guest_folios!routing_rules_source_folio_id_fkey (
            folio_number,
            guests (first_name, last_name)
          ),
          target_folio:guest_folios!routing_rules_target_folio_id_fkey (
            folio_number,
            guests (first_name, last_name)
          )
        `);

      if (error) {
        console.error("Error fetching all routing rules:", error);
        return [];
      }
      return data;
    },
  });
};
