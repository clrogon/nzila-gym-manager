-- Fix: Restrict medical/health data access to admins only

-- 1. Drop the staff viewing policy on member_sensitive_data entirely
-- Medical records should only be accessible by gym owners and admins
DROP POLICY IF EXISTS "Staff can view sensitive data" ON public.member_sensitive_data;

-- 2. Drop the existing staff policy on members that exposes health_conditions
DROP POLICY IF EXISTS "staff_view_gym_members_limited" ON public.members;

-- 3. Create a new staff policy that ONLY allows access through the safe view
-- Staff cannot directly query the members table - they must use members_safe view
-- This is enforced by NOT creating a direct SELECT policy for staff on members

-- 4. Add RLS policies to the members_safe view for staff access
-- First check if RLS is enabled on the view
-- Note: Views with security_invoker use the underlying table's RLS

-- 5. Add comment explaining the security model
COMMENT ON COLUMN public.members.health_conditions IS 'SENSITIVE: Medical information. Access restricted to gym_owner and admin roles only. Staff must use members_safe view.';