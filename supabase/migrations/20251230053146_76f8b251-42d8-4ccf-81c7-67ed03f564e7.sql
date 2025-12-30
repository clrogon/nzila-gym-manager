-- Tighten profiles RLS: Only owners/admins can view other profiles, not regular staff
-- Staff should only see their own profile

-- Drop the existing staff policy that's too permissive
DROP POLICY IF EXISTS "Gym staff can view profiles of gym members" ON public.profiles;

-- Recreate with stricter access: Only gym_owner and admin can view other profiles
CREATE POLICY "Gym admins can view profiles of gym members" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur_viewer
    WHERE ur_viewer.user_id = auth.uid()
    AND ur_viewer.role = ANY(ARRAY['gym_owner'::app_role, 'admin'::app_role])
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur_target
      WHERE ur_target.user_id = profiles.id
      AND ur_target.gym_id = ur_viewer.gym_id
    )
  )
);