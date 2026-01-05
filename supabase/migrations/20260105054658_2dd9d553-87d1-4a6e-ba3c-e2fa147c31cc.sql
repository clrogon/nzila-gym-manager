-- Create a table to track email notifications (for audit and preventing duplicates)
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view email notifications
CREATE POLICY "Super admins can view all email notifications"
ON public.email_notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- System can insert (via service role)
CREATE POLICY "Service role can insert email notifications"
ON public.email_notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX idx_email_notifications_email_type ON public.email_notifications(email_type);