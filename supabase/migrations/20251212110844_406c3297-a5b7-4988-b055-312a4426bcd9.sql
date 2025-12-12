-- Drop and recreate view with explicit SECURITY INVOKER to address linter warning
-- SECURITY INVOKER means the view uses the querying user's permissions, which is correct for RLS
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
  date_of_birth,
  address,
  photo_url,
  notes,
  status,
  membership_plan_id,
  membership_start_date,
  membership_end_date,
  is_minor,
  tutor_id,
  gdpr_consent_at,
  gdpr_anonymized_at,
  created_at,
  updated_at,
  -- Sensitive fields: only visible to gym_owner or admin
  CASE 
    WHEN has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role])
    THEN health_conditions
    ELSE NULL
  END AS health_conditions,
  CASE 
    WHEN has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role])
    THEN emergency_contact
    ELSE NULL
  END AS emergency_contact,
  CASE 
    WHEN has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role])
    THEN emergency_phone
    ELSE NULL
  END AS emergency_phone
FROM public.members;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.members_safe TO authenticated;

COMMENT ON VIEW public.members_safe IS 'Secure view for member data with SECURITY INVOKER. Sensitive fields (health_conditions, emergency_contact, emergency_phone) are only visible to gym_owner and admin roles.';