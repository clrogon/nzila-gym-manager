-- ============================================================================
-- SERVER-SIDE RATE LIMITING IMPLEMENTATION
-- ============================================================================

-- Table to track authentication attempts
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP address or email
  identifier_type text NOT NULL CHECK (identifier_type IN ('ip', 'email')),
  attempt_count integer DEFAULT 1,
  first_attempt_at timestamptz DEFAULT now(),
  last_attempt_at timestamptz DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier 
ON auth_rate_limits(identifier, identifier_type);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_blocked 
ON auth_rate_limits(blocked_until) 
WHERE blocked_until IS NOT NULL;

-- Enable RLS
ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system/admins can view rate limit data
CREATE POLICY "Only admins can view rate limits"
ON auth_rate_limits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'gym_owner')
  )
);

-- ============================================================================
-- RATE LIMITING FUNCTIONS
-- ============================================================================

-- Function to check and record auth attempts
CREATE OR REPLACE FUNCTION check_auth_rate_limit(
  p_identifier text,
  p_identifier_type text DEFAULT 'ip'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record auth_rate_limits%ROWTYPE;
  v_max_attempts integer := 5;
  v_window_minutes integer := 15;
  v_block_minutes integer := 30;
  v_result jsonb;
BEGIN
  -- Clean up old records (older than 24 hours)
  DELETE FROM auth_rate_limits
  WHERE created_at < now() - interval '24 hours';

  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM auth_rate_limits
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
  FOR UPDATE;

  -- Check if currently blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'temporarily_blocked',
      'blocked_until', v_record.blocked_until,
      'retry_after_seconds', EXTRACT(EPOCH FROM (v_record.blocked_until - now()))::integer
    );
  END IF;

  -- If no record exists, create one
  IF v_record IS NULL THEN
    INSERT INTO auth_rate_limits (identifier, identifier_type, attempt_count)
    VALUES (p_identifier, p_identifier_type, 1)
    RETURNING * INTO v_record;

    RETURN jsonb_build_object(
      'allowed', true,
      'attempts_remaining', v_max_attempts - 1
    );
  END IF;

  -- Check if we're within the time window
  IF v_record.first_attempt_at > now() - (v_window_minutes || ' minutes')::interval THEN
    -- Within window, increment counter
    IF v_record.attempt_count >= v_max_attempts THEN
      -- Block the identifier
      UPDATE auth_rate_limits
      SET blocked_until = now() + (v_block_minutes || ' minutes')::interval,
          last_attempt_at = now()
      WHERE id = v_record.id;

      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'rate_limit_exceeded',
        'blocked_until', now() + (v_block_minutes || ' minutes')::interval,
        'retry_after_seconds', v_block_minutes * 60
      );
    ELSE
      -- Increment attempt count
      UPDATE auth_rate_limits
      SET attempt_count = attempt_count + 1,
          last_attempt_at = now()
      WHERE id = v_record.id;

      RETURN jsonb_build_object(
        'allowed', true,
        'attempts_remaining', v_max_attempts - (v_record.attempt_count + 1)
      );
    END IF;
  ELSE
    -- Outside window, reset counter
    UPDATE auth_rate_limits
    SET attempt_count = 1,
        first_attempt_at = now(),
        last_attempt_at = now(),
        blocked_until = NULL
    WHERE id = v_record.id;

    RETURN jsonb_build_object(
      'allowed', true,
      'attempts_remaining', v_max_attempts - 1
    );
  END IF;
END;
$$;

-- Function to reset rate limit (for successful auth)
CREATE OR REPLACE FUNCTION reset_auth_rate_limit(
  p_identifier text,
  p_identifier_type text DEFAULT 'ip'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth_rate_limits
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type;
END;
$$;

-- ============================================================================
-- POSTGRES FUNCTION TO GET CLIENT IP
-- ============================================================================

-- Function to extract IP from request headers
CREATE OR REPLACE FUNCTION get_client_ip()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Try to get IP from various headers (set by proxies/load balancers)
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'x-real-ip',
    current_setting('request.headers', true)::json->>'cf-connecting-ip',
    inet_client_addr()::text
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN inet_client_addr()::text;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to check rate limits
GRANT EXECUTE ON FUNCTION check_auth_rate_limit(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION reset_auth_rate_limit(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_ip() TO authenticated, anon;

-- ============================================================================
-- RATE LIMIT MONITORING VIEW (for admins)
-- ============================================================================

CREATE OR REPLACE VIEW auth_rate_limit_stats AS
SELECT 
  identifier_type,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE blocked_until > now()) as currently_blocked,
  AVG(attempt_count)::numeric(10,2) as avg_attempts,
  MAX(attempt_count) as max_attempts,
  COUNT(*) FILTER (WHERE attempt_count >= 5) as high_attempt_count
FROM auth_rate_limits
GROUP BY identifier_type;

GRANT SELECT ON auth_rate_limit_stats TO authenticated;
