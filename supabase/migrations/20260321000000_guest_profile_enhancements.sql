-- Add new fields to guests table
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS state_province TEXT;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS subscribed_property TEXT;

-- Add new fields to loyalty_members table
ALTER TABLE public.loyalty_members ADD COLUMN IF NOT EXISTS inactive_date DATE;
ALTER TABLE public.loyalty_members ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE public.loyalty_members ADD COLUMN IF NOT EXISTS property_name TEXT;
ALTER TABLE public.loyalty_members ADD COLUMN IF NOT EXISTS journey_start_date DATE;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
