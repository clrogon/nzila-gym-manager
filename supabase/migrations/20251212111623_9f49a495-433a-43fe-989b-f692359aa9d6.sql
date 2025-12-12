-- Fix: Restrict user_roles INSERT policy to only allow 'member' role self-assignment
-- This prevents privilege escalation where users could assign themselves admin/owner roles

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can create their own role for new gyms" ON public.user_roles;

-- Create a restrictive policy that only allows users to assign themselves the 'member' role
CREATE POLICY "Users can only create member role for themselves"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'member'::app_role
);

-- Add a comment explaining the security rationale
COMMENT ON POLICY "Users can only create member role for themselves" ON public.user_roles IS 
'Security: Users can only self-assign the member role. Admin, staff, gym_owner, and super_admin roles must be assigned by gym owners or super admins through the existing management policies.';