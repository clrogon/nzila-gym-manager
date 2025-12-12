-- Remove the INSERT policy that allows users to create their own audit logs
-- This prevents audit trail tampering
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;

-- Create a function to automatically log changes to sensitive tables
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      gym_id,
      entity_type,
      entity_id,
      action,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      COALESCE(OLD.gym_id, NULL),
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      gym_id,
      entity_type,
      entity_id,
      action,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      COALESCE(NEW.gym_id, OLD.gym_id, NULL),
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id,
      gym_id,
      entity_type,
      entity_id,
      action,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      COALESCE(NEW.gym_id, NULL),
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Add audit triggers to sensitive tables
-- Members table (PII data)
DROP TRIGGER IF EXISTS audit_members_changes ON public.members;
CREATE TRIGGER audit_members_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Payments table (financial data)
DROP TRIGGER IF EXISTS audit_payments_changes ON public.payments;
CREATE TRIGGER audit_payments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- User roles table (access control)
DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Products table (inventory/stock adjustments)
DROP TRIGGER IF EXISTS audit_products_changes ON public.products;
CREATE TRIGGER audit_products_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Add comment explaining the security design
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail - INSERT only via SECURITY DEFINER triggers, no direct user access. UPDATE and DELETE blocked by RLS.';