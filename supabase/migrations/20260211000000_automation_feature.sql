-- Create automation_rules table
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL, -- e.g., 'on_check_in', 'on_reservation_created', 'on_payment_received'
    conditions JSONB DEFAULT '[]'::jsonb,
    action_type TEXT NOT NULL, -- e.g., 'send_email', 'create_notification'
    action_config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE
);

-- Create routing_rules table (formalizing what was partially in useGuestFolios)
CREATE TABLE IF NOT EXISTS public.routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    source_folio_id UUID NOT NULL,
    target_folio_id UUID NOT NULL,
    category TEXT NOT NULL, -- 'room', 'tax', 'f&b', 'incidentals', 'all'
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT routing_rules_source_folio_id_fkey FOREIGN KEY (source_folio_id) REFERENCES public.guest_folios(id) ON DELETE CASCADE,
    CONSTRAINT routing_rules_target_folio_id_fkey FOREIGN KEY (target_folio_id) REFERENCES public.guest_folios(id) ON DELETE CASCADE
);

-- Enhance folio_items table with auditing columns
ALTER TABLE public.folio_items ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.folio_items ADD COLUMN IF NOT EXISTS modified_by TEXT;
ALTER TABLE public.folio_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view routing_rules" ON public.routing_rules FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage routing_rules" ON public.routing_rules FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view automation_rules" ON public.automation_rules FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage automation_rules" ON public.automation_rules FOR ALL USING (is_staff(auth.uid()));

-- Add Realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.routing_rules;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_automation_rules
    BEFORE UPDATE ON public.automation_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_routing_rules
    BEFORE UPDATE ON public.routing_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_folio_items
    BEFORE UPDATE ON public.folio_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some sample automation rules
INSERT INTO public.automation_rules (name, description, event_type, action_type, action_config) VALUES
('Welcome Email', 'Send a welcome email to guests upon check-in', 'on_check_in', 'send_email', '{"template": "welcome_guest"}'),
('High Occupancy Alert', 'Notify manager when occupancy exceeds 90%', 'on_reservation_created', 'create_notification', '{"recipient": "manager", "message": "High occupancy alert!"}');
