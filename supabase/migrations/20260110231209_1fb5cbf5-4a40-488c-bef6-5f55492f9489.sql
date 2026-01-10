-- Fix profiles table RLS policies
-- Problem: All policies are RESTRICTIVE which requires ALL to pass
-- Solution: Make access-granting policies PERMISSIVE (default), keep deny as RESTRICTIVE

-- Drop existing policies
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Gym admins can view profiles of gym members" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create PERMISSIVE policies for authenticated access (at least one must pass)

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Gym admins can view profiles of members in their gym
CREATE POLICY "Gym admins can view gym member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur_viewer
    WHERE ur_viewer.user_id = auth.uid()
      AND ur_viewer.role IN ('gym_owner', 'admin')
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur_target
        WHERE ur_target.user_id = profiles.id
          AND ur_target.gym_id = ur_viewer.gym_id
      )
  )
);

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RESTRICTIVE policy to block anonymous access (this is additional constraint)
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);