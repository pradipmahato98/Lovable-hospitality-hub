-- Standardize Inventory RLS Policies

-- 1. Locations
DROP POLICY IF EXISTS "Allow all for authenticated" ON inventory_locations;
CREATE POLICY "inventory_locations_select" ON inventory_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_locations_all_staff" ON inventory_locations FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'inventory:manage')) WITH CHECK (public.has_permission(auth.uid(), 'inventory:manage'));

-- 2. Items
DROP POLICY IF EXISTS "Allow all for authenticated" ON inventory_items;
CREATE POLICY "inventory_items_select" ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_items_all_staff" ON inventory_items FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'inventory:manage')) WITH CHECK (public.has_permission(auth.uid(), 'inventory:manage'));

-- 3. Transfers
DROP POLICY IF EXISTS "Allow all for authenticated" ON inventory_transfers;
CREATE POLICY "inventory_transfers_select" ON inventory_transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_transfers_all_staff" ON inventory_transfers FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'inventory:manage')) WITH CHECK (public.has_permission(auth.uid(), 'inventory:manage'));

-- 4. Audits
DROP POLICY IF EXISTS "Allow all for authenticated" ON inventory_audits;
CREATE POLICY "inventory_audits_select" ON inventory_audits FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_audits_all_staff" ON inventory_audits FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'inventory:manage')) WITH CHECK (public.has_permission(auth.uid(), 'inventory:manage'));

-- 5. Recipes
DROP POLICY IF EXISTS "Allow all for authenticated" ON inventory_recipes;
CREATE POLICY "inventory_recipes_select" ON inventory_recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_recipes_all_staff" ON inventory_recipes FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'inventory:manage')) WITH CHECK (public.has_permission(auth.uid(), 'inventory:manage'));

-- 6. Wastage
DROP POLICY IF EXISTS "Allow all for authenticated" ON inventory_wastage;
CREATE POLICY "inventory_wastage_select" ON inventory_wastage FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_wastage_all_staff" ON inventory_wastage FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'inventory:manage')) WITH CHECK (public.has_permission(auth.uid(), 'inventory:manage'));

-- 7. Suppliers
DROP POLICY IF EXISTS "Allow all for authenticated" ON suppliers;
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "suppliers_all_staff" ON suppliers FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'inventory:manage')) WITH CHECK (public.has_permission(auth.uid(), 'inventory:manage'));
