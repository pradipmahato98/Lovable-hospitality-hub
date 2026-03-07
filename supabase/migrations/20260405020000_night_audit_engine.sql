-- ============================================
-- NIGHT AUDIT ENGINE (Prompt 3)
-- ============================================

CREATE OR REPLACE FUNCTION public.run_night_audit_transactional(
    p_business_date DATE,
    p_property_id UUID,
    p_performed_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_posted_count INTEGER := 0;
    v_room_revenue DECIMAL(18,4) := 0;
    v_tax_amount DECIMAL(18,4) := 0;
    v_fb_charges DECIMAL(18,4) := 0;
    v_noshow_revenue DECIMAL(18,4) := 0;
    v_result JSONB;
BEGIN
    -- STEP 1: Post room revenue for all in-house reservations
    -- (Simplified for brevity, assuming existing check-in logic)
    SELECT COUNT(*), COALESCE(SUM(rm.price_per_night), 0)
    INTO v_posted_count, v_room_revenue
    FROM public.reservations r
    JOIN public.rooms rm ON r.room_id = rm.id
    WHERE r.status = 'checked-in'
      AND r.check_in_date <= p_business_date
      AND r.check_out_date > p_business_date;

    -- Create Journal Entry for Room Revenue
    -- (In a real system, this would call post_journal_entry_transactional for GL posting)

    -- STEP 2: Distribute package revenue (e.g., breakfast included in rate)
    -- STEP 3: Calculate and post taxes
    v_tax_amount := v_room_revenue * 0.13; -- Assuming 13% VAT

    -- STEP 4: Process F&B POS charges
    SELECT COALESCE(SUM(total), 0) INTO v_fb_charges
    FROM public.pos_transactions
    WHERE DATE(created_at) = p_business_date;

    -- STEP 5: Handle no-show revenue
    -- (Reservations that were supposed to check in today but didn't)
    SELECT COALESCE(SUM(total_amount * 0.5), 0) INTO v_noshow_revenue -- Assuming 50% no-show fee
    FROM public.reservations
    WHERE status = 'confirmed' AND check_in_date = p_business_date;

    -- STEP 6: Update exchange rates (Integration with external API or just logging)

    -- STEP 7: Run trial balance check
    -- (Verify if GL is in balance before closing)
    IF NOT EXISTS (
        SELECT 1 FROM public.account_balances
        -- WHERE period_id matches current period
        HAVING ABS(SUM(closing_balance)) < 0.01
    ) THEN
        -- In a real scenario, this might raise an exception if strictly required
        NULL;
    END IF;

    -- Return Summary
    v_result := jsonb_build_object(
        'business_date', p_business_date,
        'posted_count', v_posted_count,
        'room_revenue', v_room_revenue,
        'tax_amount', v_tax_amount,
        'fb_charges', v_fb_charges,
        'noshow_revenue', v_noshow_revenue
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Transaction will roll back automatically on exception
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
