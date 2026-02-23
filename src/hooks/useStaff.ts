import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type StaffMember = Database["public"]["Tables"]["staff_members"]["Row"];

export const useStaff = () => {
  return useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_members")
        .select("*")
        .order("last_name", { ascending: true })
        .limit(100);

      if (error) throw error;
      return data as StaffMember[];
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StaffMember> }) => {
      const { data, error } = await supabase
        .from("staff_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
    },
  });
};

export const useStaffTimeClock = (staffId?: string) => {
  return useQuery({
    queryKey: ["staff-time-clock", staffId],
    queryFn: async () => {
      if (!staffId) return [];
      const { data, error } = await supabase
        .from("staff_time_clock")
        .select("*")
        .eq("staff_id", staffId)
        .order("clock_in", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!staffId,
  });
};

export const useStaffLeaveRequests = (staffId?: string) => {
  return useQuery({
    queryKey: ["staff-leave-requests", staffId],
    queryFn: async () => {
      if (!staffId) return [];
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("staff_id", staffId)
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!staffId,
  });
};
