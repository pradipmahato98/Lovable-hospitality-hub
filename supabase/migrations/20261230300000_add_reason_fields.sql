-- Add blocked_reason to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_reason text;

-- Add rejection_reason to reservations
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update get_dashboard_stats to include more details if needed
-- (Current version is okay but let's make sure it's robust)

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
