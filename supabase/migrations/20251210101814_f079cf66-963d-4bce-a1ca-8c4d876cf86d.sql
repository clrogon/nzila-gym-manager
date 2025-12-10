-- Allow authenticated users to create gyms
CREATE POLICY "Authenticated users can create gyms"
ON public.gyms
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also need to allow users to create their own role when creating a gym
CREATE POLICY "Users can create their own role for new gyms"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);