-- PRD Schema Realignment for Inventory Module

-- 1. Units of Measurement
CREATE TABLE IF NOT EXISTS units (
    unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_name VARCHAR NOT NULL,
    unit_symbol VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_conversions (
    conversion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_unit UUID REFERENCES units(unit_id),
    to_unit UUID REFERENCES units(unit_id),
    conversion_factor DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Item Categories
ALTER TABLE IF EXISTS inventory_categories RENAME TO item_categories;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_categories' AND column_name = 'id') THEN
        ALTER TABLE item_categories RENAME COLUMN id TO category_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_categories' AND column_name = 'name') THEN
        ALTER TABLE item_categories RENAME COLUMN name TO category_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_categories' AND column_name = 'parent_id') THEN
        ALTER TABLE item_categories RENAME COLUMN parent_id TO parent_category;
    END IF;
END $$;

-- 3. Suppliers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'id') THEN
        ALTER TABLE suppliers RENAME COLUMN id TO supplier_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'name') THEN
        ALTER TABLE suppliers RENAME COLUMN name TO supplier_name;
    END IF;
END $$;

-- 4. Items
ALTER TABLE IF EXISTS inventory_items RENAME TO items;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'id') THEN
        ALTER TABLE items RENAME COLUMN id TO item_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'name') THEN
        ALTER TABLE items RENAME COLUMN name TO item_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'sku') THEN
        ALTER TABLE items RENAME COLUMN sku TO item_code;
    END IF;
    -- Handle unit migration if it was a string
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'unit') THEN
        ALTER TABLE items RENAME COLUMN unit TO legacy_unit;
        ALTER TABLE items ADD COLUMN unit_id UUID REFERENCES units(unit_id);

        -- Data Migration for Units
        INSERT INTO units (unit_name, unit_symbol)
        SELECT DISTINCT legacy_unit, SUBSTRING(legacy_unit FROM 1 FOR 3)
        FROM items
        WHERE legacy_unit IS NOT NULL
        ON CONFLICT DO NOTHING;

        UPDATE items i
        SET unit_id = u.unit_id
        FROM units u
        WHERE i.legacy_unit = u.unit_name;
    END IF;
END $$;

-- 5. Stores
CREATE TABLE IF NOT EXISTS stores (
    store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name VARCHAR NOT NULL,
    location VARCHAR,
    store_type VARCHAR,
    manager_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_inventory (
    inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(store_id),
    item_id UUID REFERENCES items(item_id),
    quantity DECIMAL DEFAULT 0,
    average_cost DECIMAL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, item_id)
);

-- 6. Procurement
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    requisition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_number VARCHAR UNIQUE,
    department_id UUID,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR DEFAULT 'pending',
    approved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_requisition_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id UUID REFERENCES purchase_requisitions(requisition_id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(item_id),
    quantity DECIMAL NOT NULL
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'id') THEN
            ALTER TABLE purchase_orders RENAME COLUMN id TO po_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'total') THEN
            ALTER TABLE purchase_orders RENAME COLUMN total TO total_amount;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_items') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_order_items' AND column_name = 'purchase_order_id') THEN
            ALTER TABLE purchase_order_items RENAME COLUMN purchase_order_id TO po_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_order_items' AND column_name = 'unit_price') THEN
            ALTER TABLE purchase_order_items RENAME COLUMN unit_price TO price;
        END IF;
    END IF;
END $$;

-- 7. Receiving
CREATE TABLE IF NOT EXISTS goods_receipts (
    grn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_number VARCHAR UNIQUE,
    po_id UUID REFERENCES purchase_orders(po_id),
    supplier_id UUID REFERENCES suppliers(supplier_id),
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID REFERENCES goods_receipts(grn_id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(item_id),
    received_quantity DECIMAL NOT NULL,
    batch_number VARCHAR,
    expiry_date DATE
);

-- 8. Stock Movements
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'id') THEN
        ALTER TABLE stock_movements RENAME COLUMN id TO movement_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'store_id') THEN
        ALTER TABLE stock_movements ADD COLUMN store_id UUID REFERENCES stores(store_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'movement_date') THEN
        ALTER TABLE stock_movements ADD COLUMN movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 9. Transfers
ALTER TABLE IF EXISTS inventory_transfers RENAME TO stock_transfers;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transfers' AND column_name = 'id') THEN
        ALTER TABLE stock_transfers RENAME COLUMN id TO transfer_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transfers' AND column_name = 'transfer_date') THEN
        ALTER TABLE stock_transfers ADD COLUMN transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transfers' AND column_name = 'from_store') THEN
        ALTER TABLE stock_transfers ADD COLUMN from_store UUID REFERENCES stores(store_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transfers' AND column_name = 'to_store') THEN
        ALTER TABLE stock_transfers ADD COLUMN to_store UUID REFERENCES stores(store_id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES stock_transfers(transfer_id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(item_id),
    quantity DECIMAL NOT NULL
);

-- 10. Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
    adjustment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(store_id),
    adjustment_type VARCHAR, -- Damage, Expiry, Loss, Manual
    reason TEXT,
    approved_by UUID,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_adjustment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_id UUID REFERENCES stock_adjustments(adjustment_id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(item_id),
    quantity_change DECIMAL NOT NULL
);

-- 11. Audit / Counts
CREATE TABLE IF NOT EXISTS stock_counts (
    count_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(store_id),
    count_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    counted_by UUID,
    status VARCHAR DEFAULT 'pending', -- pending, reconciled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    count_id UUID REFERENCES stock_counts(count_id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(item_id),
    system_qty DECIMAL NOT NULL,
    physical_qty DECIMAL NOT NULL,
    variance DECIMAL NOT NULL
);

-- 12. Recipes / BOM
CREATE TABLE IF NOT EXISTS recipes (
    recipe_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_name VARCHAR NOT NULL,
    portion_size DECIMAL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(item_id),
    quantity_required DECIMAL NOT NULL
);

-- Realtime enablement
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE item_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE purchase_requisitions;
ALTER PUBLICATION supabase_realtime ADD TABLE goods_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_counts;
ALTER PUBLICATION supabase_realtime ADD TABLE stores;
ALTER PUBLICATION supabase_realtime ADD TABLE units;
