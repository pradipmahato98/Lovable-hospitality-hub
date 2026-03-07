import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============= Types =============

export interface FixedAsset {
  id: string;
  asset_code: string;
  name: string;
  category: string;
  purchase_date: string;
  purchase_cost: number;
  useful_life_years: number;
  salvage_value: number;
  depreciation_method: 'straight_line' | 'double_declining';
  current_value: number;
  accumulated_depreciation: number;
  location: string | null;
  status: 'active' | 'disposed' | 'fully_depreciated';
  last_depreciation_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  account_id: string;
  fiscal_year: string;
  budget_amount: number;
  actual_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  account?: {
      code: string;
      name: string;
  };
}

export interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  currency: string;
  gl_account_id: string | null;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  fiscal_year: string;
  status: 'open' | 'locked' | 'closed';
  locked_at: string | null;
  locked_by: string | null;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ============= Fixed Assets =============

export function useFixedAssets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["fixed-assets"],
    queryFn: async () => {
      const { data, error } = await db.from("fixed_assets").select("*").order("asset_code");
      if (error) throw error;
      return data as FixedAsset[];
    },
  });

  const createAsset = useMutation({
    mutationFn: async (asset: Omit<FixedAsset, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await db.from("fixed_assets").insert(asset).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fixed-assets"] }),
  });

  return { ...query, createAsset };
}

// ============= Budgets =============

export function useBudgets(fiscalYear?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["budgets", fiscalYear],
    queryFn: async () => {
      let q = db.from("budgets").select("*, account:accounts(code, name)");
      if (fiscalYear) q = q.eq("fiscal_year", fiscalYear);
      const { data, error } = await q;
      if (error) throw error;
      return data as Budget[];
    },
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Budget> & { id: string }) => {
      const { data, error } = await db.from("budgets").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });

  return { ...query, updateBudget };
}

// ============= Bank Accounts =============

export function useBankAccounts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await db.from("bank_accounts").select("*").order("account_name");
      if (error) throw error;
      return data as BankAccount[];
    },
  });

  const createBankAccount = useMutation({
    mutationFn: async (account: Omit<BankAccount, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await db.from("bank_accounts").insert(account).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });

  return { ...query, createBankAccount };
}

// ============= Financial Periods =============

export function useFinancialPeriods() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["financial-periods"],
    queryFn: async () => {
      const { data, error } = await db.from("financial_periods").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data as FinancialPeriod[];
    },
  });

  const updatePeriodStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FinancialPeriod['status'] }) => {
      const updates: any = { status };
      if (status === 'locked') {
        updates.locked_at = new Date().toISOString();
        updates.locked_by = (await supabase.auth.getUser()).data.user?.id;
      }
      const { data, error } = await db.from("financial_periods").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["financial-periods"] }),
  });

  return { ...query, updatePeriodStatus };
}

export function useLockPeriod() {
  const { updatePeriodStatus } = useFinancialPeriods();
  return {
    ...updatePeriodStatus,
    mutateAsync: (id: string) => updatePeriodStatus.mutateAsync({ id, status: 'locked' })
  };
}
