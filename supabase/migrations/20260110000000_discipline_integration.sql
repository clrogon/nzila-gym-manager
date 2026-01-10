-- Add discipline_id to gym_exercises
ALTER TABLE gym_exercises ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES disciplines(id) ON DELETE SET NULL;

-- Add discipline_id to workout_templates
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES disciplines(id) ON DELETE SET NULL;

-- Create trainer_disciplines join table for trainer skills/certifications
CREATE TABLE IF NOT EXISTS trainer_disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  certified BOOLEAN DEFAULT false,
  certification_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, discipline_id)
);

-- Create member_disciplines table to track member's primary disciplines
CREATE TABLE IF NOT EXISTS member_disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, discipline_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gym_exercises_discipline_id ON gym_exercises(discipline_id);
CREATE INDEX IF NOT EXISTS idx_gym_exercises_gym_discipline ON gym_exercises(gym_id, discipline_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_discipline_id ON workout_templates(discipline_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_gym_discipline ON workout_templates(gym_id, discipline_id);
CREATE INDEX IF NOT EXISTS idx_trainer_disciplines_user_id ON trainer_disciplines(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_disciplines_discipline_id ON trainer_disciplines(discipline_id);
CREATE INDEX IF NOT EXISTS idx_member_disciplines_member_id ON member_disciplines(member_id);
CREATE INDEX IF NOT EXISTS idx_member_disciplines_discipline_id ON member_disciplines(discipline_id);

-- Add updated_at trigger for trainer_disciplines
CREATE OR REPLACE FUNCTION update_trainer_disciplines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trainer_disciplines_updated_at
  BEFORE UPDATE ON trainer_disciplines
  FOR EACH ROW
  EXECUTE FUNCTION update_trainer_disciplines_updated_at();

-- Add comment to describe the new tables
COMMENT ON TABLE trainer_disciplines IS 'Stores trainer skills and discipline certifications. Links trainers to the disciplines they are qualified to teach.';

COMMENT ON TABLE member_disciplines IS 'Stores member discipline preferences. Tracks which disciplines a member participates in, including their primary discipline.';

COMMENT ON COLUMN trainer_disciplines.certified IS 'Whether the trainer has a formal certification in this discipline';

COMMENT ON COLUMN trainer_disciplines.certification_date IS 'Date when the trainer obtained certification in this discipline';

COMMENT ON COLUMN member_disciplines.is_primary IS 'Whether this is the member''s main discipline (e.g., for billing, priority scheduling)';

-- Enable RLS (Row Level Security)
ALTER TABLE trainer_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_disciplines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trainer_disciplines
-- Gym owners/managers can view and manage trainer disciplines for their gym
CREATE POLICY "Gym owners can view all trainer disciplines for their gym"
  ON trainer_disciplines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = (
        SELECT d.gym_id FROM disciplines d WHERE d.id = trainer_disciplines.discipline_id
      )
      AND user_roles.role IN ('gym_owner', 'manager', 'admin')
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Gym owners can insert trainer disciplines for their gym"
  ON trainer_disciplines
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = (
        SELECT d.gym_id FROM disciplines d WHERE d.id = trainer_disciplines.discipline_id
      )
      AND user_roles.role IN ('gym_owner', 'manager', 'admin')
    )
  );

CREATE POLICY "Gym owners can update trainer disciplines for their gym"
  ON trainer_disciplines
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = (
        SELECT d.gym_id FROM disciplines d WHERE d.id = trainer_disciplines.discipline_id
      )
      AND user_roles.role IN ('gym_owner', 'manager', 'admin')
    )
  );

CREATE POLICY "Gym owners can delete trainer disciplines for their gym"
  ON trainer_disciplines
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = (
        SELECT d.gym_id FROM disciplines d WHERE d.id = trainer_disciplines.discipline_id
      )
      AND user_roles.role IN ('gym_owner', 'manager', 'admin')
    )
  );

-- RLS Policies for member_disciplines
CREATE POLICY "Gym owners can view all member disciplines for their gym"
  ON member_disciplines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = (
        SELECT d.gym_id FROM disciplines d WHERE d.id = member_disciplines.discipline_id
      )
      AND user_roles.role IN ('gym_owner', 'manager', 'admin', 'coach', 'trainer')
    )
    OR member_id = (
      SELECT m.id FROM members m
      JOIN user_roles ur ON ur.user_id = m.user_id
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Gym owners can insert member disciplines for their gym"
  ON member_disciplines
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = (
        SELECT d.gym_id FROM disciplines d WHERE d.id = member_disciplines.discipline_id
      )
      AND user_roles.role IN ('gym_owner', 'manager', 'admin', 'coach', 'trainer')
    )
  );

CREATE POLICY "Gym owners can update member disciplines for their gym"
  ON member_disciplines
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = (
        SELECT d.gym_id FROM disciplines d WHERE d.id = member_disciplines.discipline_id
      )
      AND user_roles.role IN ('gym_owner', 'manager', 'admin', 'coach', 'trainer')
    )
  );

CREATE POLICY "Gym owners can delete member disciplines for their gym"
  ON member_disciplines
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = (
        SELECT d.gym_id FROM disciplines d WHERE d.id = member_disciplines.discipline_id
      )
      AND user_roles.role IN ('gym_owner', 'manager', 'admin', 'coach', 'trainer')
    )
  );
