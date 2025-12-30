-- Fix profiles table RLS to block anonymous/public access
-- Drop existing policies and recreate with proper PERMISSIVE policies

-- First, drop existing SELECT policies (they are RESTRICTIVE which is wrong)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Gym staff can view profiles of gym members" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Recreate as PERMISSIVE policies (default) - these grant access only to authenticated users
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Policy 2: Gym staff can view profiles of gym members in their gym
CREATE POLICY "Gym staff can view profiles of gym members" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur_viewer
    WHERE ur_viewer.user_id = auth.uid()
    AND ur_viewer.role = ANY(ARRAY['gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role])
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur_target
      WHERE ur_target.user_id = profiles.id
      AND ur_target.gym_id = ur_viewer.gym_id
    )
  )
);

-- Policy 3: Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_super_admin(auth.uid()));

-- Ensure RLS is enabled (should already be, but confirm)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (prevents bypass)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;