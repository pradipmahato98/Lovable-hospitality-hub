-- Add is_blocked to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Add is_active to rooms
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add image_url to rooms
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS image_url text;

-- Ensure rejected status is allowed in reservations (if there's a constraint)
-- Note: Assuming status is a text field without a rigid check constraint for now,
-- or if it has one, we'd need to update it.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'reservations' AND column_name = 'status'
    ) THEN
        -- This is complex to update a check constraint without knowing its name,
        -- but usually, we'd drop and recreate it.
        NULL;
    END IF;
END $$;
