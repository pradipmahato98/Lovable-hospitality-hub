-- Consolidated Inventory & DMR Restructuring Migration
-- Date: 2026-03-20
-- Description: Robust, idempotent migration combining all required Inventory PRD and DMR features.

-- 1. DMR & Analytics Enhancements
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS market_segment TEXT CHECK (market_segment IN ('corporate', 'travel_agent', 'ota', 'government', 'groups', 'leisure', 'long_stay', 'other')),
ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_complimentary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_upgrade BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS early_check_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS late_check_out BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS no_show_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS booking_source_id UUID REFERENCES public.booking_sources(id);

ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS is_out_of_order BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_under_maintenance BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS maintenance_notes TEXT,
ADD COLUMN IF NOT EXISTS last_cleaned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_inspected_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS public.marketing_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    client_name TEXT NOT NULL,
    company_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    inquiry_source TEXT,
    inquiry_type TEXT,
    preferred_dates JSONB,
    estimated_guests INTEGER,
    status TEXT DEFAULT 'new',
    assigned_to UUID REFERENCES auth.users(id),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.sales_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_type TEXT NOT NULL,
    account_name TEXT NOT NULL,
    contact_person TEXT,
    purpose TEXT,
    outcome TEXT,
    next_follow_up DATE,
    performed_by UUID REFERENCES auth.users(id),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.corporate_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    name TEXT NOT NULL UNIQUE,
    industry TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    negotiated_rate NUMERIC(10,2),
    account_manager UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active',
    contact_details JSONB
);

CREATE TABLE IF NOT EXISTS public.utility_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    utility_type TEXT NOT NULL,
    consumption_value NUMERIC(12,2) NOT NULL,
    unit TEXT NOT NULL,
    cost NUMERIC(10,2),
    notes TEXT,
    UNIQUE(usage_date, utility_type)
);

CREATE TABLE IF NOT EXISTS public.housekeeping_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    linen_usage_count INTEGER DEFAULT 0,
    laundry_volume_kg NUMERIC(10,2) DEFAULT 0,
    deep_cleaning_count INTEGER DEFAULT 0,
    staff_on_duty INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(log_date)
);

ALTER TABLE public.guest_feedback
ADD COLUMN IF NOT EXISTS rating_service INTEGER CHECK (rating_service BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS rating_cleanliness INTEGER CHECK (rating_cleanliness BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS rating_food INTEGER CHECK (rating_food BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

CREATE TABLE IF NOT EXISTS public.daily_revenue_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_date DATE NOT NULL UNIQUE,
    room_revenue_target NUMERIC(12,2) DEFAULT 0,
    fb_revenue_target NUMERIC(12,2) DEFAULT 0,
    other_revenue_target NUMERIC(12,2) DEFAULT 0,
    occupancy_target_pct NUMERIC(5,2) DEFAULT 0
);

-- 2. Inventory Foundation (UoMs, Stores)
CREATE TABLE IF NOT EXISTS public.inventory_uoms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_name TEXT NOT NULL UNIQUE,
  unit_symbol TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_uom_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_uom_id UUID NOT NULL REFERENCES public.inventory_uoms(id) ON DELETE CASCADE,
  to_uom_id UUID NOT NULL REFERENCES public.inventory_uoms(id) ON DELETE CASCADE,
  conversion_factor NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_uom_id, to_uom_id)
);

CREATE TABLE IF NOT EXISTS public.inventory_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  store_name TEXT NOT NULL,
  location TEXT,
  store_manager_id UUID REFERENCES public.staff_members(id),
  store_type TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  temperature_classification TEXT DEFAULT 'Ambient',
  storage_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Item Master & Consistency
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'consumable',
ADD COLUMN IF NOT EXISTS shelf_life TEXT,
ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_instructions TEXT,
ADD COLUMN IF NOT EXISTS avg_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_purchase_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS safety_stock NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS temperature_classification TEXT DEFAULT 'Ambient',
ADD COLUMN IF NOT EXISTS tax_applicability JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS uom_id UUID REFERENCES public.inventory_uoms(id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'sku') THEN
    ALTER TABLE public.inventory_items RENAME COLUMN sku TO item_code;
  END IF;
END $$;

ALTER TABLE public.inventory_categories
ADD COLUMN IF NOT EXISTS category_name TEXT,
ADD COLUMN IF NOT EXISTS parent_category UUID REFERENCES public.inventory_categories(id),
ADD COLUMN IF NOT EXISTS sku_prefix TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_categories' AND column_name = 'name') THEN
    UPDATE public.inventory_categories SET category_name = name WHERE category_name IS NULL;
    ALTER TABLE public.inventory_categories RENAME COLUMN name TO legacy_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_categories' AND column_name = 'parent_id') THEN
    UPDATE public.inventory_categories SET parent_category = parent_id WHERE parent_category IS NULL;
    ALTER TABLE public.inventory_categories RENAME COLUMN parent_id TO legacy_parent_id;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.inventory_item_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.inventory_stores(id) ON DELETE CASCADE,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  max_stock NUMERIC,
  reorder_point NUMERIC NOT NULL DEFAULT 0,
  location_within_store TEXT,
  UNIQUE(item_id, store_id)
);

-- 4. Transactions (Requisitions, POs, Receipts, Issues)
CREATE TABLE IF NOT EXISTS public.inventory_requisitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requisition_number TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  request_by UUID NOT NULL REFERENCES public.profiles(user_id),
  required_date DATE,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_requisition_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requisition_id UUID NOT NULL REFERENCES public.inventory_requisitions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity NUMERIC NOT NULL,
  notes TEXT
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'total') THEN
    ALTER TABLE public.purchase_orders RENAME COLUMN total TO total_amount;
  END IF;
END $$;

ALTER TABLE public.purchase_order_items
ADD COLUMN IF NOT EXISTS batch_number TEXT,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS damaged_quantity NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality_status TEXT DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS public.inventory_goods_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grn_number TEXT NOT NULL UNIQUE,
  po_id UUID REFERENCES public.purchase_orders(id),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  store_id UUID REFERENCES public.inventory_stores(id),
  received_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  received_by UUID REFERENCES public.profiles(user_id),
  invoice_number TEXT,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'completed',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.inventory_goods_receipt_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grn_id UUID NOT NULL REFERENCES public.inventory_goods_receipts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  ordered_quantity NUMERIC,
  received_quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  batch_number TEXT,
  expiry_date DATE,
  quality_status TEXT DEFAULT 'passed',
  damaged_quantity NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.inventory_stock_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requisition_id UUID REFERENCES public.inventory_requisitions(id),
  issue_number TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  issued_to UUID REFERENCES public.profiles(user_id),
  issued_by UUID REFERENCES public.profiles(user_id),
  status TEXT NOT NULL DEFAULT 'issued',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_stock_issue_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_issue_id UUID NOT NULL REFERENCES public.inventory_stock_issues(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity NUMERIC NOT NULL,
  batch_number TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.inventory_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transfer_number TEXT NOT NULL UNIQUE,
  from_store_id UUID REFERENCES public.inventory_stores(id),
  to_store_id UUID REFERENCES public.inventory_stores(id),
  status TEXT DEFAULT 'pending',
  transferred_by UUID REFERENCES public.profiles(user_id),
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_by UUID REFERENCES public.profiles(user_id),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Recipes, Production & Returns
CREATE TABLE IF NOT EXISTS public.inventory_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  menu_item_id UUID,
  description TEXT,
  portion_size TEXT,
  yield_percentage NUMERIC DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_recipe_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.inventory_recipes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity NUMERIC NOT NULL,
  uom_id UUID REFERENCES public.inventory_uoms(id),
  waste_percentage NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.inventory_production_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES public.inventory_recipes(id),
  quantity_produced NUMERIC NOT NULL,
  produced_by UUID REFERENCES public.profiles(user_id),
  production_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_supplier_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  return_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id),
  reason TEXT,
  status TEXT DEFAULT 'pending',
  total_return_value NUMERIC DEFAULT 0,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_supplier_return_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id UUID NOT NULL REFERENCES public.inventory_supplier_returns(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL
);

-- 6. Supplier Contracts & Audits
CREATE TABLE IF NOT EXISTS public.inventory_supplier_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL UNIQUE,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  terms TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_supplier_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.inventory_supplier_contracts(id) ON DELETE SET NULL,
  unit_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_preferred BOOLEAN DEFAULT false,
  valid_from DATE,
  valid_to DATE,
  UNIQUE(supplier_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.inventory_stock_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  count_number TEXT NOT NULL UNIQUE,
  store_id UUID REFERENCES public.inventory_stores(id),
  counted_by UUID REFERENCES public.profiles(user_id),
  count_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_stock_count_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_count_id UUID NOT NULL REFERENCES public.inventory_stock_counts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  system_quantity NUMERIC NOT NULL,
  counted_quantity NUMERIC NOT NULL,
  variance NUMERIC GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
  notes TEXT
);

-- 7. Settings, Logs & Movements
CREATE TABLE IF NOT EXISTS public.inventory_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(user_id),
  details JSONB,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.stock_movements
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.inventory_stores(id),
ADD COLUMN IF NOT EXISTS requisition_id UUID REFERENCES public.inventory_requisitions(id);

-- 8. RLS Enablement
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'inventory_%'
  LOOP
    EXECUTE 'ALTER TABLE public.' || t || ' ENABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;

-- 9. Robust Policies
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'inventory_%'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "Staff manage ' || t || '" ON public.' || t;
    EXECUTE 'CREATE POLICY "Staff manage ' || t || '" ON public.' || t || ' FOR ALL USING (is_staff(auth.uid()))';
  END LOOP;
END $$;

-- Special policies for DMR
DO $$ BEGIN
    CREATE POLICY "Staff manage marketing" ON public.marketing_inquiries FOR ALL USING (is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff manage sales" ON public.sales_activities FOR ALL USING (is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff manage corporate" ON public.corporate_accounts FOR ALL USING (is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff manage utility" ON public.utility_usage FOR ALL USING (is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff manage targets" ON public.daily_revenue_targets FOR ALL USING (is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 10. Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_requisitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_stores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_stock_counts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_stock_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_production_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_goods_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.corporate_accounts;

-- 11. Seed Data
INSERT INTO public.inventory_uoms (unit_name, unit_symbol) VALUES
  ('Kilogram', 'kg'),
  ('Gram', 'g'),
  ('Liter', 'L'),
  ('Milliliter', 'ml'),
  ('Piece', 'pcs')
ON CONFLICT (unit_name) DO NOTHING;

INSERT INTO public.inventory_settings (setting_key, setting_value, description) VALUES
  ('costing_method', 'weighted_average', 'Default inventory costing method'),
  ('inventory_gl_account', '1200', 'GL account for Inventory Asset')
ON CONFLICT (setting_key) DO NOTHING;

-- RPC to get table columns safely
CREATE OR REPLACE FUNCTION public.get_table_columns(tname text)
RETURNS TABLE (column_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT CAST(cols.column_name AS text)
  FROM information_schema.columns cols
  WHERE table_name = tname AND table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
