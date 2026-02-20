import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Room {
  id: string;
  room_number: string;
  room_type: string;
  floor: number;
  capacity: number;
  price_per_night: number;
  status: string;
  is_active?: boolean;
  image_url: string | null;
  amenities: string[] | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useRooms = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number", { ascending: true });

      if (error) throw error;
      return data as Room[];
    },
  });
};

export const useRoomMutations = () => {
  const queryClient = useQueryClient();

  const addRoom = useMutation({
    mutationFn: async (room: Partial<Room>) => {
      const { data, error } = await supabase
        .from("rooms")
        .insert([{ ...room, status: room.status || 'available' }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const updateRoom = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Room>) => {
      const { data, error } = await supabase
        .from("rooms")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const toggleRoomActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase
        .from("rooms")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  return { addRoom, updateRoom, deleteRoom, toggleRoomActive };
};

export const useUpdateRoomStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("rooms")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
};

export const useRoom = (roomId: string | null) => {
  return useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error) throw error;
      return data as Room;
    },
    enabled: !!roomId,
  });
};

export const useRoomStats = () => {
  const { data: rooms, isLoading, error } = useRooms();

  const stats = rooms?.reduce(
    (acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) ?? {};

  return {
    stats: {
      available: stats["available"] || 0,
      occupied: stats["occupied"] || 0,
      cleaning: stats["cleaning"] || 0,
      maintenance: stats["maintenance"] || 0,
    },
    isLoading,
    error,
  };
};
