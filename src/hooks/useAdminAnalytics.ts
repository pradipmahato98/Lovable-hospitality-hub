import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export interface AnalyticsData {
  revenueTrends: { label: string; value: number }[];
  roomDistribution: { status: { name: string; value: number }[]; type: { name: string; value: number }[] };
  userGrowth: { label: string; value: number }[];
  bookingDistribution: { name: string; value: number }[];
}

export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async (): Promise<AnalyticsData> => {
      // Parallelize data fetching for performance
      const [
        revenueResults,
        roomsResult,
        userGrowthResults,
        bookingDistResult
      ] = await Promise.all([
        // 1. Revenue Trends (last 6 months)
        Promise.all(Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i);
          const start = startOfMonth(date).toISOString();
          const end = endOfMonth(date).toISOString();
          return supabase
            .from("reservations")
            .select("total_amount")
            .gte("created_at", start)
            .lte("created_at", end)
            .then(({ data }) => ({
              label: format(date, "MMM"),
              value: (data || []).reduce((sum, res) => sum + Number(res.total_amount || 0), 0)
            }));
        })),

        // 2. Room Distribution
        supabase.from("rooms").select("status, room_type"),

        // 3. User Growth (last 6 months)
        Promise.all(Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i);
          const start = startOfMonth(date).toISOString();
          const end = endOfMonth(date).toISOString();
          return supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", start)
            .lte("created_at", end)
            .then(({ count }) => ({
              label: format(date, "MMM"),
              value: count || 0
            }));
        })),

        // 4. Booking Status Distribution
        supabase.from("reservations").select("status")
      ]);

      // Process Room Distribution
      const statusCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};
      roomsResult.data?.forEach(room => {
        statusCounts[room.status] = (statusCounts[room.status] || 0) + 1;
        typeCounts[room.room_type] = (typeCounts[room.room_type] || 0) + 1;
      });

      // Process Booking Distribution
      const bookingCounts: Record<string, number> = {};
      bookingDistResult.data?.forEach(res => {
        bookingCounts[res.status] = (bookingCounts[res.status] || 0) + 1;
      });

      return {
        revenueTrends: revenueResults,
        roomDistribution: {
          status: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
          type: Object.entries(typeCounts).map(([name, value]) => ({ name, value })),
        },
        userGrowth: userGrowthResults,
        bookingDistribution: Object.entries(bookingCounts).map(([name, value]) => ({ name, value })),
      };
    },
  });
};
