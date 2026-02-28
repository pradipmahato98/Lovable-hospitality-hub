import { api } from "@/lib/api-bridge";

export const trackActivity = async (action: string, entityType: string = "button_click", details: any = {}) => {
  try {
    const { data: { user } } = await api.auth.getUser();
    if (!user) return;

    await api.from('audit_log').insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      new_values: details,
    });
  } catch (error) {
    // Silently fail as logging shouldn't break the UI
    console.error("Failed to track activity:", error);
  }
};
