-- Link journal_entries to profiles for creator information
ALTER TABLE public.journal_entries
DROP CONSTRAINT IF EXISTS journal_entries_created_by_fkey;

ALTER TABLE public.journal_entries
ADD CONSTRAINT journal_entries_created_by_profile_fkey
FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- Ensure profiles.user_id has a unique constraint if not already present
-- (PostgREST requires it for one-to-one joins)
-- Usually profiles.user_id is the primary key or unique.
-- In this project, profiles has its own 'id' UUID, but user_id should be unique.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;
