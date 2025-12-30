-- Tighten leads table RLS: Only gym_owner and admin can access leads, not regular staff
-- This protects prospective customer contact information

-- Drop existing policies on leads table
DROP POLICY IF EXISTS "Users can create leads in their gyms" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads in their gyms" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads in their gyms" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads in their gyms" ON public.leads;

-- Recreate with stricter access: Only gym_owner and admin roles
CREATE POLICY "Admins can create leads in their gyms" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role]));

CREATE POLICY "Admins can view leads in their gyms" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role]));

CREATE POLICY "Admins can update leads in their gyms" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role]));

CREATE POLICY "Admins can delete leads in their gyms" 
ON public.leads 
FOR DELETE 
TO authenticated
USING (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role]));