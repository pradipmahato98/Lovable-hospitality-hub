import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  total_visits: number | null;
  total_spending: number | null;
  is_vip: boolean | null;
  title: string | null;
  gender: string | null;
  company: string | null;
  nationality: string | null;
  job_title: string | null;
  date_of_birth: string | null;
  region: string | null;
  state_province: string | null;
  subscribed_property: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  id_type: string | null;
  id_number: string | null;
  image_url: string | null;
  id_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useGuests = () => {
  return useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Guest[];
    },
  });
};

export const useGuest = (guestId: string | null) => {
  return useQuery({
    queryKey: ["guest", guestId],
    queryFn: async () => {
      if (!guestId) return null;
      
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("id", guestId)
        .single();

      if (error) throw error;
      return data as Guest;
    },
    enabled: !!guestId,
  });
};
