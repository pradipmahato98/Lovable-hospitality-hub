import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Run all queries in parallel for better performance
      const [
        { data: rooms, error: roomsError },
        { count: totalGuests, error: guestsError },
        { data: reservations, error: revError },
        { count: pendingBookings, error: pendingError },
        { count: securityAlerts, error: secError }
      ] = await Promise.all([
        supabase.from("rooms").select("status"),
        supabase.from("guests").select("*", { count: "exact", head: true }),
        supabase.from("reservations").select("total_amount").eq("check_in_date", today),
        supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("audit_log").select("*", { count: "exact", head: true })
          .or("action.ilike.%fail%,action.ilike.%unauthorized%")
          .gte("created_at", today)
      ]);

      if (roomsError) throw roomsError;
      if (guestsError) throw guestsError;
      if (revError) throw revError;
      if (pendingError) throw pendingError;
      if (secError) throw secError;

      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      const todayRevenue = reservations?.reduce((sum, res) => sum + Number(res.total_amount), 0) || 0;

      return {
        occupancyRate: `${occupancyRate}%`,
        totalGuests: totalGuests || 0,
        todayRevenue: `$${todayRevenue.toLocaleString()}`,
        pendingBookings: pendingBookings || 0,
        securityAlerts: securityAlerts || 0
      };
    },
    staleTime: 60 * 1000, // Consider dashboard stats stale after 1 minute
  });
};
