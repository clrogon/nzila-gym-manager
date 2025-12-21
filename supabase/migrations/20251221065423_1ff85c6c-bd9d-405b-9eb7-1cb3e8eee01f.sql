-- Add is_trainer flag to user_roles for flexible trainer designation
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS is_trainer BOOLEAN DEFAULT false;

-- Create promotion_criteria table for auto-suggest promotions
CREATE TABLE IF NOT EXISTS public.promotion_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  from_rank_id UUID REFERENCES public.discipline_ranks(id) ON DELETE CASCADE,
  to_rank_id UUID NOT NULL REFERENCES public.discipline_ranks(id) ON DELETE CASCADE,
  min_months INTEGER DEFAULT 0,
  min_classes INTEGER DEFAULT 0,
  min_attendance_percent INTEGER DEFAULT 0,
  requirements TEXT,
  test_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(discipline_id, from_rank_id, to_rank_id)
);

-- Enable RLS on promotion_criteria
ALTER TABLE public.promotion_criteria ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotion_criteria
CREATE POLICY "Users can view promotion criteria"
ON public.promotion_criteria FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.disciplines d
    WHERE d.id = promotion_criteria.discipline_id
    AND has_gym_role(auth.uid(), d.gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role])
  )
);

CREATE POLICY "Admins can manage promotion criteria"
ON public.promotion_criteria FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.disciplines d
    WHERE d.id = promotion_criteria.discipline_id
    AND has_gym_role(auth.uid(), d.gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role])
  )
);

-- Add additional columns to locations for multi-site support
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'room',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS equipment TEXT[],
ADD COLUMN IF NOT EXISTS floor_number INTEGER,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create index for trainer queries
CREATE INDEX IF NOT EXISTS idx_user_roles_is_trainer ON public.user_roles(is_trainer) WHERE is_trainer = true;

-- Add updated_at trigger for promotion_criteria
CREATE TRIGGER update_promotion_criteria_updated_at
  BEFORE UPDATE ON public.promotion_criteria
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();