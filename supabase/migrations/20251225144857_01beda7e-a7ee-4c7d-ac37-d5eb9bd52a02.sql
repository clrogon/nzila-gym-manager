-- Enable RLS on auth_rate_limits table
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- No user access needed - this table is only used by edge functions with service role
-- Add a policy that denies all direct access (service role bypasses RLS)
CREATE POLICY "deny_all_auth_rate_limits"
ON public.auth_rate_limits FOR ALL
TO authenticated
USING (false);