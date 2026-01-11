-- Platform announcements for SaaS admin communications
CREATE TABLE public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'critical', 'maintenance')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'gym_owners', 'active_subscribers')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Support tickets for platform support
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  category TEXT DEFAULT 'general' CHECK (category IN ('billing', 'technical', 'feature_request', 'bug', 'general')),
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Support ticket messages for conversation thread
CREATE TABLE public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feature flags for controlled rollouts
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_gyms UUID[] DEFAULT '{}',
  target_plans TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Platform settings for global configuration
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- System health metrics
CREATE TABLE public.system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);

-- Enable RLS on all tables
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_announcements
CREATE POLICY "Super admins can manage announcements" ON public.platform_announcements
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Active announcements visible to authenticated users" ON public.platform_announcements
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at >= now()));

-- RLS Policies for support_tickets  
CREATE POLICY "Super admins can manage all tickets" ON public.support_tickets
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Gym owners can view their gym tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND gym_id = support_tickets.gym_id AND role = 'gym_owner'
  ));

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for support_ticket_messages
CREATE POLICY "Super admins can manage all messages" ON public.support_ticket_messages
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Ticket participants can view non-internal messages" ON public.support_ticket_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.is_super_admin(auth.uid())))
    AND (is_internal = false OR public.is_super_admin(auth.uid()))
  );

-- RLS Policies for feature_flags (super admin only)
CREATE POLICY "Super admins can manage feature flags" ON public.feature_flags
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for platform_settings (super admin only)  
CREATE POLICY "Super admins can manage platform settings" ON public.platform_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for system_health_metrics (super admin only)
CREATE POLICY "Super admins can view system metrics" ON public.system_health_metrics
  FOR SELECT USING (public.is_super_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_gym ON public.support_tickets(gym_id);
CREATE INDEX idx_platform_announcements_active ON public.platform_announcements(is_active, starts_at, ends_at);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags(is_enabled);
CREATE INDEX idx_system_health_metrics_time ON public.system_health_metrics(recorded_at DESC);

-- Update triggers
CREATE TRIGGER update_platform_announcements_updated_at BEFORE UPDATE ON public.platform_announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();