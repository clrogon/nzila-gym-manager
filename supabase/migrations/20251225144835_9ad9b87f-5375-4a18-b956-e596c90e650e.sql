-- Create auth_events table for tracking authentication events (separate from immutable audit_logs)
CREATE TABLE IF NOT EXISTS public.auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'SIGN_IN_ATTEMPT', 'SIGN_IN_SUCCESS', 'SIGN_IN_FAILED',
    'SIGN_OUT', 'SIGN_UP_ATTEMPT', 'SIGN_UP_SUCCESS', 'SIGN_UP_FAILED',
    'SESSION_REFRESHED', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS',
    'AUTH_SIGNED_IN', 'AUTH_SIGNED_OUT', 'AUTH_TOKEN_REFRESHED', 'AUTH_USER_UPDATED'
  )),
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own auth events
CREATE POLICY "users_insert_auth_events"
ON public.auth_events FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Super admins can view all events
CREATE POLICY "super_admins_view_auth_events"
ON public.auth_events FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Gym admins can view events for users in their gym
CREATE POLICY "gym_admins_view_auth_events"
ON public.auth_events FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT ur.user_id FROM user_roles ur
    WHERE ur.gym_id IN (SELECT get_user_gym_ids(auth.uid()))
  )
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('gym_owner', 'admin')
  )
);

-- Create indexes for performance
CREATE INDEX idx_auth_events_user_id ON public.auth_events(user_id, created_at DESC);
CREATE INDEX idx_auth_events_type ON public.auth_events(event_type, created_at DESC);

-- Create GDPR consent table
CREATE TABLE IF NOT EXISTS public.gdpr_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'marketing_emails', 'analytics_tracking', 'third_party_sharing', 'terms_of_service', 'privacy_policy'
  )),
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, consent_type)
);

-- Enable RLS
ALTER TABLE public.gdpr_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consents
CREATE POLICY "users_view_own_consents"
ON public.gdpr_consents FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can manage their own consents
CREATE POLICY "users_manage_own_consents"
ON public.gdpr_consents FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create data export requests table
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "users_view_own_export_requests"
ON public.data_export_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own requests
CREATE POLICY "users_create_own_export_requests"
ON public.data_export_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create deletion requests table
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cooling_off', 'processing', 'completed', 'cancelled')),
  reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  cooling_off_ends_at TIMESTAMPTZ, -- 30 day cooling off period
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "users_view_own_deletion_requests"
ON public.deletion_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own requests
CREATE POLICY "users_create_own_deletion_requests"
ON public.deletion_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can cancel their own requests (during cooling off period)
CREATE POLICY "users_cancel_own_deletion_requests"
ON public.deletion_requests FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'cooling_off')
WITH CHECK (user_id = auth.uid());

-- Add rate limiting table for authentication
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email or IP
  attempts INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier)
);

-- Create function to clean up expired rate limits
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.auth_rate_limits WHERE reset_at < NOW();
END;
$$;

-- Create update timestamp trigger for gdpr_consents
CREATE TRIGGER update_gdpr_consents_updated_at
BEFORE UPDATE ON public.gdpr_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();