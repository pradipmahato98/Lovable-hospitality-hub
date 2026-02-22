-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM reservations WHERE status != 'cancelled'),
        'total_bookings', (SELECT COUNT(*) FROM reservations),
        'total_rooms', (SELECT COUNT(*) FROM rooms),
        'total_users', (SELECT COUNT(*) FROM profiles)
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
