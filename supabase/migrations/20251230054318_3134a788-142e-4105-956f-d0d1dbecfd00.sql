-- Fix Security Definer View issue by explicitly setting SECURITY INVOKER
DROP VIEW IF EXISTS public.auth_rate_limit_stats;

CREATE VIEW public.auth_rate_limit_stats 
WITH (security_invoker = true)
AS
SELECT 
  identifier_type,
  COUNT(*) as total_entries,
  AVG(attempt_count) as avg_attempts,
  MAX(attempt_count) as max_attempts,
  COUNT(*) FILTER (WHERE attempt_count >= 5) as high_attempt_count
FROM public.auth_rate_limits
GROUP BY identifier_type;