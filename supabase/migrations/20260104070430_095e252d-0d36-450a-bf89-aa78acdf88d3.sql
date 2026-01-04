-- Create a security definer function to check if user has a specific role
-- This prevents privilege escalation by checking roles server-side
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create a function to check if user has any of the specified roles for a gym
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _gym_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check if user is super_admin (platform-wide)
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'super_admin'
  ) OR EXISTS (
    -- Check if user has any of the specified roles for this gym
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND gym_id = _gym_id
    AND role = ANY(_roles)
  )
$$;

-- Create a function to get user's role for a specific gym
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid, _gym_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  AND (gym_id = _gym_id OR role = 'super_admin')
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'gym_owner' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'admin' THEN 4
      ELSE 5
    END
  LIMIT 1
$$;