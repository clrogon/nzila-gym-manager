-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can always view/update their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Gym staff can view profiles of users who belong to their gym (through user_roles)
CREATE POLICY "Gym staff can view profiles of gym members"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur_viewer
    WHERE ur_viewer.user_id = auth.uid()
    AND ur_viewer.role IN ('gym_owner', 'admin', 'staff')
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
USING (is_super_admin(auth.uid()));