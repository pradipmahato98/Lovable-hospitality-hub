import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api as supabase } from "@/lib/api-bridge";
import { useToast } from "@/hooks/use-toast";

export const useGuestMessages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["guest_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_messages")
        .select(`
          *,
          guests (first_name, last_name, id),
          rooms (room_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMessage = useMutation({
    mutationFn: async (message: {
      guest_id: string;
      sender_name: string;
      message_text: string;
      message_type: string;
      room_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("guest_messages")
        .insert([message])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_messages"] });
      toast({ title: "Message recorded for guest" });
    },
  });

  const updateMessageStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("guest_messages")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_messages"] });
    },
  });

  return {
    messages,
    isLoading,
    createMessage,
    updateMessageStatus
  };
};
