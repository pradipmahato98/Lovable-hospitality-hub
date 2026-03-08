import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-bridge";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_PERMISSIONS } from "./usePermissions";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLE_PRIORITY: Record<AppRole, number> = {
  user: 0,
  staff: 1,
  manager: 2,
  admin: 3,
};

export const getHighestRole = (roles: AppRole[]): AppRole => {
  if (roles.length === 0) return "user";
  return roles.reduce((best, current) =>
    ROLE_PRIORITY[current] > ROLE_PRIORITY[best] ? current : best
  );
};

export interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: AppRole;
  allRoles: AppRole[];
  hasMultipleRoles: boolean;
  phone: string | null;
  is_blocked: boolean | null;
  blocked_reason: string | null;
  created_at: string;
}

export const useUsersWithRoles = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      // 🔄 Sentinel: Refactored to use api.from() for backend abstraction
      const { data: profiles, error: profilesError } = await (await api.from("profiles")).select("*");

      if (profilesError) {
        console.error("Profiles fetch error:", profilesError);
        throw profilesError;
      }

      const { data: roles, error: rolesError } = await (await api.from("user_roles")).select("*");

      if (rolesError) {
        console.warn("User roles fetch error, continuing with empty roles:", rolesError.message);
      }

      const safeRoles = (roles as any[]) || [];

      const usersWithRoles: UserWithRole[] = (profiles as any[] || []).map((profile) => {
        const userRoles = safeRoles.filter((r) => r.user_id === profile.user_id);
        const allRoles = userRoles.map((r) => r.role as AppRole);
        const highestRole = allRoles.length > 0 ? getHighestRole(allRoles) : "user" as AppRole;

        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          role: highestRole,
          allRoles,
          hasMultipleRoles: allRoles.length > 1,
          is_blocked: profile.is_blocked,
          blocked_reason: profile.blocked_reason,
          created_at: profile.created_at,
        };
      });

      return usersWithRoles;
    },
    enabled,
  });
};

export const useRolePermissions = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      try {
        const { data, error } = await (await api.from("role_permissions")).select("*");

        if (error) {
          const roles = Object.keys(DEFAULT_PERMISSIONS) as AppRole[];
          return roles.flatMap(role =>
            DEFAULT_PERMISSIONS[role].map(perm => ({ id: `${role}-${perm}`, role, permission: perm }))
          );
        }
        return data as any[];
      } catch (err) {
        const roles = Object.keys(DEFAULT_PERMISSIONS) as AppRole[];
        return roles.flatMap(role =>
          DEFAULT_PERMISSIONS[role].map(perm => ({ id: `${role}-${perm}`, role, permission: perm }))
        );
      }
    },
    enabled,
  });
};

export const useUpdateRolePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role, permission, action }: { role: AppRole; permission: string; action: 'add' | 'remove' }) => {
      const table = await api.from("role_permissions");
      if (action === 'add') {
        const { error } = await table.insert({ role, permission });
        if (error) throw error;
      } else {
        const { error } = await table.delete().eq("role", role).eq("permission", permission);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success("Role permissions updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update permissions: " + error.message);
    },
  });
};
