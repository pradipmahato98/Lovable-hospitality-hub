-- ============================================
-- ADVANCED FINANCE & ACCOUNTING ENHANCEMENTS
-- ============================================

-- 1. BASE TABLES (IF NOT EXISTED BY MCP)
-- ============================================

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id UUID REFERENCES public.accounts(id),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  miti TEXT,
  fiscal_year TEXT,
  voucher_type TEXT,
  description TEXT NOT NULL,
  reference TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_posted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  sub_ledger TEXT,
  debit NUMERIC NOT NULL DEFAULT 0,
  credit NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. ADVANCED SUB-LEDGERS & MASTER DATA
-- ============================================

-- Fixed Assets
CREATE TABLE public.fixed_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_cost NUMERIC NOT NULL,
  useful_life_years INTEGER NOT NULL,
  salvage_value NUMERIC DEFAULT 0,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line', -- 'straight_line', 'double_declining'
  current_value NUMERIC NOT NULL,
  accumulated_depreciation NUMERIC NOT NULL DEFAULT 0,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'disposed', 'fully_depreciated'
  last_depreciation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Budgets
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  fiscal_year TEXT NOT NULL,
  budget_amount NUMERIC NOT NULL DEFAULT 0,
  actual_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(account_id, fiscal_year)
);

-- Bank Accounts & Reconciliation
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL DEFAULT 'USD',
  gl_account_id UUID REFERENCES public.accounts(id),
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.bank_reconciliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  statement_date DATE NOT NULL,
  statement_balance NUMERIC NOT NULL,
  gl_balance NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'completed'
  reconciled_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. ENABLE RLS & POLICIES
-- ============================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

-- Finance Staff / Admin Policies
CREATE POLICY "Finance staff can manage accounts" ON public.accounts FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance staff can manage journal_entries" ON public.journal_entries FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance staff can manage journal_lines" ON public.journal_lines FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance staff can manage fixed_assets" ON public.fixed_assets FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance staff can manage budgets" ON public.budgets FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance staff can manage bank_accounts" ON public.bank_accounts FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance staff can manage bank_reconciliations" ON public.bank_reconciliations FOR ALL USING (public.is_staff(auth.uid()));

-- 4. REALTIME & TRIGGERS
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_lines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fixed_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fixed_assets_updated_at BEFORE UPDATE ON public.fixed_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bank_reconciliations_updated_at BEFORE UPDATE ON public.bank_reconciliations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. SEED DATA
-- ============================================

-- Basic COA if empty
INSERT INTO public.accounts (code, name, type, description)
VALUES
  ('1000', 'Cash on Hand', 'asset', 'Physical cash in hotel vault'),
  ('1100', 'Bank Current Account', 'asset', 'Primary operating bank account'),
  ('1200', 'Accounts Receivable', 'asset', 'Money owed by guests and companies'),
  ('1300', 'Inventory', 'asset', 'Hotel supplies and F&B stock'),
  ('1500', 'Fixed Assets', 'asset', 'Property, plant, and equipment'),
  ('2000', 'Accounts Payable', 'liability', 'Money owed to suppliers'),
  ('2100', 'Accrued Expenses', 'liability', 'Expenses incurred but not yet invoiced'),
  ('3000', 'Retained Earnings', 'equity', 'Accumulated profit/loss'),
  ('4000', 'Room Revenue', 'revenue', 'Income from room bookings'),
  ('4100', 'F&B Revenue', 'revenue', 'Income from restaurant and bar'),
  ('5000', 'Cost of Sales', 'expense', 'Direct costs of providing services'),
  ('5100', 'Salaries & Wages', 'expense', 'Staff payroll expenses'),
  ('5200', 'Utilities', 'expense', 'Electricity, water, and gas')
ON CONFLICT (code) DO NOTHING;
