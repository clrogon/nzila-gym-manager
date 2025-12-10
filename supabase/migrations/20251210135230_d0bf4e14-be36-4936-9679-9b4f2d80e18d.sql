-- Update gyms SELECT policy to allow super_admin to see ALL gyms
DROP POLICY IF EXISTS "gyms_select_policy" ON public.gyms;

CREATE POLICY "gyms_select_policy" 
ON public.gyms 
FOR SELECT 
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR id IN (SELECT gym_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- Allow super_admin to update any gym
DROP POLICY IF EXISTS "gyms_update_policy" ON public.gyms;

CREATE POLICY "gyms_update_policy" 
ON public.gyms 
FOR UPDATE 
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR has_gym_role(auth.uid(), id, ARRAY['gym_owner'::app_role, 'admin'::app_role])
);

-- Allow super_admin to delete gyms
CREATE POLICY "gyms_delete_policy" 
ON public.gyms 
FOR DELETE 
TO authenticated
USING (is_super_admin(auth.uid()));