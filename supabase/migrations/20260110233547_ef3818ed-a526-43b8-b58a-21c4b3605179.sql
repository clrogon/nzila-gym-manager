-- Complete fix: Remove staff direct access to members table
-- Staff must use members_safe view which excludes health_conditions

-- Drop the policy that gives staff direct SELECT on members
DROP POLICY IF EXISTS "staff_view_members_via_safe_view" ON public.members;

-- Create policy for members_safe view access by staff
-- Since members_safe has security_invoker, we need a policy on the underlying table
-- But we want to BLOCK direct access while allowing view access

-- Alternative approach: Use a function to check if query is from safe view
-- This is complex, so instead we'll rely on application-level enforcement

-- Actually the cleanest solution is:
-- 1. Keep NO staff policy on members table
-- 2. Grant SELECT on members_safe to authenticated
-- 3. Staff queries members_safe, which only shows safe columns

-- Since members_safe uses security_invoker, it inherits the caller's permissions
-- We need the underlying table to allow the query

-- Let's create a more restrictive approach:
-- Staff can only see specific columns via a SECURITY DEFINER function

CREATE OR REPLACE FUNCTION public.get_gym_members_safe(p_gym_id UUID)
RETURNS TABLE (
  id UUID,
  gym_id UUID,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  status public.member_status,
  membership_plan_id UUID,
  membership_start_date DATE,
  membership_end_date DATE,
  is_minor BOOLEAN,
  tutor_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id,
    m.gym_id,
    m.user_id,
    m.full_name,
    m.email,
    m.phone,
    m.status,
    m.membership_plan_id,
    m.membership_start_date,
    m.membership_end_date,
    m.is_minor,
    m.tutor_id,
    m.created_at,
    m.updated_at
  FROM public.members m
  WHERE m.gym_id = p_gym_id
    AND (
      -- Admins/owners see all
      has_gym_role(auth.uid(), p_gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role])
      -- Staff see members in their gym
      OR has_gym_role(auth.uid(), p_gym_id, ARRAY['staff'::app_role])
      -- Members see themselves
      OR m.user_id = auth.uid()
    )
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_gym_members_safe(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_gym_members_safe IS 'Returns member data without health_conditions column. Safe for staff access.';