-- Update reservations status constraint to include 'rejected'
DO $$
BEGIN
    -- Try to find and drop the status check constraint if it exists
    -- We'll look for a constraint that contains 'status' and is on 'reservations' table
    DECLARE
        constraint_name text;
    BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'reservations'
          AND con.contype = 'c'
          AND con.consrc LIKE '%status%';

        IF constraint_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.reservations DROP CONSTRAINT ' || constraint_name;
        END IF;
    END;

    -- Add the updated constraint
    ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check
        CHECK (status IN ('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'rejected'));
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
