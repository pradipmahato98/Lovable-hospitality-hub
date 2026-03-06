import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserPermission {
  role: AppRole;
  permission: string;
}

export function usePermissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesError || !roles || roles.length === 0) return [];

      const userRoles = roles.map(r => r.role);
      const isAdmin = userRoles.includes("admin");

      if (isAdmin) {
        return [{ role: "admin" as AppRole, permission: "all" }];
      }

      const { data: permissions, error: permissionsError } = await supabase
        .from("role_permissions")
        .select("role, permission")
        .in("role", userRoles);

      if (permissionsError) return [];

      return (permissions || []) as UserPermission[];
    },
    enabled: !!user,
  });
}

export function useHasPermission(permission: string) {
  const { data: permissions, isLoading } = usePermissions();

  const hasPermission = permissions?.some(
    (p) => p.permission === "all" || p.permission === permission
  ) ?? false;

  return { hasPermission, isLoading };
}
