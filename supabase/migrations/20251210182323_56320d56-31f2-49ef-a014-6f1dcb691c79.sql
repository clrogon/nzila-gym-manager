-- Drop existing INSERT policy on gyms
DROP POLICY IF EXISTS "Authenticated users can create gyms" ON public.gyms;

-- Create new policy that only allows gym_owner or super_admin to create gyms
CREATE POLICY "Only gym owners can create gyms"
ON public.gyms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('gym_owner', 'super_admin')
  )
);