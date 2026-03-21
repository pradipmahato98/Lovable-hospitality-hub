-- Activity Log Trigger Function
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_action TEXT;
  v_old_data JSONB := NULL;
  v_new_data JSONB := NULL;
BEGIN
  -- Attempt to get user ID from auth context
  v_user_id := auth.uid();

  v_action := TG_OP;

  IF (TG_OP = 'UPDATE') THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    v_old_data := to_jsonb(OLD);
  ELSIF (TG_OP = 'INSERT') THEN
    v_new_data := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_log (
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    user_id,
    created_at
  ) VALUES (
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old_data,
    v_new_data,
    v_user_id,
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to priority tables
DROP TRIGGER IF EXISTS audit_banquet_events ON public.banquet_events;
CREATE TRIGGER audit_banquet_events AFTER INSERT OR UPDATE OR DELETE ON public.banquet_events FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS audit_rooms ON public.rooms;
CREATE TRIGGER audit_rooms AFTER UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS audit_pos_transactions ON public.pos_transactions;
CREATE TRIGGER audit_pos_transactions AFTER INSERT OR UPDATE ON public.pos_transactions FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS audit_invoices ON public.invoices;
CREATE TRIGGER audit_invoices AFTER UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.log_activity();
