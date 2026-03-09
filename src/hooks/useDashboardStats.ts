import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // 1. Get Room Stats
      const { data: rooms, error: roomsError } = await supabase.from("rooms").select("status");
      if (roomsError) throw roomsError;

      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      // 2. Get Guest Stats
      const { count: totalGuests, error: guestsError } = await supabase
        .from("guests")
        .select("*", { count: "exact", head: true });
      if (guestsError) throw guestsError;

      // 3. Get Revenue Stats (Today's total from reservations)
      const today = new Date().toISOString().split('T')[0];
      const { data: reservations, error: revError } = await supabase
        .from("reservations")
        .select("total_amount")
        .eq("check_in_date", today);
      if (revError) throw revError;

      const todayRevenue = reservations.reduce((sum, res) => sum + Number(res.total_amount), 0);

      // 4. Get Pending Bookings
      const { count: pendingBookings, error: pendingError } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (pendingError) throw pendingError;

      // 5. Get Security Stats (Audit logs today)
      const { count: securityAlerts, error: secError } = await supabase
        .from("audit_log")
        .select("*", { count: "exact", head: true })
        .or("action.ilike.%fail%,action.ilike.%unauthorized%")
        .gte("created_at", today);
      if (secError) throw secError;

      return {
        occupancyRate: `${occupancyRate}%`,
        totalGuests: totalGuests || 0,
        todayRevenue: formatCurrency(todayRevenue),
        pendingBookings: pendingBookings || 0,
        securityAlerts: securityAlerts || 0
      };
    },
  });
};
