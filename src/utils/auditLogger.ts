import { api } from "@/lib/api-bridge";

export const logAuditAction = async ({
  action,
  entity_type,
  entity_id,
  old_values,
  new_values,
  user_id,
}: {
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  user_id?: string;
}) => {
  try {
    // 🔄 Sentinel: Refactored to use api.from() for backend abstraction
    const { error } = await (await api.from('audit_log')).insert({
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      user_id,
    }).execute();

    if (error) console.error('Failed to log audit action:', error);
  } catch (err) {
    console.error('Exception while logging audit action:', err);
  }
};

export const trackActivity = async (action: string, entity: string, details?: any) => {
  await logAuditAction({
    action,
    entity_type: entity,
    new_values: details
  });
};
