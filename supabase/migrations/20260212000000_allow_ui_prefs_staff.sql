-- Allow staff to update UI preferences key in settings table
-- This allows anyone with 'staff' role to change the global UI theme
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'settings' AND policyname = 'Admins can manage settings'
  ) THEN
    -- We don't want to change the admin policy, but add a new one for staff
    -- for specifically the ui_preferences key.
    DROP POLICY IF EXISTS "Staff can update UI preferences" ON public.settings;
    CREATE POLICY "Staff can update UI preferences"
    ON public.settings
    FOR UPDATE
    USING (is_staff(auth.uid()) AND key = 'ui_preferences')
    WITH CHECK (is_staff(auth.uid()) AND key = 'ui_preferences');

    -- Also allow insertion if it doesn't exist
    DROP POLICY IF EXISTS "Staff can insert UI preferences" ON public.settings;
    CREATE POLICY "Staff can insert UI preferences"
    ON public.settings
    FOR INSERT
    WITH CHECK (is_staff(auth.uid()) AND key = 'ui_preferences');

    -- Also allow reading the UI preferences
    DROP POLICY IF EXISTS "Staff can view UI preferences" ON public.settings;
    CREATE POLICY "Staff can view UI preferences"
    ON public.settings
    FOR SELECT
    USING (is_staff(auth.uid()) AND key = 'ui_preferences');
  END IF;
END $$;
