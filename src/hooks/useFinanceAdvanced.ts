import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";

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
}

export interface Budget {
  id: string;
  account_id: string;
  fiscal_year: string;
  budget_amount: number;
  actual_amount: number;
  notes: string | null;
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
}

export interface COGSConfig {
  id: string;
  inventory_category_id: string;
  inventory_asset_account_id: string;
  cogs_expense_account_id: string;
  auto_post: boolean;
}

export interface FinancialPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  fiscal_year: string;
  status: 'open' | 'locked' | 'closed';
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

  useEffect(() => {
    const channel = supabase
      .channel("fixed-assets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "fixed_assets" }, () => {
        queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useCreateFixedAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (asset: Omit<FixedAsset, "id" | "accumulated_depreciation" | "current_value">) => {
      const { data, error } = await db.from("fixed_assets").insert({
        ...asset,
        current_value: asset.purchase_cost,
        accumulated_depreciation: 0
      }).select().single();
      if (error) throw error;
      return data as FixedAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
      toast.success("Fixed asset registered successfully");
    },
  });
}

// ============= Automated Rules =============

export function useCOGSConfigs() {
  return useQuery({
    queryKey: ["cogs-configs"],
    queryFn: async () => {
      const { data, error } = await db.from("cogs_configurations").select("*");
      if (error) throw error;
      return data as COGSConfig[];
    },
  });
}

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

  useEffect(() => {
    const channel = supabase
      .channel("periods-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "financial_periods" }, () => {
        queryClient.invalidateQueries({ queryKey: ["financial-periods"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useLockPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db.from("financial_periods").update({
        status: 'locked',
        locked_at: new Date().toISOString(),
        locked_by: (await supabase.auth.getUser()).data.user?.id
      }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-periods"] });
      toast.success("Financial period locked successfully");
    },
  });
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

  useEffect(() => {
    const channel = supabase
      .channel("budgets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets" }, () => {
        queryClient.invalidateQueries({ queryKey: ["budgets"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Budget> }) => {
      const { data, error } = await db.from("budgets").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget updated");
    },
  });
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

  useEffect(() => {
    const channel = supabase
      .channel("bank-accounts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bank_accounts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bankAccount: Omit<BankAccount, "id">) => {
      const { data, error } = await db.from("bank_accounts").insert(bankAccount).select().single();
      if (error) throw error;
      return data as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Bank account added");
    },
  });
}
