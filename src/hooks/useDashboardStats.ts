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

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

      // Run all queries in parallel for better performance
      const [
        { data: rooms, error: roomsError },
        { count: totalGuests, error: guestsError },
        { data: reservationsToday, error: revError },
        { data: allReservations, error: allResError },
        { count: pendingBookings, error: pendingError },
        { count: securityAlerts, error: secError },
        { data: aggregates, error: aggError },
        { data: userTrends, error: userTrendsError }
      ] = await Promise.all([
        supabase.from("rooms").select("status, room_type"),
        supabase.from("guests").select("*", { count: "exact", head: true }),
        supabase.from("reservations").select("total_amount").eq("check_in_date", today),
        supabase.from("reservations").select("status, total_amount, created_at").gte("created_at", sixMonthsAgoStr),
        supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("audit_log").select("*", { count: "exact", head: true })
          .or("action.ilike.%fail%,action.ilike.%unauthorized%")
          .gte("created_at", today),
        supabase.rpc("get_dashboard_stats"),
        supabase.from("profiles").select("created_at").gte("created_at", sixMonthsAgoStr)
      ]);

      if (roomsError) throw roomsError;
      if (guestsError) throw guestsError;
      if (revError) throw revError;
      if (allResError) throw allResError;
      if (pendingError) throw pendingError;
      if (secError) throw secError;
      if (aggError) throw aggError;
      if (userTrendsError) throw userTrendsError;

      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      const todayRevenue = reservationsToday?.reduce((sum, res) => sum + Number(res.total_amount), 0) || 0;

      const monthlyRevenue = allReservations?.filter(res => {
        const resDate = new Date(res.created_at);
        return resDate >= startOfMonth;
      }).reduce((sum, res) => sum + Number(res.total_amount), 0) || 0;

      // Use aggregates from RPC for lifetime and totals
      const lifetimeRevenue = (aggregates as any)?.total_revenue || 0;
      const totalUsers = (aggregates as any)?.total_users || 0;
      const totalBookings = (aggregates as any)?.total_bookings || 0;

      // Process Revenue Trends (Last 6 months)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const revenueTrends = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const monthName = months[d.getMonth()];
        const monthNum = d.getMonth();
        const year = d.getFullYear();

        const monthlyTotal = allReservations?.filter(res => {
          const resDate = new Date(res.created_at);
          return resDate.getMonth() === monthNum && resDate.getFullYear() === year;
        }).reduce((sum, res) => sum + Number(res.total_amount), 0) || 0;

        return { name: monthName, revenue: monthlyTotal };
      });

      // Process Booking Status Distribution
      const bookingStatusData = [
        { name: 'Confirmed', value: allReservations?.filter(r => r.status === 'confirmed').length || 0, color: '#10b981' },
        { name: 'Pending', value: allReservations?.filter(r => r.status === 'pending').length || 0, color: '#f59e0b' },
        { name: 'Cancelled', value: allReservations?.filter(r => r.status === 'cancelled').length || 0, color: '#ef4444' },
        { name: 'Rejected', value: allReservations?.filter(r => r.status === 'rejected').length || 0, color: '#6b7280' },
      ];

      // Process Room Type Distribution
      const roomTypes = [...new Set(rooms?.map(r => r.room_type) || [])];
      const roomTypeData = roomTypes.map(type => ({
        name: type,
        value: rooms?.filter(r => r.room_type === type).length || 0
      }));

      // Process User Growth
      const userGrowthData = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const monthName = months[d.getMonth()];
        const monthNum = d.getMonth();
        const year = d.getFullYear();

        const count = userTrends?.filter(u => {
          const uDate = new Date(u.created_at);
          return uDate.getMonth() === monthNum && uDate.getFullYear() === year;
        }).length || 0;

        return { name: monthName, users: count };
      });

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
        revenueTrends,
        bookingStatusData,
        roomTypeData,
        userGrowthData
      };
    },
    staleTime: 60 * 1000, // Consider dashboard stats stale after 1 minute
  });
};
