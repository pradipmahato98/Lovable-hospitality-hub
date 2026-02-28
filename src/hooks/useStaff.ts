import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-bridge";
import { Database } from "@/integrations/supabase/types";

export type StaffMember = Database["public"]["Tables"]["staff_members"]["Row"];

const SENSITIVE_FIELDS = ["phone", "salary"];

export const useStaff = () => {
  return useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const { data, error } = await api.from("staff_members")
        .select("*")
        .order("last_name", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Decrypt sensitive fields
      const decryptedData = await Promise.all((data || []).map(async (staff: any) => {
        const decrypted: any = { ...staff };
        for (const field of SENSITIVE_FIELDS) {
          if (staff[field] && typeof staff[field] === 'string' && staff[field].startsWith('enc:')) {
            decrypted[field] = await api.decryptSensitive(staff[field]);
          }
        }
        return decrypted;
      }));

      return decryptedData as StaffMember[];
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StaffMember> }) => {
      const encryptedUpdates = { ...updates };

      // Encrypt sensitive fields
      for (const field of SENSITIVE_FIELDS) {
        if (updates[field as keyof StaffMember]) {
          const val = String(updates[field as keyof StaffMember]);
          encryptedUpdates[field as keyof StaffMember] = await api.encryptSensitive(val) as any;
        }
      }

      const { data, error } = await api.from("staff_members")
        .update(encryptedUpdates)
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
      const { data, error } = await api.from("staff_time_clock")
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
      const { data, error } = await api.from("leave_requests")
        .select("*")
        .eq("staff_id", staffId)
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!staffId,
  });
};
