import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface Reservation {
  id: string;
  reservation_code: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: number;
  guest: {
    first_name: string;
    last_name: string;
  } | null;
  room: {
    room_number: string;
    room_type: string;
  } | null;
}

export const useReservations = () => {
  const { data: reservations = [], isLoading, error, refetch } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from("reservations")
        .select(`
          id,
          reservation_code,
          check_in_date,
          check_out_date,
          status,
          total_amount,
          guest:guests(first_name, last_name),
          room:rooms(room_number, room_type)
        `)
        .order("check_in_date", { ascending: false });

      if (fetchError) throw fetchError;
      return data as unknown as Reservation[];
    },
    staleTime: 30 * 1000,
  });

  const filterReservations = useCallback((query: string) => {
    if (!query) return reservations;
    const searchLower = query.toLowerCase();
    return reservations.filter((res) =>
      res.reservation_code.toLowerCase().includes(searchLower) ||
      `${res.guest?.first_name} ${res.guest?.last_name}`.toLowerCase().includes(searchLower) ||
      res.room?.room_number.toLowerCase().includes(searchLower)
    );
  }, [reservations]);

  return {
    reservations,
    isLoading,
    error,
    refetch,
    filterReservations,
  };
};
