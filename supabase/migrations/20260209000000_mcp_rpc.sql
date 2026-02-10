-- Create a function to execute safe read-only SQL queries
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if user is an admin or service_role
    IF NOT (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied. Admin role or service key required.';
    END IF;

    -- Basic protection: only allow SELECT
    IF NOT (LOWER(TRIM(sql_query)) LIKE 'select%') THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;

    EXECUTE 'SELECT jsonb_agg(t) FROM (' || sql_query || ') t' INTO result;
    RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error executing query: %', SQLERRM;
END;
$$;

-- Create a function to get schema info (tables and columns)
CREATE OR REPLACE FUNCTION get_schema_info()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if user is an admin or service_role
    IF NOT (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied. Admin role or service key required.';
    END IF;

    SELECT jsonb_build_object(
        'tables', (
            SELECT jsonb_agg(jsonb_build_object(
                'table_name', table_name,
                'columns', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'column_name', column_name,
                        'data_type', data_type,
                        'is_nullable', is_nullable
                    ))
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = t.table_name
                )
            ))
            FROM information_schema.tables t
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        )
    ) INTO result;
    RETURN result;
END;
$$;
