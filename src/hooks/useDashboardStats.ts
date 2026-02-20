import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      // Run all queries in parallel for better performance
      const [
        { data: rooms, error: roomsError },
        { count: totalGuests, error: guestsError },
        { data: reservationsToday, error: revError },
        { count: pendingBookings, error: pendingError },
        { count: securityAlerts, error: secError },
        { count: totalUsers, error: usersError },
        { count: totalBookings, error: bookingsError },
        { data: monthlyRevData, error: monthlyRevError },
        { data: lifetimeRevData, error: lifetimeRevError }
      ] = await Promise.all([
        supabase.from("rooms").select("status"),
        supabase.from("guests").select("*", { count: "exact", head: true }),
        supabase.from("reservations").select("total_amount").eq("check_in_date", today),
        supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("audit_log").select("*", { count: "exact", head: true })
          .or("action.ilike.%fail%,action.ilike.%unauthorized%")
          .gte("created_at", today),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("reservations").select("*", { count: "exact", head: true }),
        supabase.from("reservations").select("total_amount").gte("created_at", startOfMonthStr),
        supabase.from("reservations").select("total_amount")
      ]);

      if (roomsError) throw roomsError;
      if (guestsError) throw guestsError;
      if (revError) throw revError;
      if (pendingError) throw pendingError;
      if (secError) throw secError;
      if (usersError) throw usersError;
      if (bookingsError) throw bookingsError;
      if (monthlyRevError) throw monthlyRevError;
      if (lifetimeRevError) throw lifetimeRevError;

      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      const todayRevenue = reservationsToday?.reduce((sum, res) => sum + Number(res.total_amount), 0) || 0;
      const monthlyRevenue = monthlyRevData?.reduce((sum, res) => sum + Number(res.total_amount), 0) || 0;
      const lifetimeRevenue = lifetimeRevData?.reduce((sum, res) => sum + Number(res.total_amount), 0) || 0;

      return {
        occupancyRate: `${occupancyRate}%`,
        totalGuests: totalGuests || 0,
        todayRevenue: `$${todayRevenue.toLocaleString()}`,
        monthlyRevenue: `$${monthlyRevenue.toLocaleString()}`,
        lifetimeRevenue: `$${lifetimeRevenue.toLocaleString()}`,
        pendingBookings: pendingBookings || 0,
        securityAlerts: securityAlerts || 0,
        totalUsers: totalUsers || 0,
        totalRooms: totalRooms || 0,
        totalBookings: totalBookings || 0,
      };
    },
    staleTime: 60 * 1000, // Consider dashboard stats stale after 1 minute
  });
};
