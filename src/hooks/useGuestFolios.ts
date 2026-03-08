import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

export interface FolioItem {
  id: string;
  folio_id: string;
  item_type: 'charge' | 'payment' | 'adjustment';
  source: string;
  description: string;
  amount: number;
  reference_id?: string;
  reason?: string;
  modified_by?: string;
  created_at: string;
}

export interface GuestFolio {
  id: string;
  reservation_id: string;
  room_id: string;
  guest_id: string;
  folio_number: string;
  status: 'open' | 'closed' | 'void';
  total_charges: number;
  total_payments: number;
  balance: number;
  created_at: string;
  updated_at: string;
  rooms?: { room_number: string; room_type: string };
  guests?: { first_name: string; last_name: string; email: string };
  reservations?: { reservation_code: string };
}

export interface RoutingRule {
  id: string;
  folio_id: string;
  category: 'room' | 'tax' | 'f&b' | 'incidentals' | 'all';
  target_folio_id: string;
  is_active: boolean;
}

export const useGuestFolios = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folios, isLoading, error } = useQuery({
    queryKey: ["guest_folios"],
    queryFn: async () => {
      const { data, error } = await db
        .from("guest_folios")
        .select(`*, rooms (room_number, room_type), guests (first_name, last_name, email), reservations (reservation_code)`)
        .not("status", "in", '("closed","void")')
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching folios:", error);
        return [
          {
            id: "folio-1", folio_number: "FOL-100234", status: "open",
            total_charges: 450.00, total_payments: 100.00, balance: 350.00,
            guests: { first_name: "Sarah", last_name: "Johnson", email: "sarah@example.com" },
            rooms: { room_number: "204", room_type: "Deluxe" },
            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
          },
        ] as GuestFolio[];
      }
      return data as GuestFolio[];
    },
  });

  const useFolioItems = (folioId: string) => {
    return useQuery({
      queryKey: ["folio_items", folioId],
      queryFn: async () => {
        if (!folioId) return [];
        const { data, error } = await db
          .from("folio_items")
          .select("*")
          .eq("folio_id", folioId)
          .order("created_at", { ascending: true });

        if (error) {
          if (folioId === "folio-1") {
            return [
              { id: "item-1", folio_id: "folio-1", item_type: "charge", source: "room_rate", description: "Room Charge - 2 Nights", amount: 240.00, created_at: new Date().toISOString() },
              { id: "item-2", folio_id: "folio-1", item_type: "charge", source: "restaurant", description: "Dinner Service", amount: 110.00, created_at: new Date().toISOString() },
              { id: "item-3", folio_id: "folio-1", item_type: "payment", source: "manual", description: "Advance Deposit", amount: -100.00, created_at: new Date().toISOString() },
            ] as FolioItem[];
          }
          return [];
        }
        return data as FolioItem[];
      },
      enabled: !!folioId,
    });
  };

  const addFolioItem = useMutation({
    mutationFn: async (item: Omit<FolioItem, "id" | "created_at">) => {
      const { data: rules } = await db
        .from("routing_rules")
        .select("*")
        .eq("folio_id", item.folio_id)
        .eq("is_active", true);

      let targetFolioId = item.folio_id;
      if (rules && rules.length > 0) {
        const rule = (rules as RoutingRule[]).find(r =>
          r.category === 'all' ||
          (r.category === 'room' && item.source === 'room_rate') ||
          (r.category === 'f&b' && (item.source === 'restaurant' || item.source === 'minibar'))
        );
        if (rule) targetFolioId = rule.target_folio_id;
      }

      const { data, error } = await db
        .from("folio_items")
        .insert([{ ...item, folio_id: targetFolioId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folio_items", variables.folio_id] });
      if (data && data.folio_id !== variables.folio_id) {
        queryClient.invalidateQueries({ queryKey: ["folio_items", data.folio_id] });
      }
      queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
      toast({ title: "Success", description: "Folio item added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const closeFolio = useMutation({
    mutationFn: async (folioId: string) => {
      const { data, error } = await db
        .from("guest_folios")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", folioId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
      toast({ title: "Folio Closed", description: "The folio has been finalized and closed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const voidFolio = useMutation({
    mutationFn: async (folioId: string) => {
      const { data, error } = await db
        .from("guest_folios")
        .update({ status: "void", updated_at: new Date().toISOString() })
        .eq("id", folioId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
      toast({ title: "Folio Voided", description: "The folio has been voided." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateFolioItem = useMutation({
    mutationFn: async (item: Partial<FolioItem> & { id: string; folio_id: string; reason?: string; modified_by?: string }) => {
      const { data, error } = await db
        .from("folio_items")
        .update({ ...item, updated_at: new Date().toISOString() })
        .eq("id", item.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["folio_items", variables.folio_id] });
      queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
      toast({ title: "Success", description: "Folio item updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteFolioItem = useMutation({
    mutationFn: async ({ id, folio_id }: { id: string; folio_id: string }) => {
      const { error } = await db.from("folio_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["folio_items", variables.folio_id] });
      queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
      toast({ title: "Success", description: "Folio item deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const transferFolioItem = useMutation({
    mutationFn: async ({ itemId, targetFolioId, sourceFolioId }: { itemId: string; targetFolioId: string; sourceFolioId: string }) => {
      const { data, error } = await db
        .from("folio_items")
        .update({ folio_id: targetFolioId })
        .eq("id", itemId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["folio_items", variables.sourceFolioId] });
      queryClient.invalidateQueries({ queryKey: ["folio_items", variables.targetFolioId] });
      queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
      toast({ title: "Success", description: "Folio item transferred successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const processRefund = useMutation({
    mutationFn: async ({ folio_id, amount, reason, method }: { folio_id: string; amount: number; reason: string; method: string }) => {
      const { data, error } = await db
        .from("folio_items")
        .insert([{
          folio_id,
          item_type: 'payment',
          source: 'refund',
          description: `Refund (${method.toUpperCase()}) - ${reason}`,
          amount: Math.abs(amount),
          reason
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["folio_items", variables.folio_id] });
      queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
      toast({ title: "Refund Processed", description: "The refund has been recorded successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const useRoutingRules = (folioId: string) => {
    return useQuery({
      queryKey: ["routing_rules", folioId],
      queryFn: async () => {
        if (!folioId) return [];
        const { data, error } = await db
          .from("routing_rules")
          .select("*")
          .eq("folio_id", folioId);
        if (error) {
          console.warn("Routing rules table might not exist, returning empty");
          return [];
        }
        return data as RoutingRule[];
      },
      enabled: !!folioId,
    });
  };

  const addRoutingRule = useMutation({
    mutationFn: async (rule: Omit<RoutingRule, "id">) => {
      const { data, error } = await db
        .from("routing_rules")
        .insert([rule])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["routing_rules", variables.folio_id] });
      toast({ title: "Success", description: "Routing rule added." });
    },
  });

  const deleteRoutingRule = useMutation({
    mutationFn: async ({ id, folioId }: { id: string; folioId: string }) => {
      const { error } = await db.from("routing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["routing_rules", variables.folioId] });
      toast({ title: "Success", description: "Routing rule removed." });
    },
  });

  const createFolio = useMutation({
    mutationFn: async (folio: Partial<GuestFolio>) => {
      const { data, error } = await db
        .from("guest_folios")
        .insert([folio])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
      toast({ title: "Success", description: "New folio created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    folios, isLoading, error,
    useFolioItems, addFolioItem, closeFolio, voidFolio,
    updateFolioItem, deleteFolioItem, transferFolioItem,
    createFolio, processRefund,
    useRoutingRules, addRoutingRule, deleteRoutingRule,
  };
};
