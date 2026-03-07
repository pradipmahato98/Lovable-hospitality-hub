import { supabase } from "@/integrations/supabase/client";

export interface AccountReportItem {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  usali_department: string | null;
  amount: number;
  prior_period_amount: number;
}

export interface ReportDTO {
  title: string;
  period: string;
  currency: string;
  line_items: AccountReportItem[];
  summary: {
    total_debits: number;
    total_credits: number;
    net_income: number;
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
  };
}

export class FinancialReportService {
  /**
   * Generates an Income Statement (Profit & Loss).
   * Follows Prompt 5 requirements.
   */
  static async generateIncomeStatement(propertyId: string, startDate: string, endDate: string, currency: string): Promise<ReportDTO> {
    const { data, error } = await supabase.rpc('generate_income_statement_report', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_currency: currency
    });

    if (error) {
      throw new Error(`Failed to generate income statement: ${error.message}`);
    }

    return data as ReportDTO;
  }

  /**
   * Generates a Balance Sheet.
   * Follows Prompt 5 requirements.
   */
  static async generateBalanceSheet(propertyId: string, asOfDate: string, currency: string): Promise<ReportDTO> {
    const { data, error } = await supabase.rpc('generate_balance_sheet_report', {
      p_as_of_date: asOfDate,
      p_currency: currency
    });

    if (error) {
      throw new Error(`Failed to generate balance sheet: ${error.message}`);
    }

    return data as ReportDTO;
  }

  /**
   * Generates a Trial Balance.
   * Follows Prompt 5 requirements.
   */
  static async generateTrialBalance(propertyId: string, periodId: string): Promise<ReportDTO> {
    const { data, error } = await supabase.rpc('generate_trial_balance_report', {
      p_period_id: periodId
    });

    if (error) {
      throw new Error(`Failed to generate trial balance: ${error.message}`);
    }

    return data as ReportDTO;
  }
}
