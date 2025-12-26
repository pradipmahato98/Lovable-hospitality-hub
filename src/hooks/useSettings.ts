import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

// Type definitions for all settings
export interface CheckInFieldSettings {
  id_required: boolean;
  phone_required: boolean;
  email_required: boolean;
}

export interface PaymentSettings {
  cash_enabled: boolean;
  card_enabled: boolean;
  bank_transfer_enabled: boolean;
  require_deposit: boolean;
  deposit_percentage: number;
}

export interface BookingSource {
  id: string;
  name: string;
  enabled: boolean;
  commission_percentage: number;
}

export interface BookingSourcesSettings {
  sources: BookingSource[];
}

export interface RatePlan {
  id: string;
  name: string;
  description: string;
  discount_percentage: number;
  enabled: boolean;
}

export interface RatePlansSettings {
  plans: RatePlan[];
}

// Default values
const defaultCheckInSettings: CheckInFieldSettings = {
  id_required: true,
  phone_required: false,
  email_required: false,
};

const defaultPaymentSettings: PaymentSettings = {
  cash_enabled: true,
  card_enabled: true,
  bank_transfer_enabled: false,
  require_deposit: false,
  deposit_percentage: 20,
};

const defaultBookingSources: BookingSourcesSettings = {
  sources: [
    { id: "direct", name: "Direct Booking", enabled: true, commission_percentage: 0 },
    { id: "booking_com", name: "Booking.com", enabled: true, commission_percentage: 15 },
    { id: "expedia", name: "Expedia", enabled: false, commission_percentage: 18 },
    { id: "airbnb", name: "Airbnb", enabled: false, commission_percentage: 3 },
  ],
};

const defaultRatePlans: RatePlansSettings = {
  plans: [
    { id: "standard", name: "Standard Rate", description: "Regular pricing", discount_percentage: 0, enabled: true },
    { id: "early_bird", name: "Early Bird", description: "Book 30+ days in advance", discount_percentage: 15, enabled: true },
    { id: "last_minute", name: "Last Minute", description: "Book within 48 hours", discount_percentage: 10, enabled: false },
    { id: "weekly", name: "Weekly Stay", description: "7+ night stays", discount_percentage: 20, enabled: true },
  ],
};

// Generic settings fetch hook
function useSettings<T>(key: string, defaultValue: T) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();

      if (error) throw error;
      if (!data) return defaultValue;
      return data.value as unknown as T;
    },
  });
}

// Generic settings update hook
function useUpdateSettings<T>(key: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: T) => {
      const { data: existing } = await supabase
        .from("settings")
        .select("id")
        .eq("key", key)
        .maybeSingle();

      const jsonValue: Json = settings as unknown as Json;

      if (existing) {
        const { error } = await supabase
          .from("settings")
          .update({ value: jsonValue })
          .eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("settings")
          .insert([{ key, value: jsonValue }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", key] });
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });
}

// Specific hooks for each settings category
export function useCheckInSettings() {
  return useSettings<CheckInFieldSettings>("check_in_fields", defaultCheckInSettings);
}

export function useUpdateCheckInSettings() {
  return useUpdateSettings<CheckInFieldSettings>("check_in_fields");
}

export function usePaymentSettings() {
  return useSettings<PaymentSettings>("payment_settings", defaultPaymentSettings);
}

export function useUpdatePaymentSettings() {
  return useUpdateSettings<PaymentSettings>("payment_settings");
}

export function useBookingSourcesSettings() {
  return useSettings<BookingSourcesSettings>("booking_sources", defaultBookingSources);
}

export function useUpdateBookingSourcesSettings() {
  return useUpdateSettings<BookingSourcesSettings>("booking_sources");
}

export function useRatePlansSettings() {
  return useSettings<RatePlansSettings>("rate_plans", defaultRatePlans);
}

export function useUpdateRatePlansSettings() {
  return useUpdateSettings<RatePlansSettings>("rate_plans");
}
