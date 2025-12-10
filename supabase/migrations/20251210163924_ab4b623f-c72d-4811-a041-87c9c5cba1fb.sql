
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create secure INSERT policy - only allow server-side inserts via service role
-- For client-side, require the user to be inserting their own user_id
CREATE POLICY "Users can insert own audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (
  user_id = auth.uid() 
  AND gym_id IN (SELECT get_user_gym_ids(auth.uid()))
);

-- Fix gyms INSERT policy - require user to have a role entry being created simultaneously
DROP POLICY IF EXISTS "gyms_insert_policy" ON public.gyms;

CREATE POLICY "Authenticated users can create gyms" ON public.gyms
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger to ensure creator gets gym_owner role
CREATE OR REPLACE FUNCTION public.handle_new_gym()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically assign gym_owner role to creator
  INSERT INTO public.user_roles (user_id, gym_id, role)
  VALUES (auth.uid(), NEW.id, 'gym_owner');
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_gym_created ON public.gyms;
CREATE TRIGGER on_gym_created
  AFTER INSERT ON public.gyms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_gym();
