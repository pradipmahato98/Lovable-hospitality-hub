-- Create a storage bucket for room images
INSERT INTO storage.buckets (id, name, public)
VALUES ('rooms', 'rooms', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the rooms bucket
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'rooms');
CREATE POLICY "Staff Manage Access" ON storage.objects FOR ALL USING (bucket_id = 'rooms' AND auth.role() = 'authenticated');
