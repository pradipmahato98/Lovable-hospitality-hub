import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGuestFolios } from "./useGuestFolios";
import { toast } from "sonner";

export const useChargeToRoom = () => {
  const queryClient = useQueryClient();
  const { addFolioItem } = useGuestFolios();

  return useMutation({
    mutationFn: async ({
      roomNumber,
      amount,
      description,
      referenceId,
      source = 'restaurant'
    }: {
      roomNumber: string;
      amount: number;
      description: string;
      referenceId: string;
      source?: string;
    }) => {
      // 1. Find the occupied room
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("id")
        .eq("room_number", roomNumber)
        .eq("status", "occupied")
        .maybeSingle();

      if (roomError || !room) throw new Error("Room not found or not occupied");

      // 2. Find the active folio
      const { data: folio, error: folioError } = await supabase
        .from("guest_folios")
        .select("id")
        .eq("room_id", room.id)
        .eq("status", "open")
        .maybeSingle();

      if (folioError || !folio) throw new Error("No active folio found for this room");

      // 3. Post the charge
      return await addFolioItem.mutateAsync({
        folio_id: folio.id,
        item_type: 'charge',
        source: source,
        description: description,
        amount: amount,
        reference_id: referenceId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
      toast.success("Charge posted to room successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to post charge to room: ${error.message}`);
    }
  });
};
