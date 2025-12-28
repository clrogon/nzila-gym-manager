-- Fix security definer view by using SECURITY INVOKER
DROP VIEW IF EXISTS auth_rate_limit_stats;

CREATE VIEW auth_rate_limit_stats 
WITH (security_invoker = true)
AS
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