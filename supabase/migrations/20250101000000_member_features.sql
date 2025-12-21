-- Adicionar campos à tabela members
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS medical_notes text,
ADD COLUMN IF NOT EXISTS is_dependent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'members' CHECK (profile_visibility IN ('public', 'members', 'private')),
ADD COLUMN IF NOT EXISTS show_email_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_phone_public boolean DEFAULT false;

-- Criar tabela de dependentes
CREATE TABLE IF NOT EXISTS member_dependents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  dependent_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  relationship text NOT NULL CHECK (relationship IN ('son', 'daughter', 'spouse', 'sibling', 'parent', 'other')),
  can_checkin_alone boolean DEFAULT false,
  emergency_contact text,
  emergency_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(primary_member_id, dependent_member_id),
  CHECK (primary_member_id != dependent_member_id)
);

-- Criar tabela de preferências de utilizador
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id uuid REFERENCES gyms(id) ON DELETE CASCADE,
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_member_dependents_primary ON member_dependents(primary_member_id);
CREATE INDEX IF NOT EXISTS idx_member_dependents_dependent ON member_dependents(dependent_member_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_gym ON user_preferences(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_is_dependent ON members(is_dependent);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_dependents_updated_at
  BEFORE UPDATE ON member_dependents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies para member_dependents
ALTER TABLE member_dependents ENABLE ROW LEVEL SECURITY;

-- Policy: Membros podem ver seus dependentes
CREATE POLICY "Members can view their dependents"
  ON member_dependents FOR SELECT
  USING (
    primary_member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Policy: Membros podem inserir dependentes
CREATE POLICY "Members can insert their dependents"
  ON member_dependents FOR INSERT
  WITH CHECK (
    primary_member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Policy: Membros podem atualizar seus dependentes
CREATE POLICY "Members can update their dependents"
  ON member_dependents FOR UPDATE
  USING (
    primary_member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Policy: Membros podem deletar seus dependentes
CREATE POLICY "Members can delete their dependents"
  ON member_dependents FOR DELETE
  USING (
    primary_member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Policy: Staff pode ver todos os dependentes do gym
CREATE POLICY "Staff can view all gym dependents"
  ON member_dependents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN members m ON m.id = member_dependents.primary_member_id
      WHERE ur.user_id = auth.uid()
      AND ur.gym_id = m.gym_id
      AND ur.role IN ('gym_owner', 'admin', 'staff')
    )
  );

-- RLS Policies para user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Utilizadores podem ver suas próprias preferências
CREATE POLICY "Users can view their preferences"
  ON user_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Utilizadores podem inserir suas preferências
CREATE POLICY "Users can insert their preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Utilizadores podem atualizar suas preferências
CREATE POLICY "Users can update their preferences"
  ON user_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Utilizadores podem deletar suas preferências
CREATE POLICY "Users can delete their preferences"
  ON user_preferences FOR DELETE
  USING (user_id = auth.uid());

-- Atualizar policy de members para incluir visibilidade
DROP POLICY IF EXISTS "Members can view members" ON members;

CREATE POLICY "Members can view visible profiles"
  ON members FOR SELECT
  USING (
    -- Próprio perfil
    user_id = auth.uid()
    OR
    -- Perfis públicos
    profile_visibility = 'public'
    OR
    -- Perfis de membros do mesmo gym (se visibility = 'members')
    (
      profile_visibility = 'members'
      AND gym_id IN (
        SELECT gym_id FROM members WHERE user_id = auth.uid()
      )
    )
    OR
    -- Staff pode ver todos do gym
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.gym_id = members.gym_id
      AND ur.role IN ('gym_owner', 'admin', 'staff')
    )
  );
