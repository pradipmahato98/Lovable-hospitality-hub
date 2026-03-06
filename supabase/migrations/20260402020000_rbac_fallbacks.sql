-- Update has_permission function to check ALL user roles (additive)
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_perm BOOLEAN;
  _user_roles public.app_role[];
BEGIN
  -- Get all roles for the user
  SELECT array_agg(role) INTO _user_roles
  FROM public.user_roles
  WHERE user_id = _user_id;

  -- If no roles found, user has no permissions
  IF _user_roles IS NULL OR array_length(_user_roles, 1) = 0 THEN
    RETURN FALSE;
  END IF;

  -- Admin always has all permissions
  IF 'admin' = ANY(_user_roles) THEN
    RETURN TRUE;
  END IF;

  -- 1. Try checking the role_permissions table for ANY of the user's roles
  BEGIN
    SELECT EXISTS (
      SELECT 1
      FROM public.role_permissions
      WHERE role = ANY(_user_roles)
        AND (permission = 'all' OR permission = _permission)
    ) INTO _has_perm;

    IF _has_perm THEN
      RETURN TRUE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Table might not exist or be inaccessible, continue to hardcoded fallbacks
    _has_perm := FALSE;
  END;

  -- 2. Fallback to hardcoded core permissions if table check fails or doesn't find the permission
  -- Manager core fallbacks
  IF 'manager' = ANY(_user_roles) AND _permission IN (
    'guests:view', 'guests:manage', 'reservations:view', 'reservations:manage',
    'front_desk:view', 'front_desk:manage', 'pos:view', 'pos:manage', 'inventory:view'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Staff core fallbacks
  IF 'staff' = ANY(_user_roles) AND _permission IN (
    'guests:view', 'guests:manage', 'reservations:view', 'reservations:manage',
    'front_desk:view', 'front_desk:manage', 'pos:view', 'pos:manage'
  ) THEN
    RETURN TRUE;
  END IF;

  -- User core fallbacks
  IF 'user' = ANY(_user_roles) AND _permission IN ('guests:view', 'reservations:view') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;
