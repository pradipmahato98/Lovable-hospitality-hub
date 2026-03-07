-- Advanced Hospitality Inventory Features

-- 1. Expiry and Batch Tracking
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS batch_number TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN DEFAULT FALSE;

ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS batch_number TEXT;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- 2. Internal Transfers (Store to Store)
CREATE TABLE IF NOT EXISTS inventory_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number TEXT UNIQUE NOT NULL,
    from_location_id UUID REFERENCES inventory_locations(id),
    to_location_id UUID REFERENCES inventory_locations(id),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, completed, cancelled
    requested_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID REFERENCES inventory_transfers(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id),
    requested_quantity DECIMAL(12,2) NOT NULL,
    sent_quantity DECIMAL(12,2),
    received_quantity DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Physical Stock Audits (Variance Reconciliation)
CREATE TABLE IF NOT EXISTS inventory_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_number TEXT UNIQUE NOT NULL,
    location_id UUID REFERENCES inventory_locations(id),
    status TEXT NOT NULL DEFAULT 'draft', -- draft, in_progress, completed
    conducted_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_audit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES inventory_audits(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id),
    theoretical_stock DECIMAL(12,2) NOT NULL,
    physical_stock DECIMAL(12,2),
    variance DECIMAL(12,2),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Recipe Management / Bill of Materials (BOM)
-- Useful for F&B (Cocktails, Main Courses) and Housekeeping (Amenity Kits)
CREATE TABLE IF NOT EXISTS inventory_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- F&B, Housekeeping, Maintenance
    yield_quantity DECIMAL(12,2) DEFAULT 1.0,
    yield_unit TEXT DEFAULT 'portion',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES inventory_recipes(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id),
    quantity DECIMAL(12,2) NOT NULL,
    unit TEXT, -- e.g. grams, ml, pieces (may differ from inventory unit)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON inventory_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON inventory_transfer_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON inventory_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON inventory_audit_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON inventory_recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON inventory_recipe_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);
