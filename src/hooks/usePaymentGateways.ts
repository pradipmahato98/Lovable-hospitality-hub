// Nepal Payment Gateway Hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  is_configured: boolean;
  logo_url?: string;
  description: string;
  api_key?: string;
  secret_key?: string;
  merchant_id?: string;
  sandbox_mode: boolean;
  webhook_url?: string;
}

export interface PaymentGatewaysSettings {
  gateways: PaymentGatewayConfig[];
}

// Nepal Payment Gateways
const defaultPaymentGateways: PaymentGatewaysSettings = {
  gateways: [
    {
      id: "esewa",
      name: "eSewa",
      code: "ESEWA",
      enabled: false,
      is_configured: false,
      description: "Nepal's leading digital wallet and payment platform",
      sandbox_mode: true,
    },
    {
      id: "khalti",
      name: "Khalti",
      code: "KHALTI",
      enabled: false,
      is_configured: false,
      description: "Digital wallet for online payments in Nepal",
      sandbox_mode: true,
    },
    {
      id: "imepay",
      name: "IME Pay",
      code: "IMEPAY",
      enabled: false,
      is_configured: false,
      description: "Mobile wallet by IME Group Nepal",
      sandbox_mode: true,
    },
    {
      id: "connectips",
      name: "Connect IPS",
      code: "CONNECTIPS",
      enabled: false,
      is_configured: false,
      description: "Nepal Clearing House interbank payment system",
      sandbox_mode: true,
    },
    {
      id: "fonepay",
      name: "Fonepay",
      code: "FONEPAY",
      enabled: false,
      is_configured: false,
      description: "Digital payment network for Nepal banks",
      sandbox_mode: true,
    },
    {
      id: "prabhupay",
      name: "Prabhu Pay",
      code: "PRABHUPAY",
      enabled: false,
      is_configured: false,
      description: "Mobile wallet by Prabhu Group",
      sandbox_mode: true,
    },
    {
      id: "nicasia_bank",
      name: "NIC Asia Bank",
      code: "NICASIA",
      enabled: false,
      is_configured: false,
      description: "Online banking payment gateway",
      sandbox_mode: true,
    },
  ],
};

export function usePaymentGateways() {
  return useQuery({
    queryKey: ["settings", "payment_gateways"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "payment_gateways")
        .maybeSingle();

      if (error) throw error;
      if (!data) return defaultPaymentGateways;
      
      // Merge with defaults to ensure new gateways are included
      const storedGateways = data.value as unknown as PaymentGatewaysSettings;
      const mergedGateways = defaultPaymentGateways.gateways.map(defaultGw => {
        const stored = storedGateways.gateways?.find(g => g.id === defaultGw.id);
        return stored ? { ...defaultGw, ...stored } : defaultGw;
      });
      
      return { gateways: mergedGateways };
    },
  });
}

export function useUpdatePaymentGateway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gateway: PaymentGatewayConfig) => {
      // Fetch current gateways
      const { data: existing } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "payment_gateways")
        .maybeSingle();

      let currentGateways = defaultPaymentGateways.gateways;
      if (existing?.value) {
        const stored = existing.value as unknown as PaymentGatewaysSettings;
        currentGateways = stored.gateways || currentGateways;
      }

      // Update the specific gateway
      const updatedGateways = currentGateways.map(g => 
        g.id === gateway.id ? gateway : g
      );

      // Check if gateway exists, if not add it
      if (!updatedGateways.find(g => g.id === gateway.id)) {
        updatedGateways.push(gateway);
      }

      const jsonValue: Json = { gateways: updatedGateways } as unknown as Json;

      if (existing) {
        const { error } = await supabase
          .from("settings")
          .update({ value: jsonValue })
          .eq("key", "payment_gateways");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("settings")
          .insert([{ key: "payment_gateways", value: jsonValue }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "payment_gateways"] });
      toast.success("Payment gateway updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update gateway: " + error.message);
    },
  });
}

export function useTogglePaymentGateway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gatewayId, enabled }: { gatewayId: string; enabled: boolean }) => {
      const { data: existing } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "payment_gateways")
        .maybeSingle();

      let currentGateways = defaultPaymentGateways.gateways;
      if (existing?.value) {
        const stored = existing.value as unknown as PaymentGatewaysSettings;
        currentGateways = stored.gateways || currentGateways;
      }

      const updatedGateways = currentGateways.map(g =>
        g.id === gatewayId ? { ...g, enabled } : g
      );

      const jsonValue: Json = { gateways: updatedGateways } as unknown as Json;

      if (existing) {
        const { error } = await supabase
          .from("settings")
          .update({ value: jsonValue })
          .eq("key", "payment_gateways");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("settings")
          .insert([{ key: "payment_gateways", value: jsonValue }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "payment_gateways"] });
    },
    onError: (error) => {
      toast.error("Failed to toggle gateway: " + error.message);
    },
  });
}

// Process payment through a gateway (placeholder for actual implementation)
export async function processPayment(
  gatewayId: string,
  amount: number,
  currency: string = "NPR",
  orderRef: string,
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  }
): Promise<{
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
  error?: string;
}> {
  // This is a placeholder - actual implementation will call the respective gateway APIs
  console.log(`Processing payment via ${gatewayId}:`, { amount, currency, orderRef, customerInfo });
  
  // Simulate payment initiation
  return {
    success: true,
    transactionId: `TXN-${Date.now()}`,
    redirectUrl: `#payment-pending-${gatewayId}`,
  };
}

// Verify payment status (placeholder)
export async function verifyPayment(
  gatewayId: string,
  transactionId: string
): Promise<{
  success: boolean;
  status: "pending" | "completed" | "failed" | "refunded";
  error?: string;
}> {
  console.log(`Verifying payment ${transactionId} via ${gatewayId}`);
  
  return {
    success: true,
    status: "completed",
  };
}
