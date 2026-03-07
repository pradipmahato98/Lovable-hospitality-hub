import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  is_blocked: boolean | null;
  blocked_reason: string | null;
  created_at: string;
}

export interface RoleChangeAudit {
  id: string;
  user_id: string;
  changed_by_user_id: string;
  old_role: string;
  new_role: string;
  reason: string | null;
  created_at: string;
  user_email?: string;
  changed_by_email?: string;
}

export const roleConfig: Record<AppRole, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  manager: { label: "Manager", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  staff: { label: "Staff", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  user: { label: "User", color: "bg-muted text-muted-foreground border-border" },
};

export const useUsersWithRoles = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, email, first_name, last_name, is_blocked, blocked_reason, created_at");

      if (profilesError) {
        console.error("Profiles fetch error:", profilesError);
        throw profilesError;
      }

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.warn("User roles fetch error, continuing with empty roles:", rolesError.message);
      }

      const safeRoles = roles || [];

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRoles = safeRoles.filter((r) => r.user_id === profile.user_id);
        const allRoles = userRoles.map((r) => r.role as AppRole);

        // Ensure even users with no roles in user_roles table are visible
        const hasMultipleRoles = allRoles.length > 1;
        const highestRole = allRoles.length > 0 ? getHighestRole(allRoles) : "user" as AppRole;

        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: highestRole,
          allRoles,
          hasMultipleRoles,
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

export const useRoleChangeAudit = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["role-change-audit"],
    queryFn: async () => {
      const { data: audits, error: auditError } = await supabase
        .from("role_change_audit")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (auditError) throw auditError;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email");

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.email]) || []);

      return audits.map((audit) => ({
        ...audit,
        user_email: profileMap.get(audit.user_id) || "Unknown",
        changed_by_email: profileMap.get(audit.changed_by_user_id) || "Unknown",
      })) as RoleChangeAudit[];
    },
    enabled,
  });
};

export const useRolePermissions = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("role_permissions")
          .select("*");

        if (error) {
          console.warn("Could not fetch permissions table, using default mapping:", error.message);
          const roles = Object.keys(DEFAULT_PERMISSIONS) as AppRole[];
          return roles.flatMap(role =>
            DEFAULT_PERMISSIONS[role].map(perm => ({ id: `${role}-${perm}`, role, permission: perm }))
          );
        }
        return data;
      } catch (err) {
        console.warn("Exception while fetching permissions, using defaults");
        const roles = Object.keys(DEFAULT_PERMISSIONS) as AppRole[];
        return roles.flatMap(role =>
          DEFAULT_PERMISSIONS[role].map(perm => ({ id: `${role}-${perm}`, role, permission: perm }))
        );
      }
    },
    enabled,
  });
};

export const useOTAChannels = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["ota-channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ota_channels")
        .select("*");

      if (error) throw error;
      return data;
    },
    enabled,
  });
};

export const useOTASyncLogs = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["ota-sync-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ota_sync_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled,
  });
};

export const useAdminAuditLogs = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email");

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.email]) || []);

      return data.map(log => ({
        ...log,
        user_email: profileMap.get(log.user_id || "") || "System",
      }));
    },
    enabled,
  });
};

export const useUpdateRolePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role, permission, action }: { role: AppRole; permission: string; action: 'add' | 'remove' }) => {
      if (action === 'add') {
        const { error } = await supabase
          .from("role_permissions")
          .insert({ role, permission });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role", role)
          .eq("permission", permission);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success("Role permissions updated");
    },
    onError: (error: any) => {
      const message = error.message?.includes("PGRST205") || error.message?.includes("schema cache")
        ? "The RBAC permissions table has not been initialized in the database yet. Please run the migrations."
        : error.message;
      toast.error("Failed to update permissions: " + message);
    },
  });
};

export const useUpdateOTAChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active, sync_status }: { id: string; is_active?: boolean; sync_status?: string }) => {
      const { error } = await supabase
        .from("ota_channels")
        .update({ is_active, sync_status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ota-channels"] });
      toast.success("Channel configuration updated");
    },
    onError: (error) => {
      toast.error("Failed to update channel: " + error.message);
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      is_blocked,
      blocked_reason,
      first_name,
      last_name,
      phone
    }: {
      userId: string;
      is_blocked?: boolean;
      blocked_reason?: string | null;
      first_name?: string;
      last_name?: string;
      phone?: string;
    }) => {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (is_blocked !== undefined) updateData.is_blocked = is_blocked;
      if (blocked_reason !== undefined) updateData.blocked_reason = blocked_reason;
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (phone !== undefined) updateData.phone = phone;

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", userId);

      if (error) throw error;

      // Log to audit_log
      if (is_blocked !== undefined) {
        await supabase.from("audit_log").insert({
          action: is_blocked ? "block_user" : "unblock_user",
          entity_type: "user",
          entity_id: userId,
          new_values: { is_blocked, blocked_reason },
        });
      }

      if (first_name !== undefined || last_name !== undefined || phone !== undefined) {
        await supabase.from("audit_log").insert({
          action: "update_profile",
          entity_type: "user",
          entity_id: userId,
          new_values: { first_name, last_name, phone },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast.success("User profile updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      userId,
      oldRole,
      newRole,
      action = 'replace'
    }: {
      userId: string;
      oldRole?: AppRole;
      newRole: AppRole;
      action?: 'add' | 'remove' | 'replace'
    }) => {
      if (action === 'replace') {
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (insertError) throw insertError;
      } else if (action === 'add') {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (insertError) throw insertError;
      } else if (action === 'remove') {
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", newRole);

        if (deleteError) throw deleteError;
      }

      if (oldRole !== newRole || action !== 'replace') {
        const { error: auditError } = await supabase
          .from("role_change_audit")
          .insert({
            user_id: userId,
            changed_by_user_id: user?.id || "",
            old_role: oldRole,
            new_role: newRole,
            reason: `Role changed from ${oldRole} to ${newRole}`,
          });

        if (auditError) throw auditError;

        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            title: "Role Updated",
            message: `Your role has been changed ${oldRole ? `from ${roleConfig[oldRole]?.label || oldRole} ` : ""}to ${roleConfig[newRole]?.label || newRole}`,
            type: "role_change",
            category: "system",
          });

        if (notifError) console.error("Failed to create notification:", notifError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ["role-change-audit"] });
      toast.success("User role updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });
};
