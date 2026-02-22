-- Add image fields to guests table
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS id_image_url TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
