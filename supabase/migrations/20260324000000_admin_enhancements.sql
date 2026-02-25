-- Admin Enhancements Migration
-- 1. Profiles: Account Blocking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- 2. Reservations: Lifecycle expansion (Rejected status and reason)
-- Note: Inline constraints in PostgreSQL are often named table_column_check
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check
    CHECK (status IN ('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show', 'rejected'));

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Rooms: Management enhancements
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Storage: 'rooms' bucket for room images
INSERT INTO storage.buckets (id, name, public)
VALUES ('rooms', 'rooms', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for 'rooms' bucket
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
    CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'rooms');

    DROP POLICY IF EXISTS "Authenticated Manage Access" ON storage.objects;
    CREATE POLICY "Authenticated Manage Access" ON storage.objects FOR ALL USING (bucket_id = 'rooms' AND auth.role() = 'authenticated');
EXCEPTION
    WHEN others THEN
        NULL;
END $$;

-- 5. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
