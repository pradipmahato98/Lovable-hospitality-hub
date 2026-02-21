-- Create a storage bucket for room images
INSERT INTO storage.buckets (id, name, public)
VALUES ('rooms', 'rooms', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the rooms bucket
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'rooms');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'rooms' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to update/delete their own uploads (or all room images if admin)
-- For simplicity in this ERP, we allow authenticated users to manage the rooms bucket
CREATE POLICY "Authenticated Manage" ON storage.objects
  FOR UPDATE USING (bucket_id = 'rooms' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'rooms' AND auth.role() = 'authenticated');
