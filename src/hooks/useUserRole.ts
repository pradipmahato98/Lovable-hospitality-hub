import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-bridge";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        const { data, error } = await api.from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.warn("User roles table not found or error, defaulting to staff for dev convenience:", error.message);
          return "staff" as AppRole;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const roles = (data ?? []).map((r: any) => r.role as AppRole);
        if (roles.length === 0) return "staff" as AppRole;

        // Pick highest role if multiple rows exist
        const priority: Record<AppRole, number> = {
          user: 0,
          staff: 1,
          manager: 2,
          admin: 3,
        };

        return roles.reduce((best: AppRole, current: AppRole) => (priority[current] > priority[best] ? current : best));
      } catch (err) {
        console.warn("Exception in useUserRole, defaulting to staff");
        return "staff" as AppRole;
      }
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { data: role, isLoading } = useUserRole();
  return { isAdmin: role === "admin", isLoading };
}

export function useIsManager() {
  const { data: role, isLoading } = useUserRole();
  return { isManager: role === "admin" || role === "manager", isLoading };
}

export function useIsStaff() {
  const { data: role, isLoading } = useUserRole();
  return { isStaff: role === "admin" || role === "manager" || role === "staff", isLoading };
}
