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

export interface PropertySettings {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

export interface NotificationSettings {
  new_booking_alerts: boolean;
  checkin_reminders: boolean;
  low_inventory_alerts: boolean;
  payment_notifications: boolean;
  daily_summary: boolean;
}

export interface QuickMenuSettings {
  enabled_items: string[];
}

export interface APIKey {
  name: string;
  key: string;
  description?: string;
  is_secret: boolean;
}

export interface APIKeysSettings {
  keys: APIKey[];
}

export interface UIPreferences {
  ios_materials: boolean;
  animations_enabled: boolean;
  glass_intensity: 'low' | 'medium' | 'high';
  disable_on_mobile: boolean;
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

const defaultPropertySettings: PropertySettings = {
  name: "LuxeStay Grand Hotel",
  code: "LSG-001",
  address: "123 Luxury Avenue, Downtown",
  city: "New York",
  state: "NY",
  zip: "10001",
  phone: "",
  email: "",
};

const defaultNotificationSettings: NotificationSettings = {
  new_booking_alerts: true,
  checkin_reminders: true,
  low_inventory_alerts: true,
  payment_notifications: false,
  daily_summary: true,
};

const defaultQuickMenuSettings: QuickMenuSettings = {
  enabled_items: ["1", "4", "5", "6", "12", "13"],
};

const defaultAPIKeys: APIKeysSettings = {
  keys: [],
};

const defaultUIPreferences: UIPreferences = {
  ios_materials: true,
  animations_enabled: true,
  glass_intensity: 'medium',
  disable_on_mobile: false,
};

// Generic settings fetch hook
export function useSettings<T>(key: string, defaultValue: T) {
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
export function useUpdateSettings<T>(key: string) {
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

export function usePropertySettings() {
  return useSettings<PropertySettings>("property_details", defaultPropertySettings);
}

export function useUpdatePropertySettings() {
  return useUpdateSettings<PropertySettings>("property_details");
}

export function useNotificationSettings() {
  return useSettings<NotificationSettings>("notification_settings", defaultNotificationSettings);
}

export function useUpdateNotificationSettings() {
  return useUpdateSettings<NotificationSettings>("notification_settings");
}

export function useQuickMenuSettings() {
  return useSettings<QuickMenuSettings>("quick_menu", defaultQuickMenuSettings);
}

export function useUpdateQuickMenuSettings() {
  return useUpdateSettings<QuickMenuSettings>("quick_menu");
}

export function useAPIKeysSettings() {
  return useSettings<APIKeysSettings>("api_keys", defaultAPIKeys);
}

export function useUpdateAPIKeysSettings() {
  return useUpdateSettings<APIKeysSettings>("api_keys");
}

export function useMCPConfig() {
  return useSettings<MCPConfig>("mcp_config", defaultMCPConfig);
}

export function useUpdateMCPConfig() {
  return useUpdateSettings<MCPConfig>("mcp_config");
}

export function useBusinessDate() {
  return useSettings<string>("business_date", new Date().toISOString().split("T")[0]);
}

export function useUpdateBusinessDate() {
  return useUpdateSettings<string>("business_date");
}

export function useUIPreferences() {
  return useQuery({
    queryKey: ["settings", "ui_preferences"],
    queryFn: async () => {
      // Try to get from local storage first for immediate responsiveness and RLS bypass
      const stored = localStorage.getItem("ui_preferences");
      let localPrefs: Partial<UIPreferences> | null = null;

      if (stored) {
        try {
          localPrefs = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse local UI preferences", e);
        }
      }

      // Fallback to DB but don't fail if it's restricted
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "ui_preferences")
          .maybeSingle();

        if (data?.value) {
          const dbPrefs = data.value as unknown as UIPreferences;
          // Merge with local to ensure any immediate changes are kept but DB is primary
          return { ...defaultUIPreferences, ...dbPrefs, ...localPrefs } as UIPreferences;
        }
      } catch (e) {
        console.warn("Could not fetch UI preferences from database", e);
      }

      return { ...defaultUIPreferences, ...localPrefs } as UIPreferences;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: defaultUIPreferences,
  });
}

export function useUpdateUIPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: UIPreferences) => {
      // Always save to local storage
      localStorage.setItem("ui_preferences", JSON.stringify(settings));

      // Try to save to DB but ignore RLS errors
      try {
        const { data: existing } = await supabase
          .from("settings")
          .select("id")
          .eq("key", "ui_preferences")
          .maybeSingle();

        const jsonValue: Json = settings as unknown as Json;

        if (existing) {
          await supabase
            .from("settings")
            .update({ value: jsonValue })
            .eq("key", "ui_preferences");
        } else {
          await supabase
            .from("settings")
            .insert([{ key: "ui_preferences", value: jsonValue }]);
        }
      } catch (e) {
        console.warn("Could not save UI preferences to database (likely RLS)", e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "ui_preferences"] });
      toast.success("UI preferences updated");
    },
    onError: (error) => {
      // We don't show error toast here because we successfully saved to localStorage
      console.error("Failed to sync UI preferences to server", error);
      queryClient.invalidateQueries({ queryKey: ["settings", "ui_preferences"] });
      toast.success("Preferences saved locally");
    },
  });
}
