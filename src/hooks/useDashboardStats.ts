import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      try {
        // 1. Get Room Stats
        const { data: rooms } = await db.from("rooms").select("status");

        let occupancyRate = "0%";
        if (rooms && Array.isArray(rooms)) {
          const totalRooms = rooms.length;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const occupiedRooms = rooms.filter((r: any) => r.status === 'occupied').length;
          occupancyRate = totalRooms > 0 ? `${Math.round((occupiedRooms / totalRooms) * 100)}%` : "0%";
        }

        // 2. Get Guest Stats
        const { count: totalGuests } = await db
          .from("guests")
          .select("*", { count: "exact", head: true });

        // 3. Get Revenue Stats (Today's total from reservations)
        const today = new Date().toISOString().split('T')[0];
        const { data: reservations } = await db
          .from("reservations")
          .select("total_amount")
          .eq("check_in_date", today);

        const todayRevenue = (reservations && Array.isArray(reservations))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? reservations.reduce((sum: number, res: any) => sum + Number(res.total_amount || 0), 0)
          : 0;

        // 4. Get Pending Bookings
        const { count: pendingBookings } = await db
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // 5. Get Security Stats (Audit logs today)
        let securityAlerts = 0;
        try {
          const { count: secCount } = await db
            .from("audit_log")
            .select("*", { count: "exact", head: true })
            .or("action.ilike.%fail%,action.ilike.%unauthorized%")
            .gte("created_at", today);
          securityAlerts = secCount || 0;
        } catch (e) {
          // Ignore
        }

        return {
          occupancyRate,
          totalGuests: totalGuests || 0,
          todayRevenue: `$${todayRevenue.toLocaleString()}`,
          pendingBookings: pendingBookings || 0,
          securityAlerts
        };
      } catch (err) {
        console.warn("Dashboard stats failed, using zeroed fallbacks", err);
        return {
          occupancyRate: "0%",
          totalGuests: 0,
          todayRevenue: "$0",
          pendingBookings: 0,
          securityAlerts: 0
        };
      }
    },
  });
};
