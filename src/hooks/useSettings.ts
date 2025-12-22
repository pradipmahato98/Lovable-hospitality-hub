import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface CheckInFieldSettings {
  id_required: boolean;
  phone_required: boolean;
  email_required: boolean;
}

export function useCheckInSettings() {
  return useQuery({
    queryKey: ["settings", "check_in_fields"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "check_in_fields")
        .maybeSingle();

      if (error) throw error;
      
      // Default settings if not found
      if (!data) {
        return {
          id_required: true,
          phone_required: false,
          email_required: false,
        } as CheckInFieldSettings;
      }
      
      return data.value as unknown as CheckInFieldSettings;
    },
  });
}

export function useUpdateCheckInSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: CheckInFieldSettings) => {
      const { data: existing } = await supabase
        .from("settings")
        .select("id")
        .eq("key", "check_in_fields")
        .maybeSingle();

      const jsonValue: Json = {
        id_required: settings.id_required,
        phone_required: settings.phone_required,
        email_required: settings.email_required,
      };

      if (existing) {
        const { error } = await supabase
          .from("settings")
          .update({ value: jsonValue })
          .eq("key", "check_in_fields");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("settings")
          .insert([{ key: "check_in_fields", value: jsonValue }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "check_in_fields"] });
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });
}
