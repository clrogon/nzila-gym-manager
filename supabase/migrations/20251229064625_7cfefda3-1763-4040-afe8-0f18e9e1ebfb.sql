-- ============================================================================
-- COMPREHENSIVE SECURITY FIXES FOR NZILA GYM MANAGER
-- ============================================================================

-- ============================================================================
-- 1. CREATE MEMBER_SENSITIVE_DATA TABLE FOR HEALTH CONDITIONS
-- ============================================================================

-- Create table for sensitive member data (health conditions, medical info)
CREATE TABLE IF NOT EXISTS public.member_sensitive_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  health_conditions text,
  medical_notes text,
  allergies text,
  blood_type text,
  emergency_medical_info text,
  last_medical_update timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id)
);

-- Enable RLS
ALTER TABLE public.member_sensitive_data ENABLE ROW LEVEL SECURITY;

-- Only admins and gym owners can view/manage sensitive medical data
CREATE POLICY "Admins can manage sensitive data"
ON public.member_sensitive_data FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = member_sensitive_data.member_id
    AND has_gym_role(auth.uid(), m.gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = member_sensitive_data.member_id
    AND has_gym_role(auth.uid(), m.gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role])
  )
);

-- Staff can only view (not modify) sensitive data
CREATE POLICY "Staff can view sensitive data"
ON public.member_sensitive_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = member_sensitive_data.member_id
    AND has_gym_role(auth.uid(), m.gym_id, ARRAY['staff'::app_role])
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_member_sensitive_data_member_id 
ON public.member_sensitive_data(member_id);

-- Trigger for updated_at
CREATE TRIGGER update_member_sensitive_data_updated_at
BEFORE UPDATE ON public.member_sensitive_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. MIGRATE EXISTING HEALTH DATA TO NEW TABLE
-- ============================================================================

-- Migrate health_conditions from members to member_sensitive_data
INSERT INTO public.member_sensitive_data (member_id, health_conditions, created_at, updated_at)
SELECT id, health_conditions, created_at, updated_at
FROM public.members
WHERE health_conditions IS NOT NULL AND health_conditions != ''
ON CONFLICT (member_id) DO UPDATE 
SET health_conditions = EXCLUDED.health_conditions,
    updated_at = now();

-- ============================================================================
-- 3. FIX MEMBERS_SAFE VIEW - ADD SECURITY INVOKER
-- ============================================================================

-- Drop and recreate the view with security_invoker
DROP VIEW IF EXISTS public.members_safe;

CREATE VIEW public.members_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  gym_id,
  user_id,
  full_name,
  email,
  phone,
  status,
  membership_plan_id,
  membership_start_date,
  membership_end_date,
  is_minor,
  tutor_id,
  created_at,
  updated_at,
  gdpr_consent_at,
  gdpr_anonymized_at,
  date_of_birth,
  photo_url,
  notes,
  address,
  emergency_contact,
  emergency_phone
  -- NOTE: health_conditions intentionally excluded - use member_sensitive_data table
FROM public.members;

-- Grant access to the view
GRANT SELECT ON public.members_safe TO authenticated;

-- ============================================================================
-- 4. ADD AUDIT TRIGGER FOR SENSITIVE DATA ACCESS
-- ============================================================================

-- Create audit trigger for sensitive data access
CREATE OR REPLACE FUNCTION public.audit_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    gym_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values
  )
  SELECT 
    auth.uid(),
    m.gym_id,
    'member_sensitive_data',
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  FROM public.members m
  WHERE m.id = COALESCE(NEW.member_id, OLD.member_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit trigger
DROP TRIGGER IF EXISTS audit_member_sensitive_data ON public.member_sensitive_data;
CREATE TRIGGER audit_member_sensitive_data
AFTER INSERT OR UPDATE OR DELETE ON public.member_sensitive_data
FOR EACH ROW
EXECUTE FUNCTION public.audit_sensitive_data_access();

-- ============================================================================
-- 5. STRENGTHEN AUTH_RATE_LIMITS - BLOCK ALL CLIENT ACCESS
-- ============================================================================

-- Ensure rate limits table has deny-all policy (already exists but verify)
DROP POLICY IF EXISTS "deny_all_auth_rate_limits" ON public.auth_rate_limits;
CREATE POLICY "deny_all_auth_rate_limits"
ON public.auth_rate_limits FOR ALL
USING (false);

-- ============================================================================
-- 6. CLEANUP FUNCTION FOR EXPIRED RATE LIMITS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.auth_rate_limits WHERE reset_at < NOW();
END;
$$;