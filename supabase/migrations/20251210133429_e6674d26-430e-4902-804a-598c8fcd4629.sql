-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone authenticated can create gyms" ON public.gyms;

-- Create a PERMISSIVE INSERT policy (default is PERMISSIVE)
CREATE POLICY "Anyone authenticated can create gyms" 
ON public.gyms 
FOR INSERT 
TO authenticated
WITH CHECK (true);