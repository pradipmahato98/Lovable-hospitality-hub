-- Add foreign key to audit_log for better joins with profiles
-- Add foreign key to audit_log to enable direct joins with profiles in PostgREST
ALTER TABLE public.audit_log
ADD CONSTRAINT audit_log_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id) ON DELETE SET NULL;
