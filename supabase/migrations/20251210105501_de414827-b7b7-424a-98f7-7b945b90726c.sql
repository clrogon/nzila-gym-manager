-- Drop ALL existing policies on gyms table and recreate them as PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users can create gyms" ON public.gyms;
DROP POLICY IF EXISTS "Users can view gyms they belong to" ON public.gyms;
DROP POLICY IF EXISTS "Gym owners and admins can update their gym" ON public.gyms;

-- Recreate INSERT policy - allow any authenticated user to create a gym
CREATE POLICY "Anyone authenticated can create gyms"
ON public.gyms
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Recreate SELECT policy - users can view gyms they belong to
CREATE POLICY "Users can view their gyms"
ON public.gyms
FOR SELECT
TO authenticated
USING (id IN (SELECT gym_id FROM public.user_roles WHERE user_id = auth.uid()));

-- Recreate UPDATE policy - only gym owners/admins can update
CREATE POLICY "Gym owners can update their gym"
ON public.gyms
FOR UPDATE
TO authenticated
USING (has_gym_role(auth.uid(), id, ARRAY['gym_owner'::app_role, 'admin'::app_role]));