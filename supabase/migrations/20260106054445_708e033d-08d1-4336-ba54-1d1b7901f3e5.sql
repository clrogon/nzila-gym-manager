-- Create platform_plans table for SaaS pricing tiers
CREATE TABLE public.platform_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric,
  features jsonb DEFAULT '[]'::jsonb,
  max_members integer,
  max_staff integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create gym_subscriptions table for tracking gym subscriptions
CREATE TABLE public.gym_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.platform_plans(id),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  trial_ends_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(gym_id)
);

-- Create platform_audit_logs table for super admin actions
CREATE TABLE public.platform_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  user_agent text,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.platform_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

-- Platform plans: Super admins can manage, everyone can view active plans
CREATE POLICY "Super admins can manage platform plans"
  ON public.platform_plans FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Anyone can view active platform plans"
  ON public.platform_plans FOR SELECT
  USING (is_active = true);

-- Gym subscriptions: Super admins can manage all, gym owners can view their own
CREATE POLICY "Super admins can manage gym subscriptions"
  ON public.gym_subscriptions FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Gym owners can view their subscription"
  ON public.gym_subscriptions FOR SELECT
  USING (has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role]));

-- Platform audit logs: Only super admins can view/insert
CREATE POLICY "Super admins can view platform audit logs"
  ON public.platform_audit_logs FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert platform audit logs"
  ON public.platform_audit_logs FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

-- Insert default platform plans
INSERT INTO public.platform_plans (name, description, price_monthly, price_yearly, max_members, max_staff, features) VALUES
  ('Basic', 'For small gyms just getting started', 49.99, 499.99, 100, 5, '["Member management", "Basic check-ins", "Email support"]'),
  ('Professional', 'For growing gyms with advanced needs', 99.99, 999.99, 500, 20, '["Member management", "Advanced scheduling", "Financial reporting", "Priority support"]'),
  ('Enterprise', 'For large gyms and gym chains', 249.99, 2499.99, NULL, NULL, '["Unlimited members", "Unlimited staff", "Multi-location", "API access", "Dedicated support"]');

-- Add timestamp trigger for updated_at
CREATE TRIGGER update_platform_plans_updated_at
  BEFORE UPDATE ON public.platform_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gym_subscriptions_updated_at
  BEFORE UPDATE ON public.gym_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();