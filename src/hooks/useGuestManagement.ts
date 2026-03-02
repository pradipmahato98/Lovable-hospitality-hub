import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { generateSecureNumericString } from "@/utils/security";

// ============= Types =============
export interface GuestPreference {
  id: string;
  guest_id: string;
  category: string;
  preference_key: string;
  preference_value: string | null;
  created_at: string;
}

export interface GuestFeedback {
  id: string;
  guest_id: string | null;
  reservation_id: string | null;
  feedback_type: string;
  department: string | null;
  rating: number | null;
  title: string | null;
  message: string;
  status: string;
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  guest?: { first_name: string; last_name: string };
}

export interface LoyaltyMember {
  id: string;
  guest_id: string;
  member_number: string;
  tier: string;
  points_balance: number;
  lifetime_points: number;
  join_date: string;
  tier_expiry: string | null;
  is_active: boolean;
  inactive_date: string | null;
  referred_by: string | null;
  property_name: string | null;
  journey_start_date: string | null;
  created_at: string;
  guest?: { first_name: string; last_name: string; email: string | null };
}

export interface LoyaltyTransaction {
  id: string;
  member_id: string;
  transaction_type: string;
  points: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface GuestCommunication {
  id: string;
  guest_id: string;
  channel: string;
  direction: string;
  subject: string | null;
  message: string;
  status: string;
  sent_by: string | null;
  created_at: string;
}

export interface GuestAuditLog {
  id: string;
  guest_id: string;
  staff_id: string | null;
  staff_name: string | null;
  action: string;
  details: any;
  created_at: string;
}

export interface GuestDocument {
  id: string;
  guest_id: string;
  document_type: string | null;
  document_number: string | null;
  document_image_url: string | null;
  is_latest: boolean;
  created_at: string;
  created_by: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ============= Guest Preferences =============
export function useGuestPreferences(guestId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["guest-preferences", guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await db
        .from("guest_preferences")
        .select("*")
        .eq("guest_id", guestId)
        .order("category");
      if (error) throw error;
      return data as GuestPreference[];
    },
    enabled: !!guestId,
  });

  const setPreference = useMutation({
    mutationFn: async ({ category, key, value }: { category: string; key: string; value: string }) => {
      const { data, error } = await db
        .from("guest_preferences")
        .upsert({ guest_id: guestId, category, preference_key: key, preference_value: value }, { onConflict: "guest_id,category,preference_key" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-preferences", guestId] }),
  });

  return { ...query, setPreference };
}

// ============= Guest Feedback =============
export function useGuestFeedback(filters?: { status?: string; type?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["guest-feedback", filters],
    queryFn: async () => {
      let q = db
        .from("guest_feedback")
        .select(`*, guest:guests(first_name, last_name)`)
        .order("created_at", { ascending: false });

      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.type) q = q.eq("feedback_type", filters.type);

      const { data, error } = await q;
      if (error) throw error;
      return data as GuestFeedback[];
    },
  });

  const createFeedback = useMutation({
    mutationFn: async (feedback: Omit<GuestFeedback, "id" | "created_at" | "guest">) => {
      const { data, error } = await db.from("guest_feedback").insert(feedback).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-feedback"] }),
  });

  const respondToFeedback = useMutation({
    mutationFn: async ({ id, response, respondedBy }: { id: string; response: string; respondedBy: string }) => {
      const { data, error } = await db
        .from("guest_feedback")
        .update({ response, responded_by: respondedBy, responded_at: new Date().toISOString(), status: "resolved" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-feedback"] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await db.from("guest_feedback").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-feedback"] }),
  });

  return { ...query, createFeedback, respondToFeedback, updateStatus };
}

// ============= Loyalty Program =============
export function useLoyaltyMembers(tier?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["loyalty-members", tier],
    queryFn: async () => {
      let q = db
        .from("loyalty_members")
        .select(`*, guest:guests(first_name, last_name, email)`)
        .eq("is_active", true)
        .order("lifetime_points", { ascending: false });

      if (tier) q = q.eq("tier", tier);

      const { data, error } = await q;
      if (error) throw error;
      return data as LoyaltyMember[];
    },
  });

  const enrollMember = useMutation({
    mutationFn: async (guestId: string) => {
      const memberNumber = `LM${generateSecureNumericString(10)}`;
      const { data, error } = await db
        .from("loyalty_members")
        .insert({ guest_id: guestId, member_number: memberNumber })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["loyalty-members"] }),
  });

  const addPoints = useMutation({
    mutationFn: async ({ memberId, points, description, referenceType, referenceId }: { memberId: string; points: number; description: string; referenceType?: string; referenceId?: string }) => {
      // Get current balance
      const { data: member, error: fetchError } = await db.from("loyalty_members").select("points_balance, lifetime_points").eq("id", memberId).single();
      if (fetchError) throw fetchError;

      // Update balance
      const { error: updateError } = await db
        .from("loyalty_members")
        .update({ points_balance: member.points_balance + points, lifetime_points: member.lifetime_points + points })
        .eq("id", memberId);
      if (updateError) throw updateError;

      // Record transaction
      const { error: txError } = await db.from("loyalty_transactions").insert({
        member_id: memberId,
        transaction_type: "earn",
        points,
        description,
        reference_type: referenceType,
        reference_id: referenceId,
      });
      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-members"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-transactions"] });
    },
  });

  const redeemPoints = useMutation({
    mutationFn: async ({ memberId, points, description }: { memberId: string; points: number; description: string }) => {
      const { data: member, error: fetchError } = await db.from("loyalty_members").select("points_balance").eq("id", memberId).single();
      if (fetchError) throw fetchError;
      if (member.points_balance < points) throw new Error("Insufficient points");

      const { error: updateError } = await db
        .from("loyalty_members")
        .update({ points_balance: member.points_balance - points })
        .eq("id", memberId);
      if (updateError) throw updateError;

      const { error: txError } = await db.from("loyalty_transactions").insert({
        member_id: memberId,
        transaction_type: "redeem",
        points: -points,
        description,
      });
      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-members"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-transactions"] });
    },
  });

  return { ...query, enrollMember, addPoints, redeemPoints };
}

export function useGuestLoyalty(guestId: string | undefined) {
  return useQuery({
    queryKey: ["guest-loyalty", guestId],
    queryFn: async () => {
      if (!guestId) return null;
      const { data, error } = await db
        .from("loyalty_members")
        .select(`*, guest:guests(first_name, last_name, email)`)
        .eq("guest_id", guestId)
        .maybeSingle();
      if (error) throw error;
      return data as LoyaltyMember | null;
    },
    enabled: !!guestId,
  });
}

export function useLoyaltyTransactions(memberId: string) {
  return useQuery({
    queryKey: ["loyalty-transactions", memberId],
    queryFn: async () => {
      const { data, error } = await db
        .from("loyalty_transactions")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
    enabled: !!memberId,
  });
}

// ============= Guest Communications =============
export function useGuestCommunications(guestId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["guest-communications", guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await db
        .from("guest_communications")
        .select("*")
        .eq("guest_id", guestId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GuestCommunication[];
    },
    enabled: !!guestId,
  });

  const logCommunication = useMutation({
    mutationFn: async (comm: Omit<GuestCommunication, "id" | "created_at">) => {
      const { data, error } = await db.from("guest_communications").insert(comm).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-communications", guestId] }),
  });

  return { ...query, logCommunication };
}

// ============= Guest Audit Logs =============
export function useGuestAuditLogs(guestId: string | undefined) {
  return useQuery({
    queryKey: ["guest-audit-logs", guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await db
        .from("guest_audit_logs")
        .select("*")
        .eq("guest_id", guestId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GuestAuditLog[];
    },
    enabled: !!guestId,
  });
}

// ============= Guest Documents =============
export function useGuestDocuments(guestId: string | undefined) {
  return useQuery({
    queryKey: ["guest-documents", guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await db
        .from("guest_documents")
        .select("*")
        .eq("guest_id", guestId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GuestDocument[];
    },
    enabled: !!guestId,
  });
}

export function useAddGuestDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guestId, doc, staffName }: { guestId: string; doc: Partial<GuestDocument>; staffName?: string }) => {
      // 1. Mark existing as not latest
      await db
        .from("guest_documents")
        .update({ is_latest: false })
        .eq("guest_id", guestId);

      // 2. Insert new document
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await db
        .from("guest_documents")
        .insert({
          ...doc,
          guest_id: guestId,
          is_latest: true,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Update main guest table
      // 🛡️ Sentinel: Encrypting ID number for E2EE consistency
      const encryptedId = doc.document_number
        ? await api.encryptGuestId(doc.document_number)
        : doc.document_number;

      await db
        .from("guests")
        .update({
          id_type: doc.document_type,
          id_number: encryptedId,
          id_image_url: doc.document_image_url,
        })
        .eq("id", guestId);

      // 4. Log audit
      await db.from("guest_audit_logs").insert({
        guest_id: guestId,
        staff_id: userData.user?.id,
        staff_name: staffName || userData.user?.email,
        action: "update_id_card",
        details: { new_id: doc.document_number, type: doc.document_type },
      });

      return data as GuestDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["guest-documents", data.guest_id] });
      queryClient.invalidateQueries({ queryKey: ["guest", data.guest_id] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      queryClient.invalidateQueries({ queryKey: ["guest-audit-logs", data.guest_id] });
    },
  });
}

// ============= Merge Guests =============
export function useMergeGuests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceGuestId, targetGuestId }: { sourceGuestId: string; targetGuestId: string }) => {
      console.log(`Merging guest ${sourceGuestId} into ${targetGuestId}`);

      // 1. Tables where we simply update the guest_id
      const tablesToUpdate = [
        "reservations",
        "guest_folios",
        "guest_communications",
        "guest_feedback",
        "invoices",
        "payments",
        "lost_and_found",
        "front_desk_queue",
        "guest_messages",
        "guest_audit_logs",
        "guest_documents"
      ];

      for (const table of tablesToUpdate) {
        const { error } = await supabase
          .from(table)
          .update({ guest_id: targetGuestId })
          .eq("guest_id", sourceGuestId);

        if (error) {
          console.warn(`Failed to migrate ${table}:`, error);
          // We continue with other tables even if one fails (e.g. if table doesn't exist)
        }
      }

      // 2. Guest Preferences (handle potential duplicates)
      const { data: sourcePrefs } = await db.from("guest_preferences").select("*").eq("guest_id", sourceGuestId);
      if (sourcePrefs && sourcePrefs.length > 0) {
        for (const pref of sourcePrefs) {
          // Try to upsert to target
          await db.from("guest_preferences").upsert({
            guest_id: targetGuestId,
            category: pref.category,
            preference_key: pref.preference_key,
            preference_value: pref.preference_value
          }, { onConflict: "guest_id,category,preference_key" });
        }
        // Delete source prefs
        await db.from("guest_preferences").delete().eq("guest_id", sourceGuestId);
      }

      // 3. Loyalty Program
      const { data: sourceLoyalty } = await db.from("loyalty_members").select("*").eq("guest_id", sourceGuestId).maybeSingle();
      if (sourceLoyalty) {
        const { data: targetLoyalty } = await db.from("loyalty_members").select("*").eq("guest_id", targetGuestId).maybeSingle();
        if (targetLoyalty) {
          // Merge points if both exist
          const newBalance = (targetLoyalty.points_balance || 0) + (sourceLoyalty.points_balance || 0);
          const newLifetime = (targetLoyalty.lifetime_points || 0) + (sourceLoyalty.lifetime_points || 0);

          await db.from("loyalty_members").update({
            points_balance: newBalance,
            lifetime_points: newLifetime
          }).eq("id", targetLoyalty.id);

          // Move transactions
          await db.from("loyalty_transactions").update({ member_id: targetLoyalty.id }).eq("member_id", sourceLoyalty.id);

          // Delete source loyalty
          await db.from("loyalty_members").delete().eq("id", sourceLoyalty.id);
        } else {
          // Move loyalty member to target guest
          await db.from("loyalty_members").update({ guest_id: targetGuestId }).eq("id", sourceLoyalty.id);
        }
      }

      // 4. Finally, delete the source guest
      const { error: deleteError } = await supabase
        .from("guests")
        .delete()
        .eq("id", sourceGuestId);

      if (deleteError) throw deleteError;

      return { success: true };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      queryClient.invalidateQueries({ queryKey: ["guest", variables.targetGuestId] });
      queryClient.invalidateQueries({ queryKey: ["guest-loyalty", variables.targetGuestId] });
      queryClient.invalidateQueries({ queryKey: ["guest-preferences", variables.targetGuestId] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

// ============= Stats =============
export function useGuestStats() {
  const { data: feedback } = useGuestFeedback();
  const { data: members } = useLoyaltyMembers();

  return useMemo(() => {
    const feedbackList = feedback || [];
    const memberList = members || [];
    const ratedFeedback = feedbackList.filter((f) => f.rating);

    return {
      totalFeedback: feedbackList.length,
      pendingFeedback: feedbackList.filter((f) => f.status === "pending").length,
      avgRating: ratedFeedback.length > 0
        ? ratedFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / ratedFeedback.length
        : 0,
      loyaltyMembers: memberList.length,
      platinumMembers: memberList.filter((m) => m.tier === "platinum").length,
      goldMembers: memberList.filter((m) => m.tier === "gold").length,
    };
  }, [feedback, members]);
}
