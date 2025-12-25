-- Fix gym creation policy conflict
-- Remove the overly permissive policy that allows any authenticated user to create gyms

DROP POLICY IF EXISTS "Anyone authenticated can create gyms" ON public.gyms;

-- The existing restrictive policy "Only gym owners can create gyms" remains in place
-- and properly enforces that only users with gym_owner or super_admin roles can create gyms