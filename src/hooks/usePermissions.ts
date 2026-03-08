import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-bridge";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserPermission {
  role: AppRole;
  permission: string;
}

export const DEFAULT_PERMISSIONS: Record<AppRole, string[]> = {
  admin: ["all"],
  manager: [
    "guests:view", "guests:manage", "reservations:view", "reservations:manage",
    "front_desk:view", "front_desk:manage", "housekeeping:view", "housekeeping:manage",
    "engineering:view", "engineering:manage", "pos:view", "pos:manage",
    "inventory:view", "inventory:manage", "channel_manager:view", "channel_manager:manage",
    "finance:view", "finance:manage", "banquet:view", "banquet:manage",
    "reports:view", "operations:night_audit", "operations:day_close",
    "admin:staff", "admin:hr"
  ],
  staff: [
    "guests:view", "guests:manage", "reservations:view", "reservations:manage",
    "front_desk:view", "front_desk:manage", "housekeeping:view", "housekeeping:manage",
    "engineering:view", "pos:view", "pos:manage", "inventory:view",
    "banquet:view", "reports:view"
  ],
  user: ["guests:view", "reservations:view"],
};

export function usePermissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // 🔄 Sentinel: Refactored to use api.from() for backend abstraction
      const { data: rolesRes, error: rolesError } = await (await api.from("user_roles"))
        .select("role")
        .eq("user_id", user.id);

      const roles = (rolesRes as any[]) || [];

      if (rolesError || roles.length === 0) return [];

      const userRoles = roles.map(r => r.role);
      const isAdmin = userRoles.includes("admin");

      if (isAdmin) {
        return [{ role: "admin" as AppRole, permission: "all" }];
      }

      try {
        const { data: permissionsRes, error: permissionsError } = await (await api.from("role_permissions"))
          .select("role, permission")
          .in("role", userRoles);

        const permissions = (permissionsRes as any[]) || [];

        if (permissionsError) {
          console.warn("Could not fetch permissions from database, using defaults:", permissionsError.message);
          return userRoles.flatMap(role =>
            (DEFAULT_PERMISSIONS[role as AppRole] || []).map(permission => ({ role, permission }))
          ) as UserPermission[];
        }

        return permissions as UserPermission[];
      } catch (err) {
        console.warn("Exception while fetching permissions, using defaults");
        return userRoles.flatMap(role =>
          (DEFAULT_PERMISSIONS[role as AppRole] || []).map(permission => ({ role, permission }))
        ) as UserPermission[];
      }
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
