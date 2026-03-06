-- Detailed Permissions Mapping
-- admin: all permissions
-- manager: most permissions, excluding some admin/dev tools
-- staff: limited permissions (front desk, pos, guests, etc.)

-- Ensure table exists (redundant but safe)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role public.app_role NOT NULL,
    permission TEXT NOT NULL,
    UNIQUE(role, permission)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view permissions
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.role_permissions;
CREATE POLICY "Authenticated users can view permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

-- Allow admins to manage permissions
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage permissions"
ON public.role_permissions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Clear existing permissions to avoid duplicates
TRUNCATE public.role_permissions;

-- Admin Permissions (All)
INSERT INTO public.role_permissions (role, permission) VALUES
('admin', 'all');

-- Manager Permissions
INSERT INTO public.role_permissions (role, permission) VALUES
('manager', 'guests:view'), ('manager', 'guests:manage'),
('manager', 'reservations:view'), ('manager', 'reservations:manage'),
('manager', 'front_desk:view'), ('manager', 'front_desk:manage'),
('manager', 'housekeeping:view'), ('manager', 'housekeeping:manage'),
('manager', 'engineering:view'), ('manager', 'engineering:manage'),
('manager', 'pos:view'), ('manager', 'pos:manage'),
('manager', 'inventory:view'), ('manager', 'inventory:manage'),
('manager', 'channel_manager:view'), ('manager', 'channel_manager:manage'),
('manager', 'finance:view'), ('manager', 'finance:manage'),
('manager', 'banquet:view'), ('manager', 'banquet:manage'),
('manager', 'reports:view'),
('manager', 'operations:night_audit'), ('manager', 'operations:day_close'),
('manager', 'admin:staff'), ('manager', 'admin:hr');

-- Staff Permissions
INSERT INTO public.role_permissions (role, permission) VALUES
('staff', 'guests:view'), ('staff', 'guests:manage'),
('staff', 'reservations:view'), ('staff', 'reservations:manage'),
('staff', 'front_desk:view'), ('staff', 'front_desk:manage'),
('staff', 'housekeeping:view'), ('staff', 'housekeeping:manage'),
('staff', 'engineering:view'),
('staff', 'pos:view'), ('staff', 'pos:manage'),
('staff', 'inventory:view'),
('staff', 'banquet:view'),
('staff', 'reports:view');

-- User Permissions (Default/Limited)
INSERT INTO public.role_permissions (role, permission) VALUES
('user', 'guests:view'),
('user', 'reservations:view');
