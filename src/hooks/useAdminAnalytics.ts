import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-bridge";
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
        Promise.all(Array.from({ length: 6 }, async (_, i) => {
          const date = subMonths(new Date(), 5 - i);
          const start = startOfMonth(date).toISOString();
          const end = endOfMonth(date).toISOString();
          const { data } = await api.from("reservations")
            .select("total_amount")
            .gte("created_at", start)
            .lte("created_at", end);

          return {
            label: format(date, "MMM"),
            value: (data || []).reduce((sum: number, res: any) => sum + Number(res.total_amount || 0), 0)
          };
        })),

        // 2. Room Distribution
        api.from("rooms").select("status, room_type"),

        // 3. User Growth (last 6 months)
        Promise.all(Array.from({ length: 6 }, async (_, i) => {
          const date = subMonths(new Date(), 5 - i);
          const start = startOfMonth(date).toISOString();
          const end = endOfMonth(date).toISOString();
          const { data } = await api.from("profiles")
            .select("*")
            .gte("created_at", start)
            .lte("created_at", end);
          return {
            label: format(date, "MMM"),
            value: (data as any[])?.length || 0
          };
        })),

        // 4. Booking Status Distribution
        api.from("reservations").select("status")
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
