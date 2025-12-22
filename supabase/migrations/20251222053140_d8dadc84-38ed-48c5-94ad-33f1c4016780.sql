-- Create member_dependents table
CREATE TABLE IF NOT EXISTS public.member_dependents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  dependent_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  relationship text NOT NULL CHECK (relationship IN ('son', 'daughter', 'spouse', 'sibling', 'parent', 'other')),
  can_checkin_alone boolean DEFAULT false,
  emergency_contact text,
  emergency_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(primary_member_id, dependent_member_id),
  CHECK (primary_member_id != dependent_member_id)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  class_reminders boolean DEFAULT true,
  membership_reminders boolean DEFAULT true,
  payment_reminders boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  reminder_days_before integer DEFAULT 7 CHECK (reminder_days_before BETWEEN 1 AND 30),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, gym_id)
);

-- Add is_dependent column to members if it doesn't exist
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS is_dependent boolean DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_dependents_primary ON public.member_dependents(primary_member_id);
CREATE INDEX IF NOT EXISTS idx_member_dependents_dependent ON public.member_dependents(dependent_member_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_gym ON public.user_preferences(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_is_dependent ON public.members(is_dependent) WHERE is_dependent = true;

-- Triggers for updated_at
CREATE TRIGGER update_member_dependents_updated_at
  BEFORE UPDATE ON public.member_dependents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.member_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for member_dependents

-- Staff can view all dependents in their gym
CREATE POLICY "Staff can view gym dependents"
  ON public.member_dependents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = member_dependents.primary_member_id
      AND has_gym_role(auth.uid(), m.gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role])
    )
  );

-- Staff can manage dependents in their gym
CREATE POLICY "Staff can manage gym dependents"
  ON public.member_dependents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = member_dependents.primary_member_id
      AND has_gym_role(auth.uid(), m.gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role])
    )
  );

-- Members can view their own dependents
CREATE POLICY "Members can view own dependents"
  ON public.member_dependents FOR SELECT
  USING (
    primary_member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- Members can manage their own dependents
CREATE POLICY "Members can manage own dependents"
  ON public.member_dependents FOR ALL
  USING (
    primary_member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for user_preferences

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences FOR DELETE
  USING (user_id = auth.uid());