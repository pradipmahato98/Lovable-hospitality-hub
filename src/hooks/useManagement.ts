import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ManagementKPIs {
  occupancy: number;
  adr: number;
  revpar: number;
  totalRevenue: number;
  roomRevenue: number;
  fbRevenue: number;
  otherRevenue: number;
  marketSegmentation: { name: string; value: number }[];
  guestMovement: { label: string; count: number }[];
  comparisons: {
    yesterday: Partial<ManagementKPIs>;
    lastYear: Partial<ManagementKPIs>;
    budget: Partial<ManagementKPIs>;
  };
}

export const useManagement = (date: Date = new Date()) => {
  const dateStr = date.toISOString().split("T")[0];
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const lastYear = new Date(date);
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  const lastYearStr = lastYear.toISOString().split("T")[0];

  // For filtering: we need reservations that overlap with our key dates
  // (Today, Yesterday, Last Year)
  const filterDates = [dateStr, yesterdayStr, lastYearStr];

  return useQuery({
    queryKey: ["management_kpis", dateStr],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    queryFn: async () => {
      // 1. Fetch Reservations (Filtered to avoid loading entire table)
      const { data: reservations, error: resError } = await (supabase as any)
        .from("reservations")
        .select(`
          id, total_amount, check_in_date, check_out_date, status,
          market_segment, is_walk_in, is_complimentary, no_show_at
        `)
        .or(`check_in_date.in.(${filterDates.join(',')}),status.eq.checked_in`);
      if (resError) throw resError;

      // 2. Fetch Rooms
      const { data: rooms, error: roomsError } = await (supabase as any)
        .from("rooms")
        .select("id, status, is_out_of_order, is_under_maintenance");
      if (roomsError) throw roomsError;

      // 3. Fetch POS transactions (Filtered)
      const { data: posTrans, error: posError } = await (supabase as any)
        .from("pos_transactions")
        .select("total, created_at")
        .or(`created_at.ilike.${dateStr}%,created_at.ilike.${yesterdayStr}%,created_at.ilike.${lastYearStr}%`);
      if (posError) throw posError;

      // 4. Fetch Banquet Events
      const { data: banquetEvents, error: banquetError } = await (supabase as any)
        .from("banquet_events")
        .select("id, total_amount, event_date, status")
        .eq("event_date", dateStr);
      if (banquetError) throw banquetError;

      // 5. Fetch Targets
      const { data: targets, error: targetError } = await (supabase as any)
        .from("daily_revenue_targets")
        .select("*")
        .eq("target_date", dateStr)
        .maybeSingle();
      if (targetError) console.error("Error fetching targets:", targetError);

      const calculateStats = (targetDateStr: string) => {
        const todayRes = reservations.filter((r: any) =>
          r.check_in_date === targetDateStr ||
          (r.status === 'checked_in' && r.check_in_date <= targetDateStr && r.check_out_date > targetDateStr)
        );
        const confirmedToday = todayRes.filter((r: any) => r.status !== 'cancelled');

        const totalRooms = rooms.length;
        const oooRooms = rooms.filter((r: any) => r.is_out_of_order || r.status === 'out_of_order' || r.is_under_maintenance).length;
        const roomsSold = confirmedToday.length;

        const houseOccupancy = totalRooms > 0 ? (roomsSold / totalRooms) * 100 : 0;
        const roomRevenue = confirmedToday.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0);
        const adr = roomsSold > 0 ? roomRevenue / roomsSold : 0;
        const revpar = totalRooms > 0 ? roomRevenue / totalRooms : 0;

        const fbRevenue = posTrans
          .filter((t: any) => t.created_at.startsWith(targetDateStr))
          .reduce((sum: number, t: any) => sum + (t.total || 0), 0);

        const banquetRevenue = banquetEvents
          .filter((e: any) => e.event_date === targetDateStr && e.status !== 'cancelled')
          .reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0);

        return {
          occupancy: Math.round(houseOccupancy * 10) / 10,
          adr: Math.round(adr * 100) / 100,
          revpar: Math.round(revpar * 100) / 100,
          totalRevenue: roomRevenue + fbRevenue + banquetRevenue,
          roomRevenue,
          fbRevenue,
          banquetRevenue,
          oooRooms,
          totalRooms,
          roomsSold,
        };
      };

      const todayStats = calculateStats(dateStr);
      const yesterdayStats = calculateStats(yesterdayStr);
      const lastYearStats = calculateStats(lastYearStr);

      // Market Segmentation (Today)
      const confirmedToday = reservations.filter((r: any) =>
        (r.check_in_date === dateStr || (r.status === 'checked_in' && r.check_in_date <= dateStr && r.check_out_date > dateStr)) &&
        r.status !== 'cancelled'
      );
      const segments: Record<string, number> = {};
      confirmedToday.forEach((r: any) => {
        const seg = r.market_segment || 'Other';
        segments[seg] = (segments[seg] || 0) + 1;
      });

      // Guest Movement (Today)
      const movement = {
        arrivals: reservations.filter((r: any) => r.check_in_date === dateStr).length,
        departures: reservations.filter((r: any) => r.check_out_date === dateStr).length,
        noShows: reservations.filter((r: any) => r.no_show_at?.startsWith(dateStr)).length,
        walkIns: confirmedToday.filter((r: any) => r.is_walk_in).length,
      };

      const todayPosTransactions = posTrans.filter((t: any) => t.created_at.startsWith(dateStr)).length;

      return {
        ...todayStats,
        otherRevenue: todayStats.banquetRevenue, // Keep otherRevenue for compatibility
        banquetEventsCount: banquetEvents.filter(e => e.event_date === dateStr).length,
        posTransactionsCount: todayPosTransactions,
        marketSegmentation: Object.entries(segments).map(([name, value]) => ({ name, value })),
        guestMovement: Object.entries(movement).map(([label, count]) => ({ label, count })),
        comparisons: {
          yesterday: yesterdayStats,
          lastYear: lastYearStats,
          budget: targets ? {
            totalRevenue: Number(targets.room_revenue_target) + Number(targets.fb_revenue_target) + Number(targets.other_revenue_target),
            roomRevenue: Number(targets.room_revenue_target),
            fbRevenue: Number(targets.fb_revenue_target),
            occupancy: Number(targets.occupancy_target_pct),
          } : {},
        }
      } as ManagementKPIs;
    },
  });
};
