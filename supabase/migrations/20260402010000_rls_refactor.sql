-- Add function to check for specific permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role public.app_role;
BEGIN
  -- Get user's primary role (assuming highest priority if multiple exist)
  SELECT role INTO _user_role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY
    CASE role
      WHEN 'admin' THEN 4
      WHEN 'manager' THEN 3
      WHEN 'staff' THEN 2
      WHEN 'user' THEN 1
      ELSE 0
    END DESC
  LIMIT 1;

  -- If no role found, user has no permissions
  IF _user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Admin always has all permissions
  IF _user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Check if user's role has the specific permission
  RETURN EXISTS (
    SELECT 1
    FROM public.role_permissions
    WHERE role = _user_role
      AND (permission = 'all' OR permission = _permission)
  );
END;
$$;

-- Refactor RLS Policies for Profiles
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_permission(auth.uid(), 'admin:staff') OR public.has_permission(auth.uid(), 'admin:hr'));

-- Refactor RLS Policies for Rooms
DROP POLICY IF EXISTS "Staff can manage rooms" ON public.rooms;
CREATE POLICY "Staff can manage rooms"
ON public.rooms FOR ALL
USING (public.has_permission(auth.uid(), 'front_desk:manage'));

-- Refactor RLS Policies for Guests
DROP POLICY IF EXISTS "Staff can view guests" ON public.guests;
CREATE POLICY "Staff can view guests"
ON public.guests FOR SELECT
USING (public.has_permission(auth.uid(), 'guests:view'));

DROP POLICY IF EXISTS "Staff can manage guests" ON public.guests;
CREATE POLICY "Staff can manage guests"
ON public.guests FOR ALL
USING (public.has_permission(auth.uid(), 'guests:manage'));

-- Refactor RLS Policies for Reservations
DROP POLICY IF EXISTS "Staff can view all reservations" ON public.reservations;
CREATE POLICY "Staff can view all reservations"
ON public.reservations FOR SELECT
USING (public.has_permission(auth.uid(), 'reservations:view'));

DROP POLICY IF EXISTS "Staff can manage reservations" ON public.reservations;
CREATE POLICY "Staff can manage reservations"
ON public.reservations FOR ALL
USING (public.has_permission(auth.uid(), 'reservations:manage'));
