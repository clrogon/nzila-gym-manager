-- Create a secure view for member data that hides sensitive fields from non-admin staff
-- This implements field-level security: only gym_owner and admin can see health/emergency data

CREATE OR REPLACE VIEW public.members_safe AS
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

-- Add a comment explaining the view's purpose
COMMENT ON VIEW public.members_safe IS 'Secure view for member data. Sensitive fields (health_conditions, emergency_contact, emergency_phone) are only visible to gym_owner and admin roles. Staff can see basic member info but not sensitive health/emergency data.';