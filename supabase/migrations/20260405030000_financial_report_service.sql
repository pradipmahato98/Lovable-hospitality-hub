-- ============================================
-- FINANCIAL REPORT SERVICE (Prompt 5)
-- ============================================

-- 1. Helper Function: Get Account Totals for a Period
CREATE OR REPLACE FUNCTION public.get_account_totals(
    p_start_date DATE,
    p_end_date DATE,
    p_currency TEXT DEFAULT 'USD'
)
RETURNS TABLE (
    account_id UUID,
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    usali_department TEXT,
    net_amount DECIMAL(18,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id as account_id,
        a.code as account_code,
        a.name as account_name,
        a.type as account_type,
        a.usali_department,
        COALESCE(SUM(l.base_debit - l.base_credit), 0) as net_amount
    FROM public.accounts a
    LEFT JOIN public.journal_entry_lines l ON a.id = l.account_id
    LEFT JOIN public.journal_entries e ON l.journal_entry_id = e.id
    WHERE e.is_posted = true
      AND e.date >= p_start_date
      AND e.date <= p_end_date
    GROUP BY a.id, a.code, a.name, a.type, a.usali_department;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Income Statement Report
CREATE OR REPLACE FUNCTION public.generate_income_statement_report(
    p_start_date DATE,
    p_end_date DATE,
    p_currency TEXT DEFAULT 'USD'
)
RETURNS JSONB AS $$
DECLARE
    v_prior_start_date DATE;
    v_prior_end_date DATE;
    v_current_data JSONB;
    v_prior_data JSONB;
    v_net_income DECIMAL(18,4);
BEGIN
    -- Comparison to same period last year
    v_prior_start_date := p_start_date - INTERVAL '1 year';
    v_prior_end_date := p_end_date - INTERVAL '1 year';

    WITH current_totals AS (
        SELECT * FROM public.get_account_totals(p_start_date, p_end_date, p_currency)
        WHERE account_type IN ('revenue', 'expense')
    ),
    prior_totals AS (
        SELECT * FROM public.get_account_totals(v_prior_start_date, v_prior_end_date, p_currency)
        WHERE account_type IN ('revenue', 'expense')
    )
    SELECT jsonb_agg(jsonb_build_object(
        'account_id', c.account_id,
        'account_code', c.account_code,
        'account_name', c.account_name,
        'account_type', c.account_type,
        'usali_department', c.usali_department,
        'amount', c.net_amount,
        'prior_period_amount', COALESCE(p.net_amount, 0)
    ))
    INTO v_current_data
    FROM current_totals c
    LEFT JOIN prior_totals p ON c.account_id = p.account_id;

    SELECT SUM(net_amount) INTO v_net_income FROM current_totals;

    RETURN jsonb_build_object(
        'title', 'Income Statement',
        'period', p_start_date || ' to ' || p_end_date,
        'currency', p_currency,
        'line_items', v_current_data,
        'summary', jsonb_build_object('net_income', v_net_income)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Balance Sheet Report
CREATE OR REPLACE FUNCTION public.generate_balance_sheet_report(
    p_as_of_date DATE,
    p_currency TEXT DEFAULT 'USD'
)
RETURNS JSONB AS $$
DECLARE
    v_current_data JSONB;
    v_total_assets DECIMAL(18,4) := 0;
    v_total_liabilities DECIMAL(18,4) := 0;
    v_total_equity DECIMAL(18,4) := 0;
BEGIN
    WITH current_totals AS (
        SELECT * FROM public.get_account_totals('1900-01-01', p_as_of_date, p_currency)
    )
    SELECT
        jsonb_agg(jsonb_build_object(
            'account_id', account_id,
            'account_code', account_code,
            'account_name', account_name,
            'account_type', account_type,
            'amount', net_amount
        )),
        SUM(CASE WHEN account_type = 'asset' THEN net_amount ELSE 0 END),
        SUM(CASE WHEN account_type = 'liability' THEN -net_amount ELSE 0 END),
        SUM(CASE WHEN account_type IN ('equity', 'revenue', 'expense') THEN -net_amount ELSE 0 END)
    INTO v_current_data, v_total_assets, v_total_liabilities, v_total_equity
    FROM current_totals;

    RETURN jsonb_build_object(
        'title', 'Balance Sheet',
        'period', 'As of ' || p_as_of_date,
        'currency', p_currency,
        'line_items', v_current_data,
        'summary', jsonb_build_object(
            'total_assets', v_total_assets,
            'total_liabilities', v_total_liabilities,
            'total_equity', v_total_equity
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trial Balance Report
CREATE OR REPLACE FUNCTION public.generate_trial_balance_report(
    p_period_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_current_data JSONB;
    v_total_debit DECIMAL(18,4) := 0;
    v_total_credit DECIMAL(18,4) := 0;
BEGIN
    WITH period_totals AS (
        SELECT
            a.id as account_id,
            a.code as account_code,
            a.name as account_name,
            COALESCE(b.debits, 0) as debit,
            COALESCE(b.credits, 0) as credit
        FROM public.accounts a
        LEFT JOIN public.account_balances b ON a.id = b.account_id AND b.period_id = p_period_id
    )
    SELECT
        jsonb_agg(jsonb_build_object(
            'account_id', account_id,
            'account_code', account_code,
            'account_name', account_name,
            'debit', debit,
            'credit', credit
        )),
        SUM(debit),
        SUM(credit)
    INTO v_current_data, v_total_debit, v_total_credit
    FROM period_totals;

    RETURN jsonb_build_object(
        'title', 'Trial Balance',
        'line_items', v_current_data,
        'summary', jsonb_build_object(
            'total_debits', v_total_debit,
            'total_credits', v_total_credit
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
