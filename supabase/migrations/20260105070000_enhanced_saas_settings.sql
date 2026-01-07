-- ============================================================================
-- ENHANCED SAAS SETTINGS AND FEATURE MANAGEMENT
-- Migration: 20260105070000_enhanced_saas_settings.sql
-- ============================================================================

-- 1. Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- 2. Feature Flags Table
CREATE TABLE IF NOT EXISTS public.platform_features (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    description text,
    is_beta boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 3. Gym Feature Overrides Table
CREATE TABLE IF NOT EXISTS public.gym_feature_overrides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    feature_id uuid NOT NULL REFERENCES public.platform_features(id) ON DELETE CASCADE,
    is_enabled boolean NOT NULL DEFAULT true,
    custom_limits jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(gym_id, feature_id)
);

-- 4. Platform Announcements Table
CREATE TABLE IF NOT EXISTS public.platform_announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    target_audience text NOT NULL CHECK (target_audience IN ('all', 'gym_owners', 'staff')),
    is_active boolean DEFAULT true,
    starts_at timestamptz DEFAULT now(),
    ends_at timestamptz,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- 5. Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Only Super Admins can manage platform settings, features, and overrides
CREATE POLICY "Super admins can manage platform settings"
ON public.platform_settings FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Super admins can manage platform features"
ON public.platform_features FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Super admins can manage gym feature overrides"
ON public.gym_feature_overrides FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Super admins can manage platform announcements"
ON public.platform_announcements FOR ALL TO authenticated
USING (public.is_super_admin());

-- Gym users can view active announcements for their audience
CREATE POLICY "Users can view relevant announcements"
ON public.platform_announcements FOR SELECT TO authenticated
USING (
    is_active = true 
    AND (ends_at IS NULL OR ends_at > now())
    AND (starts_at <= now())
);

-- Gym owners can view their own feature overrides
CREATE POLICY "Gym owners can view own feature overrides"
ON public.gym_feature_overrides FOR SELECT TO authenticated
USING (public.has_gym_access(gym_id));

-- 7. Seed initial features
INSERT INTO public.platform_features (name, code, description)
VALUES 
('Advanced Analytics', 'ADV_ANALYTICS', 'Detailed reporting and business intelligence dashboards'),
('Mobile App Access', 'MOBILE_APP', 'Access to the dedicated mobile application for members'),
('Inventory Management', 'INVENTORY', 'Track and manage gym equipment and retail products'),
('POS System', 'POS', 'Point of Sale system for selling products and services'),
('Multi-Location', 'MULTI_LOCATION', 'Manage multiple physical locations under one gym account');

-- 8. Seed initial platform settings
INSERT INTO public.platform_settings (key, value, description)
VALUES 
('maintenance_mode', '{"enabled": false, "message": "System is undergoing maintenance."}', 'Global maintenance mode toggle'),
('default_gym_settings', '{"currency": "USD", "timezone": "UTC", "language": "en"}', 'Default settings for new gym accounts');

-- 9. Add triggers for updated_at
CREATE TRIGGER update_gym_feature_overrides_updated_at
    BEFORE UPDATE ON public.gym_feature_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
