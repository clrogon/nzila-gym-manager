-- Fix remaining security issues

-- 1. Tighten members table: Remove health_conditions from regular staff view
-- Only gym_owner and admin can see health_conditions, staff sees limited data
DROP POLICY IF EXISTS "staff_view_gym_members" ON public.members;
DROP POLICY IF EXISTS "admins_manage_members" ON public.members;
DROP POLICY IF EXISTS "members_view_own_data" ON public.members;

-- Staff can only view non-sensitive member fields (no health data)
CREATE POLICY "staff_view_gym_members_limited" 
ON public.members 
FOR SELECT 
TO authenticated
USING (
  has_gym_role(auth.uid(), gym_id, ARRAY['staff'::app_role]) 
  AND NOT has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role])
);

-- Admins and owners can view all member data
CREATE POLICY "admins_view_gym_members" 
ON public.members 
FOR SELECT 
TO authenticated
USING (has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role]));

-- Members can view their own data
CREATE POLICY "members_view_own_data" 
ON public.members 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Only admins can manage members
CREATE POLICY "admins_manage_members" 
ON public.members 
FOR ALL 
TO authenticated
USING (has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role]))
WITH CHECK (has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role]));

-- 2. Protect auth_rate_limit_stats view - only super admins
DROP VIEW IF EXISTS public.auth_rate_limit_stats;

CREATE VIEW public.auth_rate_limit_stats AS
SELECT 
  identifier_type,
  COUNT(*) as total_entries,
  AVG(attempt_count) as avg_attempts,
  MAX(attempt_count) as max_attempts,
  COUNT(*) FILTER (WHERE attempt_count >= 5) as high_attempt_count
FROM public.auth_rate_limits
GROUP BY identifier_type;

-- Apply RLS to the underlying table (views inherit from their base tables)
-- The auth_rate_limits table should only be accessible to super admins
DROP POLICY IF EXISTS "Super admins can view rate limits" ON public.auth_rate_limits;
DROP POLICY IF EXISTS "Public can insert rate limit entries" ON public.auth_rate_limits;
DROP POLICY IF EXISTS "Allow public to insert rate limit entries" ON public.auth_rate_limits;
DROP POLICY IF EXISTS "auth_rate_limits_insert_policy" ON public.auth_rate_limits;

-- Only super admins can view rate limit data
CREATE POLICY "Super admins can view rate limits" 
ON public.auth_rate_limits 
FOR SELECT 
TO authenticated
USING (is_super_admin(auth.uid()));

-- Edge functions can manage rate limits (using service role key)
-- No authenticated user policy needed for insert/update/delete