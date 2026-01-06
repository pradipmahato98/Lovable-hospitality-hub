import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
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
      setReservations(data as unknown as Reservation[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch reservations"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

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
    refetch: fetchReservations,
    filterReservations,
  };
};
