-- ============================================================================
-- Discipline Enhancements: Cascade Deactivation, Rank Tracking, Class Properties
-- ============================================================================
-- This migration adds:
-- 1. is_mandatory flag to classes and class_series
-- 2. difficulty and rank level tracking to exercises and workouts
-- 3. discipline_id to gym_workouts
-- 4. is_active flags for cascade deactivation
-- 5. Triggers for discipline deactivation cascading
-- ============================================================================

-- Add discipline_id to gym_workouts for proper FK relationship
ALTER TABLE gym_workouts 
ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES disciplines(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_gym_workouts_discipline_id ON gym_workouts(discipline_id);
CREATE INDEX IF NOT EXISTS idx_gym_workouts_gym_discipline ON gym_workouts(gym_id, discipline_id);

-- Add is_mandatory flag to classes and class_series
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false;

ALTER TABLE class_series 
ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false;

-- Add is_active to classes for availability tracking
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active to workout_templates for cascade deactivation
ALTER TABLE workout_templates 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add difficulty and rank levels to gym_exercises
ALTER TABLE gym_exercises 
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS min_rank_level INTEGER,
ADD COLUMN IF NOT EXISTS max_rank_level INTEGER;

-- Add rank levels to workout_templates
ALTER TABLE workout_templates 
ADD COLUMN IF NOT EXISTS min_rank_level INTEGER,
ADD COLUMN IF NOT EXISTS max_rank_level INTEGER;

-- Add rank levels to gym_workouts
ALTER TABLE gym_workouts 
ADD COLUMN IF NOT EXISTS min_rank_level INTEGER,
ADD COLUMN IF NOT EXISTS max_rank_level INTEGER;

-- ============================================================================
-- Triggers for Cascade Deactivation
-- ============================================================================

-- Function to cascade discipline deactivation
CREATE OR REPLACE FUNCTION cascade_discipline_deactivation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    -- Deactivate all classes with this discipline
    UPDATE classes 
    SET is_active = false 
    WHERE discipline_id = NEW.id;
    
    -- Deactivate all workout templates with this discipline
    UPDATE workout_templates 
    SET is_active = false 
    WHERE discipline_id = NEW.id;
    
    -- Deactivate all gym workouts with this discipline
    UPDATE gym_workouts 
    SET is_active = false 
    WHERE discipline_id = NEW.id;
    
    -- Deactivate all gym exercises with this discipline
    UPDATE gym_exercises 
    SET is_active = false 
    WHERE discipline_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS discipline_deactivation_trigger ON disciplines;
CREATE TRIGGER discipline_deactivation_trigger
AFTER UPDATE ON disciplines
FOR EACH ROW
EXECUTE FUNCTION cascade_discipline_deactivation();

-- ============================================================================
-- Views
-- ============================================================================

-- Create or replace view for active classes with discipline info
CREATE OR REPLACE VIEW public.active_classes AS
SELECT 
  c.*,
  d.name as discipline_name,
  d.category as discipline_category,
  d.is_active as discipline_is_active
FROM classes c
LEFT JOIN disciplines d ON c.discipline_id = d.id
WHERE c.is_active = true;

-- Create or replace view for active workout templates with discipline info
CREATE OR REPLACE VIEW public.active_workout_templates AS
SELECT 
  wt.*,
  d.name as discipline_name,
  d.category as discipline_category,
  d.is_active as discipline_is_active
FROM workout_templates wt
LEFT JOIN disciplines d ON wt.discipline_id = d.id
WHERE wt.is_active = true;

-- Create or replace view for active gym workouts with discipline info
CREATE OR REPLACE VIEW public.active_gym_workouts AS
SELECT 
  gw.*,
  d.name as discipline_name,
  d.category as discipline_category,
  d.is_active as discipline_is_active
FROM gym_workouts gw
LEFT JOIN disciplines d ON gw.discipline_id = d.id
WHERE gw.is_active = true;

-- Create or replace view for active gym exercises with discipline info
CREATE OR REPLACE VIEW public.active_gym_exercises AS
SELECT 
  ge.*,
  d.name as discipline_name,
  d.category as discipline_category,
  d.is_active as discipline_is_active
FROM gym_exercises ge
LEFT JOIN disciplines d ON ge.discipline_id = d.id
WHERE ge.is_active = true;

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_discipline_is_active ON classes(discipline_id, is_active);
CREATE INDEX IF NOT EXISTS idx_classes_mandatory ON classes(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_class_series_mandatory ON class_series(is_mandatory);

CREATE INDEX IF NOT EXISTS idx_workout_templates_is_active ON workout_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_workout_templates_discipline_is_active ON workout_templates(discipline_id, is_active);
CREATE INDEX IF NOT EXISTS idx_workout_templates_rank_level ON workout_templates(min_rank_level, max_rank_level);

CREATE INDEX IF NOT EXISTS idx_gym_workouts_discipline_is_active ON gym_workouts(discipline_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gym_workouts_rank_level ON gym_workouts(min_rank_level, max_rank_level);

CREATE INDEX IF NOT EXISTS idx_gym_exercises_difficulty ON gym_exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_gym_exercises_discipline_is_active ON gym_exercises(discipline_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gym_exercises_rank_level ON gym_exercises(min_rank_level, max_rank_level);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Update existing RLS to consider is_active flag

-- Allow viewing only active classes for regular members
CREATE POLICY "Members can only view active classes"
  ON classes
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = classes.gym_id
      AND user_roles.role IN ('gym_owner', 'manager', 'admin', 'coach', 'trainer')
    )
  );

-- Allow viewing only active workout templates for regular members
CREATE POLICY "Members can only view active workout templates"
  ON workout_templates
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = workout_templates.gym_id
      AND user_roles.role IN ('gym_owner', 'manager', 'admin', 'coach', 'trainer')
    )
  );

-- Allow viewing only active gym workouts for regular members
CREATE POLICY "Members can only view active gym workouts"
  ON gym_workouts
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = gym_workouts.gym_id
      AND user_roles.role IN ('gym_owner', 'manager', 'admin', 'coach', 'trainer')
    )
  );

-- Allow viewing only active gym exercises for regular members
CREATE POLICY "Members can only view active gym exercises"
  ON gym_exercises
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = gym_exercises.gym_id
      AND user_roles.role IN ('gym_owner', 'manager', 'admin', 'coach', 'trainer')
    )
  );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN classes.is_mandatory IS 'Whether this class is mandatory for participants (e.g., assessment, belt test, required session)';
COMMENT ON COLUMN classes.is_active IS 'Whether this class is currently available for booking';
COMMENT ON COLUMN class_series.is_mandatory IS 'Whether all classes in this series are mandatory';

COMMENT ON COLUMN workout_templates.is_active IS 'Whether this workout template is available for use';
COMMENT ON COLUMN workout_templates.min_rank_level IS 'Minimum discipline rank level required for this workout (NULL = no minimum)';
COMMENT ON COLUMN workout_templates.max_rank_level IS 'Maximum discipline rank level for this workout (NULL = no maximum)';

COMMENT ON COLUMN gym_exercises.difficulty IS 'Exercise difficulty level: beginner, intermediate, advanced, expert';
COMMENT ON COLUMN gym_exercises.min_rank_level IS 'Minimum discipline rank level for this exercise (NULL = no minimum)';
COMMENT ON COLUMN gym_exercises.max_rank_level IS 'Maximum discipline rank level for this exercise (NULL = no maximum)';

COMMENT ON COLUMN gym_workouts.discipline_id IS 'Associated discipline for this workout';
COMMENT ON COLUMN gym_workouts.min_rank_level IS 'Minimum discipline rank level for this workout (NULL = no minimum)';
COMMENT ON COLUMN gym_workouts.max_rank_level IS 'Maximum discipline rank level for this workout (NULL = no maximum)';

COMMENT ON FUNCTION cascade_discipline_deactivation() IS 'Automatically deactivates related classes, workouts, and exercises when a discipline is deactivated';
