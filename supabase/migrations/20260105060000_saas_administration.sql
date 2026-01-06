-- ============================================================================
-- SAAS ADMINISTRATION ENHANCEMENTS
-- Migration: 20260105060000_saas_administration.sql
-- ============================================================================

-- 1. Create Platform Plans Table
CREATE TABLE IF NOT EXISTS public.platform_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price_monthly numeric(10, 2) NOT NULL DEFAULT 0,
    price_yearly numeric(10, 2) NOT NULL DEFAULT 0,
    features_json jsonb DEFAULT '{}'::jsonb,
    limits_json jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Create Gym Subscriptions Table
CREATE TABLE IF NOT EXISTS public.gym_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES public.platform_plans(id),
    status text NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled', 'expired', 'trial')),
    billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create Platform Audit Logs Table
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS on new tables
ALTER TABLE public.platform_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Platform Plans
-- Everyone can view active plans
CREATE POLICY "Anyone can view active plans"
ON public.platform_plans FOR SELECT
USING (is_active = true);

-- Only Super Admins can manage plans
CREATE POLICY "Super admins can manage plans"
ON public.platform_plans FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'super_admin'
          AND gym_id IS NULL
    )
);

-- 6. RLS Policies for Gym Subscriptions
-- Gym owners can view their own subscription
CREATE POLICY "Gym owners can view own subscription"
ON public.gym_subscriptions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND gym_id = public.gym_subscriptions.gym_id
          AND role IN ('gym_owner', 'admin')
    )
);

-- Only Super Admins can manage all subscriptions
CREATE POLICY "Super admins can manage all subscriptions"
ON public.gym_subscriptions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'super_admin'
          AND gym_id IS NULL
    )
);

-- 7. RLS Policies for Platform Audit Logs
-- Only Super Admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.platform_audit_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'super_admin'
          AND gym_id IS NULL
    )
);

-- 8. Add trigger for updated_at
CREATE TRIGGER update_platform_plans_updated_at
    BEFORE UPDATE ON public.platform_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_subscriptions_updated_at
    BEFORE UPDATE ON public.gym_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Seed initial plans
INSERT INTO public.platform_plans (name, description, price_monthly, price_yearly, limits_json)
VALUES 
('Basic', 'Perfect for small gyms', 29.00, 290.00, '{"max_members": 100, "max_staff": 2}'),
('Professional', 'For growing fitness centers', 79.00, 790.00, '{"max_members": 500, "max_staff": 10}'),
('Enterprise', 'Unlimited power for large gyms', 199.00, 1990.00, '{"max_members": -1, "max_staff": -1}');
