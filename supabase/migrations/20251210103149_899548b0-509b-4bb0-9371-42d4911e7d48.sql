-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Authenticated users can create gyms" ON public.gyms;

-- Allow any authenticated user to insert a gym
CREATE POLICY "Authenticated users can create gyms"
ON public.gyms
FOR INSERT
TO authenticated
WITH CHECK (true);