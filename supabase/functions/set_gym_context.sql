CREATE OR REPLACE FUNCTION public.set_gym_context(gym_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_gym', gym_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
