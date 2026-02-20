import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const query = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
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
          guest_id,
          room_id,
          guest:guests(first_name, last_name),
          room:rooms(room_number, room_type)
        `)
        .order("check_in_date", { ascending: false });

      if (error) throw error;
      return data as unknown as Reservation[];
    },
      if (fetchError) throw fetchError;
      return data as unknown as Reservation[];
    },
    staleTime: 30 * 1000,
  });

  const filterReservations = (queryStr: string) => {
    const reservations = query.data || [];
    if (!queryStr) return reservations;
    const searchLower = queryStr.toLowerCase();
    return reservations.filter((res) =>
      res.reservation_code.toLowerCase().includes(searchLower) ||
      `${res.guest?.first_name} ${res.guest?.last_name}`.toLowerCase().includes(searchLower) ||
      res.room?.room_number.toLowerCase().includes(searchLower)
    );
  };

  return {
    reservations: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    reservations,
    isLoading,
    error,
    refetch,
    filterReservations,
    data: query.data || [], // Compatibility with FrontDesk.tsx
  };
};

export const useUpdateReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Reservation>) => {
      const { data, error } = await supabase
        .from("reservations")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
};
