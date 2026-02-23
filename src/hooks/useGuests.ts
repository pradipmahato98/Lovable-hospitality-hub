import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  total_visits: number | null;
  total_spending: number | null;
  is_vip: boolean | null;
  title: string | null;
  gender: string | null;
  company: string | null;
  nationality: string | null;
  job_title: string | null;
  date_of_birth: string | null;
  region: string | null;
  state_province: string | null;
  subscribed_property: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  id_type: string | null;
  id_number: string | null;
  image_url: string | null;
  id_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useGuests = () => {
  return useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Guest[];
    },
  });
};

export const useUpdateGuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates, staffName }: { id: string; updates: Partial<Guest>; staffName?: string }) => {
      // 1. Get old values for auditing
      const { data: oldGuest } = await supabase
        .from("guests")
        .select("*")
        .eq("id", id)
        .single();

      // 2. Perform update
      const { data, error } = await supabase
        .from("guests")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // 3. Log audit if update was successful
      if (oldGuest) {
        const changes: Record<string, { old: any; new: any }> = {};
        Object.keys(updates).forEach((key) => {
          const k = key as keyof Guest;
          if (oldGuest[k] !== updates[k]) {
            changes[key] = { old: oldGuest[k], new: updates[k] };
          }
        });

        if (Object.keys(changes).length > 0) {
          const { data: userData } = await supabase.auth.getUser();
          await supabase.from("guest_audit_logs").insert({
            guest_id: id,
            staff_id: userData.user?.id,
            staff_name: staffName || userData.user?.email,
            action: "update_profile",
            details: changes,
          });
        }
      }

      return data as Guest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      queryClient.invalidateQueries({ queryKey: ["guest", data.id] });
      queryClient.invalidateQueries({ queryKey: ["guest-audit-logs", data.id] });
    },
  });
};

export const useGuest = (guestId: string | null) => {
  return useQuery({
    queryKey: ["guest", guestId],
    queryFn: async () => {
      if (!guestId) return null;
      
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("id", guestId)
        .single();

      if (error) throw error;
      return data as Guest;
    },
    enabled: !!guestId,
  });
};
