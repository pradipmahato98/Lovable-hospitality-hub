-- ============================================
-- ADVANCED ACCOUNTING RULES & AUTOMATION
-- ============================================

-- 1. REVENUE RECOGNITION (DEFERRED REVENUE)
-- ============================================

CREATE TABLE public.revenue_recognition_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_module TEXT NOT NULL, -- 'PMS', 'Banquet'
  service_type TEXT NOT NULL, -- 'Room', 'Hall Rental'
  deferred_account_id UUID REFERENCES public.accounts(id),
  revenue_account_id UUID REFERENCES public.accounts(id),
  recognition_event TEXT NOT NULL, -- 'check_out', 'nightly', 'event_end'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. AUTOMATED COGS (COST OF GOODS SOLD) MAPPING
-- ============================================

CREATE TABLE public.cogs_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_category_id UUID REFERENCES public.inventory_categories(id),
  inventory_asset_account_id UUID REFERENCES public.accounts(id),
  cogs_expense_account_id UUID REFERENCES public.accounts(id),
  auto_post BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(inventory_category_id)
);

-- 3. FINANCIAL PERIODS & HARD LOCKING
-- ============================================

CREATE TABLE public.financial_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_name TEXT NOT NULL, -- 'Jan 2026'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  fiscal_year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'locked', 'closed'
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(period_name, fiscal_year)
);

-- 4. ENABLE RLS
-- ============================================

ALTER TABLE public.revenue_recognition_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogs_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance staff can manage recognition rules" ON public.revenue_recognition_rules FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance staff can manage cogs config" ON public.cogs_configurations FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance staff can manage periods" ON public.financial_periods FOR ALL USING (public.is_staff(auth.uid()));

-- 5. TRIGGER FOR PERIOD LOCK ENFORCEMENT
-- ============================================

CREATE OR REPLACE FUNCTION public.check_period_lock()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.financial_periods
    WHERE NEW.date BETWEEN start_date AND end_date
    AND status = 'locked'
  ) THEN
    RAISE EXCEPTION 'Cannot post to a locked financial period.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_period_lock
BEFORE INSERT OR UPDATE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.check_period_lock();

-- 6. SEED DATA FOR RULES
-- ============================================

-- Default COGS Mapping
INSERT INTO public.cogs_configurations (inventory_category_id, inventory_asset_account_id, cogs_expense_account_id)
SELECT
  id,
  (SELECT id FROM public.accounts WHERE code = '1300'), -- Inventory Asset
  (SELECT id FROM public.accounts WHERE code = '5000')  -- COGS Expense
FROM public.inventory_categories
LIMIT 1;

-- Default Periods
INSERT INTO public.financial_periods (period_name, start_date, end_date, fiscal_year, status)
VALUES
  ('February 2026', '2026-02-01', '2026-02-28', '2025/26', 'open'),
  ('March 2026', '2026-03-01', '2026-03-31', '2025/26', 'open');
