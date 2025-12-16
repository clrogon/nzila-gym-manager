-- Add workout template link to classes for class-workout integration
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS workout_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL;

-- Add promotion criteria to discipline_ranks for auto-promotion system
ALTER TABLE public.discipline_ranks 
ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '{"min_classes": 0, "min_days_in_rank": 0, "performance_requirements": []}'::jsonb;

-- Add muscle_groups column to gym_exercises if not exists (for filtering)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gym_exercises' 
    AND column_name = 'muscle_groups'
  ) THEN
    ALTER TABLE public.gym_exercises ADD COLUMN muscle_groups TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create index for faster exercise filtering
CREATE INDEX IF NOT EXISTS idx_gym_exercises_category ON public.gym_exercises(category);
CREATE INDEX IF NOT EXISTS idx_gym_exercises_muscle_groups ON public.gym_exercises USING GIN(muscle_groups);
CREATE INDEX IF NOT EXISTS idx_classes_workout_template ON public.classes(workout_template_id);

-- Comment on new columns
COMMENT ON COLUMN public.classes.workout_template_id IS 'Optional workout template assigned to this class';
COMMENT ON COLUMN public.discipline_ranks.criteria IS 'JSON criteria for auto-promotion eligibility (min_classes, min_days_in_rank, performance_requirements)';