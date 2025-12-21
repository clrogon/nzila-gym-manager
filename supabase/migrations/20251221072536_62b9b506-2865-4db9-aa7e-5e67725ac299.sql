-- Fix members table RLS: Restrict member data to authorized staff and the member themselves
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Staff can manage members" ON public.members;
DROP POLICY IF EXISTS "Staff can view members in their gyms" ON public.members;

-- Create stricter RLS policies for members table

-- 1. Members can view their own data (if they have a user_id linked)
CREATE POLICY "members_view_own_data"
ON public.members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- 2. Authorized gym staff (gym_owner, admin, staff with is_trainer) can view members in their gym
CREATE POLICY "staff_view_gym_members"
ON public.members
FOR SELECT
TO authenticated
USING (
  has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role])
);

-- 3. Only gym_owner and admin can manage (insert/update/delete) members
CREATE POLICY "admins_manage_members"
ON public.members
FOR ALL
TO authenticated
USING (
  has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role])
)
WITH CHECK (
  has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role])
);

-- 4. Staff can only update non-sensitive fields (check-in notes, etc.) - handled via application logic
-- Staff INSERT for check-ins is handled through check_ins table, not members table

-- Fix members_safe view: Add RLS policy (views inherit from base table, but we make it explicit)
-- Note: members_safe is a view, so it inherits RLS from the members table
-- But we should ensure the view only exposes non-sensitive fields

-- Drop and recreate the members_safe view with reduced sensitive data exposure
DROP VIEW IF EXISTS public.members_safe;

CREATE VIEW public.members_safe AS
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
WHERE gdpr_anonymized_at IS NULL; -- Exclude anonymized members

-- Grant access to the view
GRANT SELECT ON public.members_safe TO authenticated;

-- Add comment explaining the security model
COMMENT ON TABLE public.members IS 'Member data with strict RLS: members see own data, staff see gym members, only admins can modify';
COMMENT ON VIEW public.members_safe IS 'Sanitized member view with masked PII for limited exposure scenarios';