import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface MaintenanceRequest {
  id: string;
  room_id: string | null;
  location: string | null;
  issue: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assigned_to: string | null;
  reported_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  room?: { room_number: string };
  staff?: { first_name: string; last_name: string };
}

export function useMaintenance(filters?: { status?: string; priority?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["maintenance-requests", filters],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase as any)
        .from("maintenance_requests")
        .select(`*, room:rooms(room_number), staff:staff_members(first_name, last_name)`)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") q = q.eq("status", filters.status);
      if (filters?.priority) q = q.eq("priority", filters.priority);

      const { data, error } = await q;
      if (error) throw error;
      return data as MaintenanceRequest[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("maintenance-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "maintenance_requests" }, () => {
        queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createRequest = useMutation({
    mutationFn: async (request: Partial<MaintenanceRequest>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("maintenance_requests").insert(request).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] }),
  });

  const updateRequestStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Partial<MaintenanceRequest> = { status: status as MaintenanceRequest["status"] };
      if (status === "completed") updates.completed_at = new Date().toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("maintenance_requests").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] }),
  });

  return { ...query, createRequest, updateRequestStatus };
}
