-- Wastage and Costing Enhancements

CREATE TABLE IF NOT EXISTS inventory_wastage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id),
    quantity DECIMAL(12,2) NOT NULL,
    reason TEXT NOT NULL, -- Expired, Damaged, Spill, Theft, Quality Control
    recorded_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE inventory_wastage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON inventory_wastage FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wastage_item ON inventory_wastage(item_id);
CREATE INDEX IF NOT EXISTS idx_expiry_date ON inventory_items(expiry_date);
