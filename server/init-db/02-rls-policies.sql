-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (user_id = (current_setting('app.current_user_id')::uuid));

-- Rooms Policies (Publicly viewable)
CREATE POLICY "Anyone can view active rooms" ON rooms
  FOR SELECT USING (is_active = true);

-- Reservations Policies
CREATE POLICY "Users can view their own reservations" ON reservations
  FOR SELECT USING (created_by = (current_setting('app.current_user_id')::uuid));
