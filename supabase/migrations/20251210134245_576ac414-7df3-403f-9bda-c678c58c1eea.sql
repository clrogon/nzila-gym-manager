-- Allow gym_id to be nullable for super_admin role
ALTER TABLE public.user_roles ALTER COLUMN gym_id DROP NOT NULL;

-- Add a check constraint to ensure gym_id is only null for super_admin
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_gym_id_check 
CHECK (role = 'super_admin' OR gym_id IS NOT NULL);

-- Update has_gym_role function to handle super_admin (platform-wide access)
CREATE OR REPLACE FUNCTION public.has_gym_role(_user_id uuid, _gym_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        -- Check if user is super_admin (platform-wide)
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id
        AND role = 'super_admin'
    ) OR EXISTS (
        -- Check if user has specific role for this gym
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id
        AND gym_id = _gym_id
        AND role = ANY(_roles)
    )
$$;

-- Create function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id
        AND role = 'super_admin'
    )
$$;