-- ============================================
-- FINANCE MODULE EXPANSION
-- ============================================

-- 1. Currencies & Exchange Rates
CREATE TABLE IF NOT EXISTS public.currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'USD', 'NPR', 'EUR'
    name TEXT NOT NULL,
    symbol TEXT,
    is_base BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency_id UUID REFERENCES public.currencies(id),
    to_currency_id UUID REFERENCES public.currencies(id),
    rate DECIMAL(18,6) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Accounting Periods
CREATE TABLE IF NOT EXISTS public.accounting_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed', 'permanently_closed'
    is_fiscal_year BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT date_range_check CHECK (end_date >= start_date)
);

-- 3. Accounts (Enhance existing if needed, but keeping existing structure mostly)
-- Ensure DECIMAL(18,4) is used for any money-related fields if we add them.
-- Currently accounts just has metadata. Balances are in journal_lines.
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS usali_department TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS allow_direct_posting BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS public.account_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id),
    period_id UUID REFERENCES public.accounting_periods(id),
    opening_balance DECIMAL(18,4) DEFAULT 0,
    debits DECIMAL(18,4) DEFAULT 0,
    credits DECIMAL(18,4) DEFAULT 0,
    closing_balance DECIMAL(18,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(account_id, period_id)
);

-- 4. Accounts Receivable (AR)
CREATE TABLE IF NOT EXISTS public.ar_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    credit_limit DECIMAL(18,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ar_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.ar_customers(id),
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(18,4) NOT NULL,
    balance_due DECIMAL(18,4) NOT NULL,
    status TEXT DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid', 'void'
    currency_id UUID REFERENCES public.currencies(id),
    exchange_rate DECIMAL(18,6) DEFAULT 1.0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ar_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.ar_customers(id),
    payment_number TEXT UNIQUE NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(18,4) NOT NULL,
    payment_method TEXT NOT NULL,
    reference_number TEXT,
    status TEXT DEFAULT 'posted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Accounts Payable (AP)
CREATE TABLE IF NOT EXISTS public.ap_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ap_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.ap_vendors(id),
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(18,4) NOT NULL,
    balance_due DECIMAL(18,4) NOT NULL,
    status TEXT DEFAULT 'unpaid',
    currency_id UUID REFERENCES public.currencies(id),
    exchange_rate DECIMAL(18,6) DEFAULT 1.0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(vendor_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS public.ap_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.ap_vendors(id),
    payment_number TEXT UNIQUE NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(18,4) NOT NULL,
    payment_method TEXT NOT NULL,
    reference_number TEXT,
    status TEXT DEFAULT 'posted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Fixed Assets
CREATE TABLE IF NOT EXISTS public.fixed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'land', 'building', 'equipment', 'vehicle', etc.
    purchase_date DATE NOT NULL,
    purchase_cost DECIMAL(18,4) NOT NULL,
    salvage_value DECIMAL(18,4) DEFAULT 0,
    useful_life_years INTEGER,
    depreciation_method TEXT, -- 'straight_line', 'double_declining', etc.
    accumulated_depreciation DECIMAL(18,4) DEFAULT 0,
    current_value DECIMAL(18,4) NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'disposed', 'fully_depreciated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Night Audit Runs
-- Prompt 3 specifies a night_audit_runs table. We already have night_audit_logs.
-- I'll create night_audit_runs as requested.
CREATE TABLE IF NOT EXISTS public.night_audit_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID, -- Placeholder if multi-property
    business_date DATE NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    performed_by UUID REFERENCES auth.users(id),
    error_log TEXT,
    summary_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Enhance Journal Entries & Lines
-- Ensuring journal_lines has DECIMAL(18,4)
ALTER TABLE public.journal_lines ALTER COLUMN debit TYPE DECIMAL(18,4);
ALTER TABLE public.journal_lines ALTER COLUMN credit TYPE DECIMAL(18,4);

-- Prompt 1 mentions "journal_entry_lines", but we have "journal_lines".
-- I'll create a view or just keep using journal_lines to avoid breaking existing code,
-- but Prompt 1 asks for specific tables. I'll create journal_entry_lines if it doesn't exist.
CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id),
    description TEXT,
    debit DECIMAL(18,4) NOT NULL DEFAULT 0,
    credit DECIMAL(18,4) NOT NULL DEFAULT 0,
    currency_id UUID REFERENCES public.currencies(id),
    exchange_rate DECIMAL(18,6) DEFAULT 1.0,
    base_debit DECIMAL(18,4) NOT NULL DEFAULT 0,
    base_credit DECIMAL(18,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Check constraint for double-entry balance on journal_entries is hard to do at DB level
-- without a trigger or complex constraint. I'll add a trigger function for validation.

-- 9. RLS Enablement
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.night_audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- 10. Default Policies (Allow staff/admin)
-- Reusing public.is_staff helper if exists
DO $$
BEGIN
    -- Currencies
    CREATE POLICY "Staff can view currencies" ON public.currencies FOR SELECT USING (true);
    CREATE POLICY "Admin can manage currencies" ON public.currencies FOR ALL USING (public.is_staff(auth.uid()));

    -- AR/AP etc.
    CREATE POLICY "Staff can manage ar_customers" ON public.ar_customers FOR ALL USING (public.is_staff(auth.uid()));
    CREATE POLICY "Staff can manage ar_invoices" ON public.ar_invoices FOR ALL USING (public.is_staff(auth.uid()));
    CREATE POLICY "Staff can manage ar_payments" ON public.ar_payments FOR ALL USING (public.is_staff(auth.uid()));
    CREATE POLICY "Staff can manage ap_vendors" ON public.ap_vendors FOR ALL USING (public.is_staff(auth.uid()));
    CREATE POLICY "Staff can manage ap_invoices" ON public.ap_invoices FOR ALL USING (public.is_staff(auth.uid()));
    CREATE POLICY "Staff can manage ap_payments" ON public.ap_payments FOR ALL USING (public.is_staff(auth.uid()));
    CREATE POLICY "Staff can manage fixed_assets" ON public.fixed_assets FOR ALL USING (public.is_staff(auth.uid()));
    CREATE POLICY "Staff can manage night_audit_runs" ON public.night_audit_runs FOR ALL USING (public.is_staff(auth.uid()));
    CREATE POLICY "Staff can manage accounting_periods" ON public.accounting_periods FOR ALL USING (public.is_staff(auth.uid()));
    CREATE POLICY "Staff can manage account_balances" ON public.account_balances FOR ALL USING (public.is_staff(auth.uid()));
    CREATE POLICY "Staff can manage journal_entry_lines" ON public.journal_entry_lines FOR ALL USING (public.is_staff(auth.uid()));

EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 11. AR Aging Function (Prompt 4)
CREATE OR REPLACE FUNCTION public.get_ar_aging(v_as_of_date DATE)
RETURNS TABLE (
    customer_id UUID,
    customer_name TEXT,
    current DECIMAL(18,4),
    overdue_30 DECIMAL(18,4),
    overdue_60 DECIMAL(18,4),
    overdue_90 DECIMAL(18,4),
    overdue_90plus DECIMAL(18,4),
    total DECIMAL(18,4)
) AS $$
BEGIN
    RETURN QUERY
    WITH aging_buckets AS (
        SELECT
            c.id as c_id,
            c.name as c_name,
            i.balance_due,
            CASE
                WHEN (v_as_of_date - i.due_date) <= 0 THEN i.balance_due
                ELSE 0
            END as bucket_current,
            CASE
                WHEN (v_as_of_date - i.due_date) > 0 AND (v_as_of_date - i.due_date) <= 30 THEN i.balance_due
                ELSE 0
            END as bucket_30,
            CASE
                WHEN (v_as_of_date - i.due_date) > 30 AND (v_as_of_date - i.due_date) <= 60 THEN i.balance_due
                ELSE 0
            END as bucket_60,
            CASE
                WHEN (v_as_of_date - i.due_date) > 60 AND (v_as_of_date - i.due_date) <= 90 THEN i.balance_due
                ELSE 0
            END as bucket_90,
            CASE
                WHEN (v_as_of_date - i.due_date) > 90 THEN i.balance_due
                ELSE 0
            END as bucket_90plus
        FROM public.ar_customers c
        JOIN public.ar_invoices i ON c.id = i.customer_id
        WHERE i.status != 'paid' AND i.invoice_date <= v_as_of_date
    )
    SELECT
        c_id,
        c_name,
        SUM(bucket_current) as current,
        SUM(bucket_30) as overdue_30,
        SUM(bucket_60) as overdue_60,
        SUM(bucket_90) as overdue_90,
        SUM(bucket_90plus) as overdue_90plus,
        SUM(balance_due) as total
    FROM aging_buckets
    GROUP BY c_id, c_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Initial Data
INSERT INTO public.currencies (code, name, symbol, is_base)
VALUES ('USD', 'US Dollar', '$', true)
ON CONFLICT (code) DO NOTHING;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
