-- Create guest_audit_logs table
CREATE TABLE IF NOT EXISTS public.guest_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES auth.users(id),
    staff_name TEXT,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create guest_documents table for ID card history
CREATE TABLE IF NOT EXISTS public.guest_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    document_type TEXT,
    document_number TEXT,
    document_image_url TEXT,
    is_latest BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_guest_audit_logs_guest_id ON public.guest_audit_logs(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_documents_guest_id ON public.guest_documents(guest_id);

-- Enable RLS
ALTER TABLE public.guest_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_documents ENABLE ROW LEVEL SECURITY;

-- Basic policies (assuming authenticated users can read/write for now)
CREATE POLICY "Enable read access for authenticated users" ON public.guest_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.guest_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON public.guest_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.guest_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON public.guest_documents FOR UPDATE TO authenticated USING (true);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
