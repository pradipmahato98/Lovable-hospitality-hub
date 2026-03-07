import { supabase } from "@/integrations/supabase/client";

export class NightAuditService {
  /**
   * Runs the Night Audit process for a specific business date.
   * Follows Prompt 3 requirements.
   */
  static async runNightAudit(businessDate: string, propertyId?: string) {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Accepts a business_date and property_id parameter
    // 2. Runs inside a single database transaction (PostgreSQL function handles the transaction)
    // 3. Performs these steps in order:
    //    - Post room revenue for all in-house reservations
    //    - Distribute package revenue
    //    - Calculate and post taxes
    //    - Process F&B POS charges
    //    - Handle no-show revenue
    //    - Update exchange rates
    //    - Run trial balance check

    const { data: auditRun, error: insertError } = await supabase
      .from('night_audit_runs' as any)
      .insert({
        business_date: businessDate,
        property_id: propertyId || null,
        status: 'in_progress',
        performed_by: user?.id,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Failed to initialize night audit: ${insertError.message}`);
    }

    const auditRunId = auditRun.id;

    try {
      const { data: result, error: auditError } = await supabase.rpc('run_night_audit_transactional', {
        p_business_date: businessDate,
        p_property_id: propertyId || null,
        p_performed_by: user?.id
      });

      if (auditError) {
        throw auditError;
      }

      // 5. On success: marks audit as completed, advances business_date
      await supabase
        .from('night_audit_runs' as any)
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            summary_data: result
        })
        .eq('id', auditRunId);

      // Advance business date in settings
      const nextDate = new Date(businessDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().slice(0, 10);

      await supabase
        .from('settings')
        .update({ value: JSON.stringify(nextDateStr) as any })
        .eq('key', 'business_date');

      return result;

    } catch (err: any) {
      // 4. On any step failure: rolls back entire transaction (handled by RPC), saves error to night_audit_runs
      await supabase
        .from('night_audit_runs' as any)
        .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_log: err.message || JSON.stringify(err)
        })
        .eq('id', auditRunId);

      throw err;
    }
  }
}
