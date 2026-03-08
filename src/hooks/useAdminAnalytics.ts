import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-bridge";

export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [roomsRes, reservationsRes] = await Promise.all([
        (await api.from("rooms")).select("status, room_type"),
        (await api.from("reservations")).select("status")
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (reservationsRes.error) throw reservationsRes.error;

      const rooms = roomsRes.data || [];
      const reservations = reservationsRes.data || [];

      return {
        totalRooms: rooms.length,
        occupancy: reservations.filter((r: any) => r.status === "confirmed").length,
        roomTypes: Array.from(new Set(rooms.map((r: any) => r.room_type))),
      };
    },
  });
};
