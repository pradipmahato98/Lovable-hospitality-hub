import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

// ============= Types =============
export interface HousekeepingTask {
  id: string;
  room_id: string | null;
  task_type: string;
  assigned_to: string | null;
  priority: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  inspection_notes: string | null;
  inspection_score: number | null;
  created_at: string;
  room?: { room_number: string; room_type: string; floor: number };
}

export interface LostAndFound {
  id: string;
  item_description: string;
  found_location: string;
  found_date: string;
  found_by: string | null;
  category: string | null;
  status: string;
  storage_location: string | null;
  guest_id: string | null;
  claimed_date: string | null;
  claimed_by: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
}

export interface HousekeepingInspection {
  id: string;
  room_id: string;
  inspector_id: string | null;
  inspection_date: string;
  overall_score: number | null;
  cleanliness_score: number | null;
  amenities_score: number | null;
  maintenance_score: number | null;
  status: string;
  notes: string | null;
  issues: unknown[];
  created_at: string;
  room?: { room_number: string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ============= Housekeeping Tasks =============
export function useHousekeepingTasks(filters?: { date?: string; status?: string; priority?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["housekeeping-tasks", filters],
    queryFn: async () => {
      try {
        let q = db
          .from("housekeeping_tasks")
          .select(`*, room:rooms(room_number, room_type, floor)`)
          .order("scheduled_date", { ascending: true })
          .order("priority", { ascending: false });

        if (filters?.date) q = q.eq("scheduled_date", filters.date);
        if (filters?.status) q = q.eq("status", filters.status);
        if (filters?.priority) q = q.eq("priority", filters.priority);

        const { data, error } = await q;
        if (error) {
          console.warn("Schema issue or error in housekeeping_tasks:", error.message);
          return [] as HousekeepingTask[];
        }
        return data as HousekeepingTask[];
      } catch (err) {
        return [] as HousekeepingTask[];
      }
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("housekeeping-tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "housekeeping_tasks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["housekeeping-tasks"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createTask = useMutation({
    mutationFn: async (task: Omit<HousekeepingTask, "id" | "created_at" | "room">) => {
      const { data, error } = await db.from("housekeeping_tasks").insert(task).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["housekeeping-tasks"] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HousekeepingTask> & { id: string }) => {
      const { data, error } = await db.from("housekeeping_tasks").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["housekeeping-tasks"] }),
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "in_progress") updates.started_at = new Date().toISOString();
      if (status === "completed") updates.completed_at = new Date().toISOString();

      const { data, error } = await db.from("housekeeping_tasks").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["housekeeping-tasks"] }),
  });

  return { ...query, createTask, updateTask, updateTaskStatus };
}

// ============= Lost and Found =============
export function useLostAndFound(status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["lost-and-found", status],
    queryFn: async () => {
      try {
        let q = db
          .from("lost_and_found")
          .select("*")
          .order("found_date", { ascending: false });

        if (status) q = q.eq("status", status);

        const { data, error } = await q;
        if (error) return [] as LostAndFound[];
        return data as LostAndFound[];
      } catch (err) {
        return [] as LostAndFound[];
      }
    },
  });

  const createItem = useMutation({
    mutationFn: async (item: Omit<LostAndFound, "id" | "created_at">) => {
      const { data, error } = await db.from("lost_and_found").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lost-and-found"] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LostAndFound> & { id: string }) => {
      const { data, error } = await db.from("lost_and_found").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lost-and-found"] }),
  });

  const claimItem = useMutation({
    mutationFn: async ({ id, claimedBy, guestId }: { id: string; claimedBy: string; guestId?: string }) => {
      const { data, error } = await db.from("lost_and_found").update({
        status: "claimed",
        claimed_date: new Date().toISOString().split("T")[0],
        claimed_by: claimedBy,
        guest_id: guestId,
      }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lost-and-found"] }),
  });

  return { ...query, createItem, updateItem, claimItem };
}

// ============= Inspections =============
export function useHousekeepingInspections(roomId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["housekeeping-inspections", roomId],
    queryFn: async () => {
      try {
        let q = db
          .from("housekeeping_inspections")
          .select(`*, room:rooms(room_number)`)
          .order("inspection_date", { ascending: false });

        if (roomId) q = q.eq("room_id", roomId);

        const { data, error } = await q;
        if (error) return [] as HousekeepingInspection[];
        return data as HousekeepingInspection[];
      } catch (err) {
        return [] as HousekeepingInspection[];
      }
    },
  });

  const createInspection = useMutation({
    mutationFn: async (inspection: Omit<HousekeepingInspection, "id" | "created_at" | "room">) => {
      const { data, error } = await db.from("housekeeping_inspections").insert(inspection).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["housekeeping-inspections"] }),
  });

  return { ...query, createInspection };
}

// ============= Stats =============
export function useHousekeepingStats(date?: string) {
  const { data: tasks = [] } = useHousekeepingTasks({ date: date || new Date().toISOString().split("T")[0] });

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    highPriority: tasks.filter((t) => t.priority === "high" || t.priority === "urgent").length,
  };

  return stats;
}
