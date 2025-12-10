-- Drop ALL existing policies on gyms
DROP POLICY IF EXISTS "Anyone authenticated can create gyms" ON public.gyms;
DROP POLICY IF EXISTS "Gym owners can update their gym" ON public.gyms;
DROP POLICY IF EXISTS "Users can view their gyms" ON public.gyms;

-- Recreate with explicit PERMISSIVE policies
CREATE POLICY "gyms_insert_policy" 
ON public.gyms 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "gyms_select_policy" 
ON public.gyms 
FOR SELECT 
TO authenticated
USING (
  id IN (SELECT gym_id FROM public.user_roles WHERE user_id = auth.uid())
  OR 
  NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "gyms_update_policy" 
ON public.gyms 
FOR UPDATE 
TO authenticated
USING (has_gym_role(auth.uid(), id, ARRAY['gym_owner'::app_role, 'admin'::app_role]));