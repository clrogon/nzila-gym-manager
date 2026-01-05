-- Update handle_new_user to also call the edge function for welcome email
-- We use pg_net extension to make HTTP calls from database triggers

-- First, create a function to send welcome email via edge function
CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url text;
  service_role_key text;
BEGIN
  -- Get the edge function URL from environment
  edge_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-welcome-email';
  
  -- Insert a record to track the email notification
  INSERT INTO public.email_notifications (
    user_id,
    email_type,
    recipient_email,
    status,
    metadata
  ) VALUES (
    NEW.id,
    'welcome_self_signup',
    NEW.email,
    'queued',
    jsonb_build_object('full_name', NEW.full_name, 'created_at', NEW.created_at)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after profile insert
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;
CREATE TRIGGER on_profile_created_send_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user();