import { supabase } from "@/integrations/supabase/client";

export interface ARAgingBucket {
  customer_id: string;
  customer_name: string;
  current: number;
  overdue_30: number;
  overdue_60: number;
  overdue_90: number;
  overdue_90plus: number;
  total: number;
}

export class ARService {
  /**
   * Generates an AR Aging report for a specific date.
   * Follows Prompt 4 requirements.
   */
  static async getAgingReport(asOfDate: string): Promise<ARAgingBucket[]> {
    const { data, error } = await supabase.rpc('get_ar_aging', {
      v_as_of_date: asOfDate
    });

    if (error) {
      throw new Error(`Failed to fetch AR aging report: ${error.message}`);
    }

    // Include per-customer subtotals (already in raw SQL)
    // and grand totals (add row for UI)
    const grandTotal: ARAgingBucket = {
        customer_id: 'grand-total',
        customer_name: 'GRAND TOTAL',
        current: (data || []).reduce((sum: number, r: any) => sum + Number(r.current), 0),
        overdue_30: (data || []).reduce((sum: number, r: any) => sum + Number(r.overdue_30), 0),
        overdue_60: (data || []).reduce((sum: number, r: any) => sum + Number(r.overdue_60), 0),
        overdue_90: (data || []).reduce((sum: number, r: any) => sum + Number(r.overdue_90), 0),
        overdue_90plus: (data || []).reduce((sum: number, r: any) => sum + Number(r.overdue_90plus), 0),
        total: (data || []).reduce((sum: number, r: any) => sum + Number(r.total), 0)
    };

    return [...(data || []), grandTotal];
  }
}
