-- Fix Security Definer View warning: Use SECURITY INVOKER for members_safe view
-- This ensures the view respects the RLS policies of the querying user

DROP VIEW IF EXISTS public.members_safe;

CREATE VIEW public.members_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  gym_id,
  user_id,
  full_name,
  -- Mask email: show only first 2 chars and domain
  CASE 
    WHEN email IS NOT NULL THEN 
      LEFT(email, 2) || '***@' || SPLIT_PART(email, '@', 2)
    ELSE NULL 
  END as email,
  -- Mask phone: show only last 4 digits
  CASE 
    WHEN phone IS NOT NULL THEN 
      '***' || RIGHT(phone, 4)
    ELSE NULL 
  END as phone,
  photo_url,
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
  -- Sensitive fields are hidden in safe view
  NULL::text as address,
  NULL::text as emergency_contact,
  NULL::text as emergency_phone,
  NULL::text as health_conditions,
  notes,
  date_of_birth
FROM public.members
WHERE gdpr_anonymized_at IS NULL;

-- Grant access to the view
GRANT SELECT ON public.members_safe TO authenticated;

COMMENT ON VIEW public.members_safe IS 'Sanitized member view with masked PII, uses SECURITY INVOKER to respect RLS';