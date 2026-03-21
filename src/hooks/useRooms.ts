import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Room {
  id: string;
  room_number: string;
  room_type: string;
  floor: number;
  capacity: number;
  price_per_night: number;
  status: string;
  amenities: string[] | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useRooms = (propertyId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("rooms-all-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["rooms", propertyId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, propertyId]);

  return useQuery({
    queryKey: ["rooms", propertyId],
    queryFn: async () => {
      let q = supabase
        .from("rooms")
        .select("*")
        .order("room_number", { ascending: true });

      if (propertyId) {
        q = q.eq("property_id", propertyId);
      }

      const { data, error } = await q;

      if (error) throw error;
      return data as Room[];
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
