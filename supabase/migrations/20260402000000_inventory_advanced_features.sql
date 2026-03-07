-- Advanced Inventory Features Migration

-- 1. Inventory Locations (Warehouses)
CREATE TABLE public.inventory_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Add new columns to inventory_items
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.inventory_locations(id);

-- 3. Inventory Requisitions (Internal Requests)
CREATE TABLE public.inventory_requisitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requisition_number TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  requested_by_id UUID,
  requested_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'draft', 'pending', 'approved', 'rejected', 'completed'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Inventory Requisition Items
CREATE TABLE public.inventory_requisition_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requisition_id UUID NOT NULL REFERENCES public.inventory_requisitions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Update Stock Movements for better tracking
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS from_location_id UUID REFERENCES public.inventory_locations(id);
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS to_location_id UUID REFERENCES public.inventory_locations(id);

-- 6. Enable RLS
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_requisition_items ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
CREATE POLICY "Staff can manage inventory_locations" ON public.inventory_locations FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage inventory_requisitions" ON public.inventory_requisitions FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage inventory_requisition_items" ON public.inventory_requisition_items FOR ALL USING (is_staff(auth.uid()));

-- 8. Triggers for updated_at
CREATE TRIGGER update_inventory_locations_updated_at BEFORE UPDATE ON public.inventory_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_requisitions_updated_at BEFORE UPDATE ON public.inventory_requisitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_requisitions;

-- 10. Default Locations
INSERT INTO public.inventory_locations (name, description) VALUES
  ('Main Warehouse', 'Central storage for all items'),
  ('Kitchen Store', 'Food and beverage storage'),
  ('Housekeeping Closet', 'Linens and toiletries');
