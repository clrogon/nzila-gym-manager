-- ============================================================================
-- TENANT ISOLATION FUNCTIONS
-- Migration: 20260105061000_tenant_isolation_functions.sql
-- ============================================================================

-- Function to get the current gym context from the session
CREATE OR REPLACE FUNCTION public.get_current_gym_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN current_setting('app.current_gym_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Function to check if the current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND gym_id IS NULL
  );
END;
$$;

-- Function to check if the current user has access to a specific gym
CREATE OR REPLACE FUNCTION public.has_gym_access(target_gym_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Super admins have access to everything
  IF public.is_super_admin() THEN
    RETURN true;
  END IF;

  -- Check if user has a role in the target gym
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND gym_id = target_gym_id
  );
END;
$$;

-- Update RLS policies for gyms to use the new function
DROP POLICY IF EXISTS "Users can view gyms they belong to" ON public.gyms;
CREATE POLICY "Users can view gyms they belong to"
ON public.gyms FOR SELECT
TO authenticated
USING (public.has_gym_access(id));

-- Ensure only super admins can create or delete gyms
DROP POLICY IF EXISTS "Super admins can manage gyms" ON public.gyms;
CREATE POLICY "Super admins can manage gyms"
ON public.gyms FOR ALL
TO authenticated
USING (public.is_super_admin());
