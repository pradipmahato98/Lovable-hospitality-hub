import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addDays, format, parseISO } from "date-fns";

export const useNightAudit = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. Fetch Business Date
  const { data: businessDate, isLoading: isDateLoading } = useQuery({
    queryKey: ["settings", "business_date"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "business_date")
        .single();

      if (error) {
        console.warn("Could not fetch business date, using default:", error);
        return format(new Date(), "yyyy-MM-dd");
      }
      return (data.value as string); // Expected format: "YYYY-MM-DD"
    },
    initialData: format(new Date(), "yyyy-MM-dd"),
  });

  // 2. Fetch Pending Arrivals for the current business date
  const usePendingArrivals = (date: string) => useQuery({
    queryKey: ["reservations", "pending", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          guests (first_name, last_name)
        `)
        .eq("check_in_date", date)
        .eq("status", "confirmed");

      if (error) throw error;
      return data;
    },
    enabled: !!date
  });

  // 3. Fetch Stay-overs (already checked in)
  const useStayOvers = (date: string) => useQuery({
    queryKey: ["reservations", "stayovers", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          guests (first_name, last_name),
          rooms (room_number, price_per_night)
        `)
        .eq("status", "checked-in")
        .lte("check_in_date", date)
        .gt("check_out_date", date);

      if (error) throw error;
      return data;
    },
    enabled: !!date
  });

  // 4. Fetch Due-outs (supposed to check out today but still checked-in)
  const useDueOuts = (date: string) => useQuery({
    queryKey: ["reservations", "due-outs", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          guests (first_name, last_name),
          rooms (room_number)
        `)
        .eq("status", "checked-in")
        .eq("check_out_date", date);

      if (error) throw error;
      return data;
    },
    enabled: !!date
  });

  // 5. Fetch Room Status Summary
  const useRoomStatusSummary = () => useQuery({
    queryKey: ["rooms", "status-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("status");

      if (error) throw error;

      const summary = data.reduce((acc: Record<string, number>, room) => {
        acc[room.status] = (acc[room.status] || 0) + 1;
        return acc;
      }, {});

      return summary;
    }
  });

  // 6. Fetch POS Summary for the business date
  const usePosSummary = (date: string) => useQuery({
    queryKey: ["pos", "summary", date],
    queryFn: async () => {
      // Get all transactions for the date
      const { data, error } = await supabase
        .from("pos_transactions")
        .select("total, payment_method")
        .gte("created_at", `${date}T00:00:00`)
        .lte("created_at", `${date}T23:59:59`);

      if (error) throw error;

      const summary = data.reduce((acc: any, trans) => {
        const method = trans.payment_method || 'Other';
        if (!acc[method]) acc[method] = { count: 0, total: 0 };
        acc[method].count += 1;
        acc[method].total += Number(trans.total);
        return acc;
      }, {});

      return summary;
    },
    enabled: !!date
  });

  // 7. Mutation: Post Daily Room Charges
  const postCharges = useMutation({
    mutationFn: async (date: string) => {
      const { data, error } = await supabase.rpc('post_daily_room_charges', {
        v_business_date: date
      });
      if (error) throw error;
      return data[0]; // { posted_count, total_revenue }
    }
  });

  // 8. Mutation: Close Day & Increment Business Date
  const closeDay = useMutation({
    mutationFn: async ({ currentDate, log }: { currentDate: string, log: {
      total_charges_posted: number;
      total_room_revenue: number;
      occupancy_rate: number;
    } }) => {
      const nextDate = format(addDays(parseISO(currentDate), 1), "yyyy-MM-dd");

      // Update business date in settings
      const { error: settingsError } = await supabase
        .from("settings")
        .update({ value: nextDate })
        .eq("key", "business_date");

      if (settingsError) throw settingsError;

      // Create Audit Log
      const { error: logError } = await supabase
        .from("night_audit_logs")
        .insert([{
          business_date: currentDate,
          ...log,
          status: 'completed'
        }]);

      if (logError) throw logError;

      return nextDate;
    },
    onSuccess: (nextDate) => {
      queryClient.invalidateQueries({ queryKey: ["settings", "business_date"] });
      toast({
        title: "Day Closed Successfully",
        description: `Business date is now ${nextDate}.`,
      });
    }
  });

  // 9. Mutation: Record Day Close (Front Office Cashiering)
  const recordDayClose = useMutation({
    mutationFn: async (log: {
      business_date: string;
      total_revenue: number;
      dept_summaries: any;
    }) => {
      const { data, error } = await supabase
        .from("day_close_logs")
        .insert([log])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day_close_logs"] });
      toast({
        title: "Day Close Recorded",
        description: "Cashiering day has been successfully closed and recorded.",
      });
    }
  });

  // 10. Fetch Day Close Logs
  const useDayCloseLogs = () => useQuery({
    queryKey: ["day_close_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("day_close_logs")
        .select("*")
        .order("business_date", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  return {
    businessDate,
    isDateLoading,
    usePendingArrivals,
    useStayOvers,
    useDueOuts,
    useRoomStatusSummary,
    usePosSummary,
    postCharges,
    closeDay,
    recordDayClose,
    useDayCloseLogs
  };
};
