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

-- 5.1 AUTOMATED COGS POSTING ENGINE (TRIGGER BASED)
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_post_cogs()
RETURNS TRIGGER AS $$
DECLARE
    v_item_category_id UUID;
    v_cost_price NUMERIC;
    v_item_name TEXT;
    v_config RECORD;
    v_total_cost NUMERIC;
    v_journal_id UUID;
BEGIN
    -- Only handle 'out' movements
    IF NEW.movement_type != 'out' THEN
        RETURN NEW;
    END IF;

    -- Get item details
    SELECT category_id, cost_price, name
    INTO v_item_category_id, v_cost_price, v_item_name
    FROM public.inventory_items
    WHERE id = NEW.item_id;

    -- Find automation config
    SELECT * INTO v_config
    FROM public.cogs_configurations
    WHERE inventory_category_id = v_item_category_id
    AND auto_post = true;

    IF v_config IS NULL THEN
        RETURN NEW;
    END IF;

    v_total_cost := NEW.quantity * v_cost_price;

    IF v_total_cost <= 0 THEN
        RETURN NEW;
    END IF;

    -- Create Journal Entry
    INSERT INTO public.journal_entries (
        entry_number,
        date,
        description,
        voucher_type,
        is_posted
    ) VALUES (
        'AUTO-COGS-' || NEW.id,
        CURRENT_DATE,
        'Automated COGS: ' || v_item_name || ' consumption (' || NEW.quantity || ' units)',
        'JV',
        true -- Auto-post COGS
    ) RETURNING id INTO v_journal_id;

    -- Debit COGS Expense
    INSERT INTO public.journal_lines (
        journal_entry_id,
        account_id,
        debit,
        credit,
        description
    ) VALUES (
        v_journal_id,
        v_config.cogs_expense_account_id,
        v_total_cost,
        0,
        'COGS for ' || v_item_name
    );

    -- Credit Inventory Asset
    INSERT INTO public.journal_lines (
        journal_entry_id,
        account_id,
        debit,
        credit,
        description
    ) VALUES (
        v_journal_id,
        v_config.inventory_asset_account_id,
        0,
        v_total_cost,
        'Inventory reduction for ' || v_item_name
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_post_cogs
AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.auto_post_cogs();

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
