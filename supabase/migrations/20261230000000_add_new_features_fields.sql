-- Add is_blocked to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Add is_active and image_url to rooms
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS image_url text;

-- Create rooms storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('rooms', 'rooms', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for rooms
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'rooms');
CREATE POLICY "Staff Manage Access" ON storage.objects FOR ALL USING (bucket_id = 'rooms' AND auth.role() = 'authenticated');

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
